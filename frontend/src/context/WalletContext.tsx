import React, { createContext, useState, useContext, ReactNode } from 'react';

interface WalletContextType {
  privateKey: string;
  contractAddress: string;
  setWalletData: (privateKey: string, contractAddress: string) => void;
  clearWalletData: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [privateKey, setPrivateKey] = useState<string>('');
  const [contractAddress, setContractAddress] = useState<string>('');

  const setWalletData = (key: string, address: string) => {
    setPrivateKey(key);
    setContractAddress(address);
  };

  const clearWalletData = () => {
    setPrivateKey('');
    setContractAddress('');
  };

  return (
    <WalletContext.Provider value={{ privateKey, contractAddress, setWalletData, clearWalletData }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
} 