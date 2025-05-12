import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TransactionForm from '../components/TransactionForm';
import { useWallet } from '../context/WalletContext';
import '../styles/TransactionPage.css';

const TransactionPage: React.FC = () => {
  const navigate = useNavigate();
  const { privateKey, contractAddress } = useWallet();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!privateKey || !contractAddress) {
      navigate('/login');
      return;
    }
    setIsLoading(false);
  }, [privateKey, contractAddress, navigate]);

  // Обработчик возврата на главную
  const handleBackToHome = () => {
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <h3>Загрузка формы транзакций...</h3>
      </div>
    );
  }

  return (
    <div className="transaction-page">
      <div className="transaction-content">
        <TransactionForm 
          privateKey={privateKey} 
          contract_address={contractAddress} 
        />
      </div>
    </div>
  );
};

export default TransactionPage; 