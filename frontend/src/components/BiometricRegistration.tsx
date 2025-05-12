import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import '../styles/BiometricRegistration.css';
import { deriveEthAddressFromKey, encryptHex_Node, shrinkHexWithSHA256} from '../utils/Web3';
import FuzzyExtractor from '../utils/Fuzzy2';

interface BiometricRegistrationProps {
  onComplete: (biometricData: any) => void;
  isSubmitting?: boolean;
}

const BiometricRegistration: React.FC<BiometricRegistrationProps> = ({ onComplete, isSubmitting = false }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [face_helper, setFaceHelper] = useState('')
  const [face_key, setFaceKey] = useState('')
  const [password, setPassword] = useState('')
  const [secret, setSecret] = useState('')
  const [faceDetected, setFaceDetected] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  
  useEffect(() => {
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
          faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
          faceapi.nets.ssdMobilenetv1.loadFromUri('/models')
        ]);
        setIsModelLoaded(true);
        startVideo();
      } catch (error) {
        console.error('Error loading models:', error);
      }
    };

    loadModels();
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const runFaceDetection = () => {
      if (isModelLoaded && videoRef.current && !capturedImage && isVideoReady) {
        intervalId = setInterval(async () => {
          if (!videoRef.current || !canvasRef.current || !videoRef.current.videoWidth) return;

          try {
            const detections = await faceapi.detectAllFaces(
              videoRef.current,
              new faceapi.TinyFaceDetectorOptions({
                inputSize: 128,
                scoreThreshold: 0.5
              })
            ).withFaceLandmarks().withFaceDescriptors();

            if (detections.length > 0) {
              setFaceDetected(true);
              const canvas = canvasRef.current;
              const displaySize = { width: videoRef.current.videoWidth, height: videoRef.current.videoHeight };
              faceapi.matchDimensions(canvas, displaySize);
              
              const resizedDetections = faceapi.resizeResults(detections, displaySize);
              canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
              faceapi.draw.drawDetections(canvas, resizedDetections);
              faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

              //
              const tempCanvas = document.createElement('canvas');
              tempCanvas.width = videoRef.current.videoWidth;
              tempCanvas.height = videoRef.current.videoHeight;
              tempCanvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
              
              const imageDataUrl = tempCanvas.toDataURL('image/jpeg');
              setCapturedImage(imageDataUrl);
              stopCamera();
              const gen = new FuzzyExtractor(16, 8);
              
              // helper generation
              const { keyHex, helperJson } = gen.generate(detections[0].descriptor);
              setFaceHelper(helperJson);
              setFaceKey(keyHex);
              clearInterval(intervalId);
            } else {
              setFaceDetected(false);
              canvasRef.current.getContext('2d')?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            }
          } catch (error) {
            console.error('Face detection error:', error);
          }
        }, 100);
      }
    };

    runFaceDetection();

  }, [isModelLoaded, capturedImage, isVideoReady, ]);

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  };

  const handleVideoReady = () => {
    if (videoRef.current && videoRef.current.videoWidth > 0) {
      setIsVideoReady(true);
    }
  };


  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const encryptedKey = shrinkHexWithSHA256(encryptHex_Node(face_key, password));
    const encryptedKey2 = shrinkHexWithSHA256(encryptHex_Node(face_key, secret));
    const ethAddress = deriveEthAddressFromKey('0x'+encryptedKey);
    const ethAddress2 = deriveEthAddressFromKey('0x'+encryptedKey2);
    onComplete({
      address1: ethAddress,
      address2: ethAddress2,
      faceKey: face_key,
      faceHelper: face_helper,
      key1: '0x'+encryptedKey,
      key2: '0x'+encryptedKey2
    });
  };

  return (
    <div className="biometric-registration">
      <h3>Биометрическая регистрация</h3>
      {!faceDetected && !capturedImage && (
        <div>
          <p>Для создания уникальной энтропии по вашему лицу необходимо включить камеру<br /> и поместить лицо, пока оно не будет обнаружено системой.</p>
          
          <div className="video-container">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              width="640"
              height="480"
              onLoadedMetadata={handleVideoReady}
            />
            <canvas ref={canvasRef} width="640" height="480" className="face-canvas" />
          </div>
        </div>
      )}
      {faceDetected && capturedImage && (
        <div className="captured-image">
          <img src={capturedImage} alt="Captured face" />
          <p>Уникальная энтропия создана. Теперь необходимо придумать пароль и секретную фразу, на базе которых мы создадим приватные ключи - для совершения транзакций(пароль) и восстановления доступа к кошельку(секретная фраза).</p>
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="password">Пароль для адреса совершения транзакций</label>
              <input
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введите пароль"
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="form-group">
              <label htmlFor="secret">Секретная фраза для восстановления</label>
              <input
                id="secret"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="Введите секретную фразу"
                required
                disabled={isSubmitting}
              />
            </div>
            <button 
              type="submit" 
              className="submit-button"
              disabled={isSubmitting}
              style={{ 
                opacity: isSubmitting ? 0.7 : 1,
                cursor: isSubmitting ? 'not-allowed' : 'pointer'
              }}
            >
              {isSubmitting ? 'Загрузка...' : 'Продолжить'}
            </button>
          </form>
        </div>
      )}


      {(!isModelLoaded || !isVideoReady) && (
        <div className="loading">
          {!isModelLoaded ? 'Загрузка моделей распознавания...' : 'Инициализация камеры...'}
        </div>
      )}
    </div>
  );
};

export default BiometricRegistration; 