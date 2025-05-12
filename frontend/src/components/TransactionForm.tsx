import React, {useState, useEffect} from 'react';
import '../styles/TransactionForm.css';
import {Web3} from 'web3';
import axios, {AxiosError} from 'axios';
import tokensConfig from '../config/tokens.json';
import networkConfig from '../config/network.json';

// ABI для ERC20 токенов (только нужные методы)
const ERC20_ABI = [
  {
    "constant": true,
    "inputs": [{"name": "_owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "balance", "type": "uint256"}],
    "type": "function"
  }
];

interface TransactionFormProps {
  privateKey: string;
  contract_address: string;
}

const TransactionForm: React.FC<TransactionFormProps> = ({privateKey, contract_address}) => {
  const apiUrl = process.env.REACT_APP_API_URL;
  const rpcUrl = networkConfig.rpc_url;
  
  const [native_amount, setNative_amount] = useState('');
  const [token_amount, setToken_amount] = useState('');
  const [destination, setDestination] = useState('');
  const [transactionType, setTransactionType] = useState('native'); // 'native' или 'token'
  const [selectedToken, setSelectedToken] = useState(Object.keys(tokensConfig)[0]);
  const [nativeBalance, setNativeBalance] = useState<string>('0');
  const [tokenBalance, setTokenBalance] = useState<string>('0');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [isBalanceUpdating, setIsBalanceUpdating] = useState<boolean>(false);

  // Загрузка балансов при первой загрузке страницы и при изменении contract_address
  useEffect(() => {
    fetchBalances();
  }, [contract_address]);

  // Функция для обновления балансов
  const fetchBalances = async () => {
    setIsBalanceUpdating(true);
    setIsLoading(true);
    try {
      const web3 = new Web3(rpcUrl);
      
      // Получаем баланс нативной валюты
      const balance = await web3.eth.getBalance(contract_address);
      const formattedBalance = web3.utils.fromWei(balance, 'ether');
      
      // Убедимся, что баланс установлен как валидное число в строковом представлении
      // Некоторые библиотеки возвращают строки с запятыми вместо точек
      const cleanBalance = formattedBalance.toString().replace(',', '.');
      setNativeBalance(cleanBalance);
      
      // Получаем баланс текущего токена
      await fetchTokenBalance(selectedToken, web3);
      
    } catch (error) {
      console.error('Ошибка при получении баланса:', error);
    } finally {
      setIsBalanceUpdating(false);
      setIsLoading(false);
    }
  };
  
  // Функция обновления баланса после транзакции
  const updateBalanceAfterTransaction = async () => {
    setIsBalanceUpdating(true);
    
    // Ждем некоторое время для обработки транзакции
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    
    try {
      // Сначала ждем 2 секунды
      await delay(4000);
      await fetchBalances();
    } catch (error) {
      console.error('Ошибка при обновлении баланса:', error);
    } finally {
      setIsBalanceUpdating(false);
    }
  };
  
  // Копирование адреса в буфер обмена
  const copyAddressToClipboard = () => {
    navigator.clipboard.writeText(contract_address)
      .then(() => {
        setCopySuccess(true);
        // Сбрасываем состояние через 2 секунды
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch(err => {
        console.error('Ошибка при копировании: ', err);
      });
  };

  // Получение баланса конкретного токена
  const fetchTokenBalance = async (tokenSymbol: string, web3Instance: Web3) => {
    try {
      const tokenInfo = tokensConfig[tokenSymbol as keyof typeof tokensConfig];
      const tokenContract = new web3Instance.eth.Contract(
        ERC20_ABI as any, 
        tokenInfo.address
      );
      
      const balance = await tokenContract.methods.balanceOf(contract_address).call();
      console.log(`Получен баланс токена ${tokenSymbol} (raw):`, balance);
      
      // Приводим к нужному формату с учетом decimals токена
      const rawBalance = Number(balance) / (10 ** tokenInfo.decimals);
      // Используем toFixed для ограничения знаков после запятой
      const formattedBalance = rawBalance.toFixed(tokenInfo.decimals);
      console.log(`Получен баланс токена ${tokenSymbol} (formatted):`, formattedBalance);
      
      setTokenBalance(formattedBalance);
    } catch (error) {
      console.error(`Ошибка при получении баланса токена ${tokenSymbol}:`, error);
      setTokenBalance('0');
    }
  };

  // Установка максимального количества токенов в зависимости от баланса
  const setMaxAmount = () => { 
    if (transactionType === 'native') {
      try {
        // Убедимся, что строка баланса содержит действительное число
        // и при необходимости заменим запятые на точки
        const cleanBalance = nativeBalance.replace(',', '.');
        const balance = parseFloat(cleanBalance);
        
        if (isNaN(balance) || balance <= 0) {
          setNative_amount('0');
          return;
        }
        
        // Устанавливаем всю доступную сумму
        const formattedAmount = balance.toFixed(6);
        setNative_amount(formattedAmount);
      } catch (error) {
        setNative_amount('0');
      }
    } else {
      // Для токенов устанавливаем весь доступный баланс
      setToken_amount(tokenBalance);
    }
  };

  // Проверка, не превышает ли введенная сумма баланс
  const validateAmount = (value: string, type: 'native' | 'token') => {
    // Если пустая строка, просто устанавливаем пустую строку
    if (value === '') {
      if (type === 'native') {
        setNative_amount('');
      } else {
        setToken_amount('');
      }
      return;
    }
    
    // Если невалидное число или отрицательное, игнорируем
    const amount = parseFloat(value);
    if (isNaN(amount) || amount < 0) return;
    
    if (type === 'native') {
      // Проверяем баланс нативной валюты
      const balance = parseFloat(nativeBalance);
      if (amount > balance) {
        // Если превышает, устанавливаем макс. значение
        setNative_amount(nativeBalance);
      } else {
        setNative_amount(value);
      }
    } else {
      // Проверяем баланс токена
      const balance = parseFloat(tokenBalance);
      if (amount > balance) {
        // Если превышает, устанавливаем макс. значение
        setToken_amount(tokenBalance);
      } else {
        setToken_amount(value);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (transactionType === 'native') {
      await handleNativeTransaction();
    } else {
      await handleTokenTransaction();
    }
  };

  const handleNativeTransaction = async () => {
    setIsSubmitting(true);
    try {
      if (!destination || !native_amount) {
        alert('Пожалуйста, заполните все поля');
        setIsSubmitting(false);
        return;
      }

      const web3 = new Web3(rpcUrl);
      const message = web3.utils.soliditySha3(
        {t: 'address', v: destination},
        {t: 'uint256', v: web3.utils.toWei(native_amount, 'ether')},
        {t: 'bytes', v: '0x'}
      );
      
      if (!message) {
        throw new Error('Не удалось создать подпись транзакции');
      }
      
      const {signature} = web3.eth.accounts.sign(
        message as string,
        privateKey as string
      );
      
      const response = await axios.post(apiUrl + '/api/account/execute/' + contract_address, {
        dest: destination,
        value: web3.utils.toWei(native_amount, 'ether'),
        func: '0x',
        signature: signature
      });
      
      alert('Транзакция отправлена ' + response.data.txid);
      
      // Сбрасываем поля формы
      setNative_amount('');
      setDestination('');
      
      // Обновляем баланс после отправки
      updateBalanceAfterTransaction();
      
    } catch (error) {
      if (error instanceof AxiosError) {
        console.error('Ошибка на сервере:', error.response?.data);
        alert('Ошибка: ' + (error.response?.data.detail || 'Транзакция не выполнена'));
      } else {
        console.error('Network error:', error instanceof Error ? error.message : 'Unknown error');
        alert('Ошибка сети: Проверьте ваше соединение');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTokenTransaction = async () => {
    setIsSubmitting(true);
    try {
      if (!destination || !token_amount) {
        alert('Пожалуйста, заполните все поля');
        setIsSubmitting(false);
        return;
      }
      
      const web3 = new Web3(rpcUrl);
      const tokenInfo = tokensConfig[selectedToken as keyof typeof tokensConfig];
      const tokenAddress = tokenInfo.address;
      const decimals = tokenInfo.decimals;
      
      // Преобразуем сумму с учетом decimals токена
      const tokenValue = Number(token_amount) * (10 ** decimals);
      
      const data = web3.eth.abi.encodeFunctionCall({
        name: 'transfer',
        type: 'function',
        inputs: [
          {type: 'address', name: 'to'},
          {type: 'uint256', name: 'value'}
        ]
      }, [destination, tokenValue.toString()]);

      const message = web3.utils.soliditySha3(
        {t: 'address', v: tokenAddress},
        {t: 'uint256', v: 0},
        {t: 'bytes', v: data}
      );
      
      if (!message) {
        throw new Error('Не удалось создать подпись транзакции');
      }
      
      const {signature} = web3.eth.accounts.sign(
        message as string,
        privateKey as string
      );
      
      const response = await axios.post(apiUrl + '/api/account/execute/' + contract_address, {
        dest: tokenAddress,
        value: "0",
        func: data,
        signature: signature
      });
      
      alert('Транзакция отправлена ' + response.data.txid);
      
      // Сбрасываем поля формы
      setToken_amount('');
      setDestination('');
      
      // Обновляем баланс после отправки
      updateBalanceAfterTransaction();
      
    } catch (error) {
      if (error instanceof AxiosError) {
        console.error('Ошибка на сервере:', error.response?.data);
        alert('Ошибка: ' + (error.response?.data.detail || 'Транзакция не выполнена'));
      } else {
        console.error('Network error:', error instanceof Error ? error.message : 'Unknown error');
        alert('Ошибка сети: Проверьте ваше соединение');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Если загрузка, показываем соответствующее состояние
  if (isLoading) {
    return (
      <div className="transaction-form-container">
        <div className="transaction-form-box loading">
          <h3>Загрузка данных кошелька</h3>
          <p>Пожалуйста, подождите, загружаем информацию о балансе...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="transaction-form-container">
      <div className="transaction-form-box">
        <h3>Отправка транзакции</h3>
        
        <div className="balance-info">
          <div className="wallet-address-container">
            <p className="wallet-address">
              <span className="label-text">Ваш адрес:</span> <span className="address-value">{contract_address}</span>
            </p>
            <button 
              type="button" 
              className="copy-button" 
              onClick={copyAddressToClipboard}
              title="Копировать адрес"
            >
              {copySuccess ? 'Скопировано!' : 'Копировать'}
            </button>
          </div>
          {isBalanceUpdating ? (
            <p className="balance-loading">Обновление баланса...</p>
          ) : (
            <div className="balance-container">
              <p className="balance">
                <span className="label-text">Баланс:</span> {transactionType === 'native' 
                  ? `${nativeBalance} ${networkConfig.base_token}` 
                  : `${tokenBalance} ${selectedToken}`}
              </p>
              <button 
                type="button" 
                className="reload-button" 
                onClick={fetchBalances}
              >
                Обновить баланс
              </button>
            </div>
          )}
        </div>
        
        <div className="transaction-type-selector">
          <button 
            className={`type-button ${transactionType === 'native' ? 'active' : ''}`}
            onClick={() => {
              setTransactionType('native')
              fetchBalances()
            }}
            type="button"
          >
            Нативные токены
          </button>
          <button 
            className={`type-button ${transactionType === 'token' ? 'active' : ''}`}
            onClick={() => {
              setTransactionType('token')
              fetchBalances()
            }}
            type="button"
          >
            Токены
          </button>
        </div>

        <form onSubmit={handleSubmit} className="transaction-form">
          {transactionType === 'token' && (
            <div className="form-group">
              <label htmlFor="token-select">Выберите токен</label>
              <select
                id="token-select"
                value={selectedToken}
                onChange={(e) => {
                  setSelectedToken(e.target.value);
                  fetchBalances();
                }}
                className="token-select"
                required
                disabled={isSubmitting}
              >
                {Object.keys(tokensConfig).map((token) => (
                  <option key={token} value={token}>
                    {token}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <div className="form-group">
            <div className="form-group-header">
              <label htmlFor="amount">Количество</label>
              <button 
                type="button" 
                className="max-button" 
                onClick={setMaxAmount}
                disabled={isSubmitting}
              >
                MAX
              </button>
            </div>
            <input
              type="number"
              id="amount"
              min="0"
              step="any"
              value={transactionType === 'native' ? native_amount : token_amount}
              onChange={(e) => {
                if (transactionType === 'native') {
                  validateAmount(e.target.value, 'native');
                } else {
                  validateAmount(e.target.value, 'token');
                }
              }}
              placeholder="Введите количество токенов"
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="form-group">
            <label htmlFor="destination">Адрес получателя</label>
            <input
              type="text"
              id="destination"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="Введите адрес получателя"
              required
              disabled={isSubmitting}
            />
          </div>
          <button 
            type="submit" 
            className="submit-button"
            disabled={isSubmitting || isBalanceUpdating}
            style={{ 
              opacity: (isSubmitting || isBalanceUpdating) ? 0.7 : 1,
              cursor: (isSubmitting || isBalanceUpdating) ? 'not-allowed' : 'pointer'
            }}
          >
            {isSubmitting ? 'Отправка транзакции...' : 'Отправить'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TransactionForm; 