'use client';

import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import { Connection, clusterApiUrl } from "@solana/web3.js";
import { FC, ReactNode, useMemo } from "react";
import "@solana/wallet-adapter-react-ui/styles.css";

const ENDPOINTS = {
    'mainnet-beta': [
        { url: "https://api.mainnet-beta.solana.com", name: "Solana (Primary)" },
        { url: "https://solana-api.projectserum.com", name: "Project Serum" },
        { url: "https://ssc-dao.genesysgo.net", name: "GenesysGo" }
    ],
    'devnet': [
        { url: clusterApiUrl('devnet'), name: "Devnet (Primary)" },
        { url: "https://api.devnet.solana.com", name: "Devnet (Backup)" }
    ],
    'testnet': [
        { url: clusterApiUrl('testnet'), name: "Testnet (Primary)" }
    ]
};

export const WalletContextProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const network = WalletAdapterNetwork.Mainnet;
    
    const endpoint = useMemo(() => ENDPOINTS['mainnet-beta'][0].url, []);
    
    // Create a custom connection with specific configuration
    const connection = useMemo(
        () => new Connection(endpoint, {
            commitment: 'confirmed',
            confirmTransactionInitialTimeout: 60000,
            wsEndpoint: undefined, // Disable WebSocket
        }),
        [endpoint]
    );

    const wallets = useMemo(
        () => [
            new PhantomWalletAdapter(),
            new SolflareWalletAdapter()
        ],
        []
    );

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} autoConnect>
                <WalletModalProvider>{children}</WalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
};

export default WalletContextProvider;
