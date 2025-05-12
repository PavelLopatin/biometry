import React, {useState} from 'react';
import '../styles/AuthForm.css';
import BiometricRegistration from './BiometricRegistration';
import axios, {AxiosError} from 'axios';
import {useNavigate} from 'react-router-dom';
import {useWallet} from '../context/WalletContext';

const RegisterForm: React.FC = () => {
    const navigate = useNavigate();
    const {setWalletData} = useWallet();
    const apiUrl = process.env.REACT_APP_API_URL;
    const [email, setEmail] = useState('');
    const [showBiometric, setShowBiometric] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setShowBiometric(true);
    };

    const handleBiometricComplete = async (biometricData: any) => {
        setIsLoading(true);
        setIsSubmitting(true);

        try {
            const response = await axios.post(apiUrl + '/api/auth/sign-up', {
                email,
                signer: biometricData.address1,
                recovery_signer: biometricData.address2,
                helper: biometricData.faceHelper,
            });

            const contractAddress = response.data.contract_address;
            setWalletData(biometricData.key1, contractAddress);
            navigate('/transactions');

        } catch (error) {
            setIsLoading(false);
            setIsSubmitting(false);
            if (error instanceof AxiosError) {
                console.error('Ошибка на сервере:', error.response?.data);
                alert(error.response?.data.detail || 'Sign-up failed');
            } else {
                console.error('Network error:', error instanceof Error ? error.message : 'Unknown error');
                alert('Произошла ошибка сети. Пожалуйста, попробуйте еще раз.');
            }
        }
    };

    if (showBiometric) {
        return (
            <BiometricRegistration
                onComplete={handleBiometricComplete}
                isSubmitting={isSubmitting}
            />
        );
    }

    if (isLoading) {
        return (
            <div className="auth-form-container">
                <div className="auth-form-box">
                    <h3>Загрузка...</h3>
                    <p>Пожалуйста, подождите, создаем ваш смарт-контракт...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-form-container">
            <div className="auth-form-box">
                <h3>Регистрация</h3>
                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="email">Электронная почта</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Введите email"
                            required
                        />
                    </div>
                    <button 
                        type="submit" 
                        className="submit-button"
                    >
                        Продолжить
                    </button>
                </form>
                <p className="auth-form-footer">
                    Уже есть аккаунт? <a href="/login">Войти</a>
                </p>
            </div>
        </div>
    );
};

export default RegisterForm; 