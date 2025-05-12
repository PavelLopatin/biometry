import React, {useState} from 'react';
import '../styles/AuthForm.css';
import axios, {AxiosError} from 'axios';
import BiometricAuth from './BiometricAuth';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';

const AuthForm: React.FC = () => {
    const navigate = useNavigate();
    const { setWalletData } = useWallet();
    const apiUrl = process.env.REACT_APP_API_URL;
    const [email, setEmail] = useState('');
    const [signer, setSigner] = useState('');
    const [recovery_signer, setRecovery_signer] = useState('');
    const [contract_address, setContract_address] = useState('');
    const [helper, setHelper] = useState('');
    const [password, setPassword] = useState('');
    const [showBiometricForm, setShowBiometricForm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await axios.get(apiUrl + '/api/account/get-smart-wallet-by-email/' + email);
            setSigner(response.data.signer);
            setRecovery_signer(response.data.recovery_signer);
            setContract_address(response.data.contract_address);
            setHelper(response.data.helper);
            setIsLoading(false);
            setShowBiometricForm(true);
        } catch (error) {
            setIsLoading(false);
            if (error instanceof AxiosError) {
                console.error('Ошибка на сервере:', error.response?.data);
                alert(error.response?.data.detail || 'Учетная запись не найдена');
            } else {
                console.error('Network error:', error instanceof Error ? error.message : 'Unknown error');
                alert('Произошла ошибка сети. Пожалуйста, попробуйте еще раз.');
            }
        }
    };

    const handleBiometricComplete = (biometricData: any) => {
        setWalletData(biometricData.key, contract_address);
        navigate('/transactions');
    };

    if (showBiometricForm) {
        return (
            <BiometricAuth
                signer={signer}
                helper={helper}
                password={password}
                onComplete={handleBiometricComplete}
            />
        );
    }
    
    if (isLoading) {
        return (
            <div className="auth-form-container">
                <div className="auth-form-box">
                    <h3>Загрузка...</h3>
                    <p>Пожалуйста, подождите, проверяем данные...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-form-container">
            <div className="auth-form-box">
                <h3>Вход</h3>
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
                    <div className="form-group">
                        <label htmlFor="password">Пароль</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Введите пароль"
                            required
                        />
                    </div>
                    <button type="submit" className="submit-button">
                        Войти
                    </button>
                </form>
                <p className="auth-form-footer">
                    Нет аккаунта? <a href="/register">Зарегистрироваться</a>
                </p>
            </div>
        </div>
    );
};

export default AuthForm; 