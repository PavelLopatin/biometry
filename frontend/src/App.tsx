import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Header from './components/Header';
import AuthForm from './components/AuthForm';
import RegisterForm from './components/RegisterForm';
import TransactionPage from './pages/TransactionPage';
import { WalletProvider } from './context/WalletContext';
import './styles/TransactionPage.css';

function App() {
  return (
    <Router>
      <WalletProvider>
        <div className="App">
          <Header />
          <main className="main-content">
            <Routes>
              <Route path="/login" element={<AuthForm />} />
              <Route path="/register" element={<RegisterForm />} />
              <Route path="/transactions" element={<TransactionPage />} />
              <Route path="/" element={<Navigate to="/login" replace />} />
            </Routes>
          </main>
        </div>
      </WalletProvider>
    </Router>
  );
}

export default App;
