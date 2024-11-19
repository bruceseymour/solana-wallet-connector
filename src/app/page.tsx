'use client';

import dynamic from 'next/dynamic';
import { WalletContextProvider } from '../components/WalletContextProvider';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { clusterApiUrl } from '@solana/web3.js';
import { useMemo } from 'react';
import '@solana/wallet-adapter-react-ui/styles.css';

// Dynamically import components with no SSR
const TokenBalanceWithNoSSR = dynamic(
  () => import('../components/TokenBalance'),
  { ssr: false }
);

const WalletMultiButtonDynamic = dynamic(
  async () => {
    const { WalletMultiButton } = await import('@solana/wallet-adapter-react-ui');
    return WalletMultiButton;
  },
  { ssr: false }
);

export default function Home() {
  // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
  const network = WalletAdapterNetwork.Mainnet;

  // You can also provide a custom RPC endpoint.
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  return (
    <WalletContextProvider>
      <div className="min-h-screen bg-gray-900">
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-white mb-4">
                Solana Wallet Connector
              </h1>
              <p className="text-gray-400 mb-8">
                Connect your wallet to view your token balances
              </p>
              <div className="flex justify-center mb-8">
                <WalletMultiButtonDynamic />
              </div>
            </div>
            <TokenBalanceWithNoSSR />
          </div>
        </main>
      </div>
    </WalletContextProvider>
  );
}
