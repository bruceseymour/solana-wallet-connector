# Solana Wallet Connector

A modern, responsive web application built with Next.js 14 that provides seamless wallet connection and interaction capabilities for Solana blockchain applications. This connector supports multiple wallet providers and offers a clean, user-friendly interface for wallet management.

## Features

- 🔌 Easy wallet connection and management
- 🌐 Multi-network support (Mainnet, Devnet, Testnet)
- 👛 Multiple wallet support (Phantom, Solflare)
- 🎨 Modern dark theme UI
- ⚡ Fast and responsive interface
- 🛡️ Secure connection handling

## Technology Stack

### Core Dependencies
- **Next.js 14**: React framework for production
- **TypeScript**: For type-safe code
- **Tailwind CSS**: For styling and responsive design

### Solana Ecosystem
- **@solana/web3.js**: Core Solana web3 functionality
- **@solana/wallet-adapter-react**: React hooks for Solana wallet integration
- **@solana/wallet-adapter-base**: Base utilities for wallet adapters
- **@solana/wallet-adapter-wallets**: Wallet adapter implementations
- **@solana/spl-token**: SPL Token program interactions

## Getting Started

### Prerequisites
- Node.js (LTS version)
- npm or yarn
- A modern web browser
- Solana wallet extension (Phantom or Solflare)

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd solana-token-tracker
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a .env file in the root directory:
```env
NEXT_PUBLIC_ALCHEMY_RPC_URL=your_alchemy_rpc_url
NEXT_PUBLIC_ALCEMY_API_KEY=your_alchemy_api_key
NEXT_PUBLIC_ALCEMY_APP_ID=your_alchemy_app_id
```

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Architecture

### Component Structure
- **WalletContextProvider**: Manages wallet connection and RPC endpoint configuration
- **TokenBalance**: Handles token fetching and display
- **NetworkSelector**: Network selection and management

### Key Features

#### RPC Endpoint Management
- Primary endpoint through Alchemy
- Fallback to public endpoints
- Automatic retry mechanism
- Connection timeout handling

#### Token Balance Tracking
- Fetches token accounts
- Parses token metadata
- Separates known and unknown tokens
- Displays token icons and balances

#### Error Handling
- Comprehensive error messaging
- Automatic retries (max 3 attempts)
- Graceful fallback mechanisms
- User-friendly error displays

## Configuration

### Supported Networks
- Mainnet-beta (Primary)
- Devnet
- Testnet

### Supported Wallets
- Phantom Wallet
- Solflare Wallet

## Development

### Code Style
- Functional components with hooks
- TypeScript strict mode
- ESLint configuration
- Prettier formatting

### Testing
Run the test suite:
```bash
npm test
# or
yarn test
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Solana Foundation for their excellent documentation
- Alchemy for providing reliable RPC endpoints
- The Solana developer community
