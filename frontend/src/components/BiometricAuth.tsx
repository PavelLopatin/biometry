import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import '../styles/BiometricRegistration.css';
import { deriveEthAddressFromKey, encryptHex_Node, shrinkHexWithSHA256} from '../utils/Web3';
import FuzzyExtractor from '../utils/Fuzzy2';

interface BiometricAuthProps {
  signer: string;
  helper: string;
  password: string;
  onComplete: (biometricData: any) => void;
}

const BiometricAuth: React.FC<BiometricAuthProps> = ({ signer, helper, password, onComplete }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
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
      if (isModelLoaded && videoRef.current && isVideoReady) {
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
              
              const gen = new FuzzyExtractor(16, 8);
              // reproduce key by helper
              const old_key = gen.reproduce(detections[0].descriptor, helper);
              const encryptedKey = shrinkHexWithSHA256(encryptHex_Node(old_key, password));
              const ethAddress = deriveEthAddressFromKey('0x'+encryptedKey);
              if(ethAddress == signer) {
                stopCamera();
                clearInterval(intervalId);
                onComplete({key: '0x'+encryptedKey});
              } else {
                console.log('failed')
              }
             
            } else {
              canvasRef.current.getContext('2d')?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            }
          } catch (error) {
            console.error('Face detection error:', error);
          }
        }, 100);
      }
    };

    runFaceDetection();

  }, [isModelLoaded, isVideoReady]);

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


  return (
    <div className="biometric-registration">
      <h3>Биометрическая авторизация</h3>
      <p>Для авторизации необходимо снять энтропию лица</p>
      
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

      {(!isModelLoaded || !isVideoReady) && (
        <div className="loading">
          {!isModelLoaded ? 'Загрузка моделей распознавания...' : 'Инициализация камеры...'}
        </div>
      )}
    </div>
  );
};

export default BiometricAuth; 