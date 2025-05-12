abi = '''[
    {
      "inputs": [],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "_id",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "signer",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "recovery_signer",
          "type": "address"
        }
      ],
      "name": "AccountInitialized",
      "type": "event"
    },
    {
      "inputs": [],
      "name": "accountImplementation",
      "outputs": [
        {
          "internalType": "contract SimpleAccount",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "name": "contracts",
      "outputs": [
        {
          "internalType": "address",
          "name": "signer",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "recovery_signer",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "contract_address",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "contracts_ids",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "name": "contracts_signers",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "counter",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_signer",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "_recovery_signer",
          "type": "address"
        }
      ],
      "name": "createAccount",
      "outputs": [
        {
          "internalType": "contract SimpleAccount",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_signer",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "_recovery_signer",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "_id",
          "type": "uint256"
        }
      ],
      "name": "getAddress",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "_id",
          "type": "uint256"
        }
      ],
      "name": "getContract",
      "outputs": [
        {
          "components": [
            {
              "internalType": "address",
              "name": "signer",
              "type": "address"
            },
            {
              "internalType": "address",
              "name": "recovery_signer",
              "type": "address"
            },
            {
              "internalType": "address",
              "name": "contract_address",
              "type": "address"
            }
          ],
          "internalType": "struct UserContract",
          "name": "",
          "type": "tuple"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_contract",
          "type": "address"
        }
      ],
      "name": "getUserByContract",
      "outputs": [
        {
          "components": [
            {
              "internalType": "address",
              "name": "signer",
              "type": "address"
            },
            {
              "internalType": "address",
              "name": "recovery_signer",
              "type": "address"
            },
            {
              "internalType": "address",
              "name": "contract_address",
              "type": "address"
            }
          ],
          "internalType": "struct UserContract",
          "name": "",
          "type": "tuple"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_signer",
          "type": "address"
        }
      ],
      "name": "getUserBySigner",
      "outputs": [
        {
          "components": [
            {
              "internalType": "address",
              "name": "signer",
              "type": "address"
            },
            {
              "internalType": "address",
              "name": "recovery_signer",
              "type": "address"
            },
            {
              "internalType": "address",
              "name": "contract_address",
              "type": "address"
            }
          ],
          "internalType": "struct UserContract",
          "name": "",
          "type": "tuple"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
]'''
