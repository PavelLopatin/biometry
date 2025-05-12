# Smart Contracts

This directory contains Ethereum smart contracts for the biometry project.

## Overview

The contracts implement an Account Abstraction (AA) system with the following components:
- `SimpleAccount.sol`: An implementation of a smart contract account
- `SimpleAccountFactory.sol`: A factory for creating new SimpleAccount instances
- `ERC20Token.sol`: A standard ERC20 token implementation

## Setup

1. Create `.env` file by copying from `.env.example`:
```sh
cp .env.example .env
```

2. Fill in the required environment variables:
```
PRIVATE_KEY=<your-private-key>
RPC_URL=<blockchain-rpc-url>
CHAIN_ID=<chain-id>
ADDRESS=<contract-address>
```

3. Install dependencies:
```sh
npm install
# or with yarn
yarn install
```

## Development

### Deployment

Use the Hardhat scripts to deploy contracts:

```sh
npx hardhat run scripts/00_initial.js --network default
```

## Contract Details

### SimpleAccount

A contract-based account implementation with the following features:
- Executes transactions
- Manages assets
- Validates signatures

### SimpleAccountFactory

A factory for creating new SimpleAccount instances.

### ERC20Token

A standard ERC20 token implementation.

## Configuration

The project uses Hardhat as its development environment. Configuration can be found in `hardhat.config.js`.

## Scripts

The `scripts` directory contains deployment and interaction scripts:
- `00_initial.js`: Initial deployment script
