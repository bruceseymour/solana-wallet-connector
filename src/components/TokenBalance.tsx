'use client';

import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useState, useEffect, useCallback } from 'react';
import { Connection, PublicKey, clusterApiUrl, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

interface TokenMetadata {
    name: string;
    symbol: string;
    logoURI?: string;
}

interface TokenData {
    mint: string;
    balance: number;
    decimals: number;
    metadata?: TokenMetadata;
}

type NetworkType = 'mainnet-beta' | 'devnet' | 'testnet';

// Network configurations
const NETWORK_CONFIGS = {
    'mainnet-beta': {
        name: 'Mainnet',
        endpoints: [
            { url: process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL || "https://api.mainnet-beta.solana.com", name: "Alchemy (Primary)" },
            { url: "https://api.mainnet-beta.solana.com", name: "Solana (Backup)" },
            { url: "https://solana-api.projectserum.com", name: "Project Serum (Backup)" }
        ],
        tokenListUrl: 'https://raw.githubusercontent.com/solana-labs/token-list/main/src/tokens/solana.tokenlist.json'
    },
    'devnet': {
        name: 'Devnet',
        endpoints: [
            { url: clusterApiUrl('devnet'), name: "Devnet (Primary)" },
            { url: "https://api.devnet.solana.com", name: "Devnet (Backup)" }
        ],
        tokenListUrl: 'https://raw.githubusercontent.com/solana-labs/token-list/main/src/tokens/solana.tokenlist.json'
    },
    'testnet': {
        name: 'Testnet',
        endpoints: [
            { url: clusterApiUrl('testnet'), name: "Testnet (Primary)" }
        ],
        tokenListUrl: 'https://raw.githubusercontent.com/solana-labs/token-list/main/src/tokens/solana.tokenlist.json'
    }
} as const;

const sortTokens = (tokens: TokenData[]): TokenData[] => {
    // Separate known and unknown tokens
    const knownTokens = tokens.filter(token => token.metadata);
    const unknownTokens = tokens.filter(token => !token.metadata);

    // Sort known tokens by balance
    const sortedKnownTokens = knownTokens.sort((a, b) => b.balance - a.balance);
    // Sort unknown tokens by balance
    const sortedUnknownTokens = unknownTokens.sort((a, b) => b.balance - a.balance);

    return [...sortedKnownTokens, ...sortedUnknownTokens];
};

export const TokenBalance = () => {
    const { connection } = useConnection();
    const { publicKey } = useWallet();
    const [tokens, setTokens] = useState<TokenData[]>([]);
    const [solBalance, setSolBalance] = useState<number>(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [tokenList, setTokenList] = useState<Record<string, TokenMetadata>>({});
    const [selectedNetwork, setSelectedNetwork] = useState<keyof typeof NETWORK_CONFIGS>('mainnet-beta');
    const [currentEndpointIndex, setCurrentEndpointIndex] = useState(0);
    const [endpointStatus, setEndpointStatus] = useState<Record<string, 'pending' | 'success' | 'failed'>>({});
    const [retryCount, setRetryCount] = useState(0);
    const MAX_RETRIES = 3;

    const fetchTokenList = useCallback(async () => {
        try {
            const response = await fetch(NETWORK_CONFIGS[selectedNetwork].tokenListUrl);
            const data = await response.json();
            const tokenMap = data.tokens.reduce((acc: Record<string, TokenMetadata>, token: any) => {
                acc[token.address] = {
                    name: token.name,
                    symbol: token.symbol,
                    logoURI: token.logoURI
                };
                return acc;
            }, {});
            setTokenList(tokenMap);
        } catch (error) {
            console.error('Error fetching token list:', error);
        }
    }, [selectedNetwork]);

    // Reset endpoint index and fetch token list when network changes
    useEffect(() => {
        setCurrentEndpointIndex(0);
        fetchTokenList();
    }, [selectedNetwork, fetchTokenList]);

    const getCurrentEndpoint = useCallback(() => {
        const network = NETWORK_CONFIGS[selectedNetwork];
        const index = Math.min(currentEndpointIndex, network.endpoints.length - 1);
        return network.endpoints[index];
    }, [selectedNetwork, currentEndpointIndex]);

    const fetchSolBalance = useCallback(async (connection: Connection) => {
        if (!publicKey) return;
        try {
            const balance = await connection.getBalance(publicKey);
            setSolBalance(balance / LAMPORTS_PER_SOL);
        } catch (error) {
            console.error('Error fetching SOL balance:', error);
        }
    }, [publicKey]);

    const fetchTokensWithRetry = useCallback(async () => {
        if (!publicKey) return;
        
        setLoading(true);
        setError(null);
        
        const currentEndpoint = getCurrentEndpoint();
        
        try {
            if (retryCount >= MAX_RETRIES) {
                setError('Failed to fetch token data after multiple attempts. Please try again later.');
                setLoading(false);
                return;
            }

            setEndpointStatus(prev => ({ ...prev, [currentEndpoint.url]: 'pending' }));
            
            if (currentEndpointIndex > 0) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }

            const conn = new Connection(currentEndpoint.url, {
                commitment: 'confirmed',
                confirmTransactionInitialTimeout: 60000,
                wsEndpoint: undefined,
            });

            // Fetch SOL balance first
            await fetchSolBalance(conn);

            try {
                const tokenAccounts = await conn.getParsedTokenAccountsByOwner(
                    publicKey,
                    { programId: TOKEN_PROGRAM_ID },
                    'confirmed'
                );

                const tokenData = tokenAccounts.value
                    .map((account) => {
                        try {
                            const parsedInfo = account.account.data.parsed.info;
                            const mint = parsedInfo.mint;
                            return {
                                mint,
                                balance: Number(parsedInfo.tokenAmount.amount),
                                decimals: parsedInfo.tokenAmount.decimals,
                                metadata: tokenList[mint]
                            };
                        } catch (e) {
                            console.error('Error parsing token account:', e);
                            return null;
                        }
                    })
                    .filter((token): token is TokenData => 
                        token !== null && token.balance > 0
                    );

                const sortedTokens = sortTokens(tokenData);
                setTokens(sortedTokens);
                setEndpointStatus(prev => ({ ...prev, [currentEndpoint.url]: 'success' }));
                setLoading(false);
                setRetryCount(0);
            } catch (error: any) {
                throw new Error(`Failed to fetch token accounts: ${error.message}`);
            }
        } catch (err: any) {
            console.error('Error fetching token data:', err);
            setEndpointStatus(prev => ({ ...prev, [currentEndpoint.url]: 'failed' }));
            
            setRetryCount(prev => prev + 1);
            
            if (currentEndpointIndex < NETWORK_CONFIGS[selectedNetwork].endpoints.length - 1 && retryCount < MAX_RETRIES) {
                console.log(`Retrying with next endpoint (${currentEndpointIndex + 1}). Attempt ${retryCount + 1} of ${MAX_RETRIES}`);
                setCurrentEndpointIndex(prev => prev + 1);
                fetchTokensWithRetry();
            } else {
                setError('Unable to fetch token data. Please try again later.');
                setLoading(false);
            }
        }
    }, [publicKey, currentEndpointIndex, selectedNetwork, tokenList, retryCount, fetchSolBalance, getCurrentEndpoint]);

    useEffect(() => {
        if (publicKey) {
            fetchTokensWithRetry();
        }
    }, [publicKey, fetchTokensWithRetry]);

    const formatBalance = (balance: number, decimals: number): string => {
        return (balance / Math.pow(10, decimals)).toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: decimals
        });
    };

    const EndpointStatus = () => {
        const currentNetwork = NETWORK_CONFIGS[selectedNetwork];
        return (
            <div className="mb-4 p-4 bg-gray-700/50 rounded-lg">
                <h3 className="text-sm font-medium text-gray-300 mb-2">RPC Endpoints Status:</h3>
                <div className="space-y-2">
                    {currentNetwork.endpoints.map((endpoint, index) => (
                        <div key={endpoint.url} className="flex items-center justify-between">
                            <span className="text-sm text-gray-400">
                                {index + 1}. {endpoint.name}
                            </span>
                            <span className={`text-sm ${
                                !endpointStatus[endpoint.url] ? 'text-gray-500' :
                                endpointStatus[endpoint.url] === 'pending' ? 'text-yellow-500' :
                                endpointStatus[endpoint.url] === 'success' ? 'text-green-500' :
                                'text-red-500'
                            }`}>
                                {!endpointStatus[endpoint.url] ? 'Not tried' :
                                 endpointStatus[endpoint.url] === 'pending' ? 'Checking...' :
                                 endpointStatus[endpoint.url] === 'success' ? 'Success' :
                                 'Failed'}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const NetworkSelector = () => (
        <div className="mb-4 p-4 bg-gray-700/50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Network:</h3>
            <div className="flex space-x-2">
                {(Object.keys(NETWORK_CONFIGS) as NetworkType[]).map((network) => (
                    <button
                        key={network}
                        onClick={() => setSelectedNetwork(network)}
                        className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
                            selectedNetwork === network
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                        }`}
                    >
                        {NETWORK_CONFIGS[network].name}
                    </button>
                ))}
            </div>
        </div>
    );

    return (
        <div className="w-full max-w-2xl mx-auto">
            <div className="bg-gray-800 rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-100">Token Balances</h2>
                    <span className="text-xs text-gray-400">
                        {NETWORK_CONFIGS[selectedNetwork].name} - 
                        Using {getCurrentEndpoint().name}
                    </span>
                </div>

                <div className="mb-4">
                    <select
                        value={selectedNetwork}
                        onChange={(e) => setSelectedNetwork(e.target.value as keyof typeof NETWORK_CONFIGS)}
                        className="block w-full p-2 bg-gray-700 text-gray-100 border border-gray-600 rounded"
                    >
                        {Object.entries(NETWORK_CONFIGS).map(([key, config]) => (
                            <option key={key} value={key}>{config.name}</option>
                        ))}
                    </select>
                </div>

                {error && (
                    <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-4 text-gray-300">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        Loading token balances...
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* SOL Balance */}
                        <div className="p-3 rounded-lg bg-gray-700/30">
                            <div className="flex items-center">
                                <div className="flex-shrink-0 w-8 h-8 mr-3">
                                    <img
                                        src="https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png"
                                        alt="SOL"
                                        className="w-8 h-8 rounded-full"
                                    />
                                </div>
                                <div className="flex-grow">
                                    <div className="font-medium text-gray-200">
                                        Solana
                                    </div>
                                    <div className="text-sm text-gray-400">
                                        {solBalance.toLocaleString()} SOL
                                    </div>
                                </div>
                            </div>
                        </div>

                        {tokens.length > 0 && <hr className="my-6 border-gray-600" />}

                        {/* Known Tokens */}
                        {tokens.filter(token => token.metadata).length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold mb-2 text-gray-200">Known Tokens</h3>
                                <div className="space-y-2">
                                    {tokens.filter(token => token.metadata).map((token, index) => (
                                        <div key={token.mint} 
                                            className={`flex items-center p-3 rounded-lg ${
                                                index % 2 === 0 ? 'bg-gray-700/30' : 'bg-gray-700/50'
                                            }`}
                                        >
                                            <div className="flex-shrink-0 w-8 h-8 mr-3">
                                                {token.metadata?.logoURI ? (
                                                    <img
                                                        src={token.metadata.logoURI}
                                                        alt={token.metadata.symbol}
                                                        className="w-8 h-8 rounded-full"
                                                        onError={(e) => {
                                                            const target = e.target as HTMLImageElement;
                                                            target.src = 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png';
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                                                        <span className="text-xs text-gray-300">
                                                            {token.metadata?.symbol?.slice(0, 2) || '??'}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-grow">
                                                <div className="font-medium text-gray-200">
                                                    {token.metadata?.name || 'Unknown Token'}
                                                </div>
                                                <div className="text-sm text-gray-400">
                                                    {(token.balance / Math.pow(10, token.decimals)).toLocaleString()} {token.metadata?.symbol}
                                                </div>
                                            </div>
                                            <div className="text-xs text-gray-500 font-mono truncate ml-2">
                                                {token.mint.slice(0, 4)}...{token.mint.slice(-4)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Separator if both known and unknown tokens exist */}
                        {tokens.filter(token => token.metadata).length > 0 && 
                         tokens.filter(token => !token.metadata).length > 0 && (
                            <hr className="my-6 border-gray-600" />
                        )}

                        {/* Unknown Tokens */}
                        {tokens.filter(token => !token.metadata).length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold mb-2 text-gray-300">Unknown Tokens</h3>
                                <div className="space-y-2">
                                    {tokens.filter(token => !token.metadata).map((token, index) => (
                                        <div key={token.mint} 
                                            className={`flex items-center p-3 rounded-lg ${
                                                index % 2 === 0 ? 'bg-gray-700/20' : 'bg-gray-700/40'
                                            }`}
                                        >
                                            <div className="flex-shrink-0 w-8 h-8 mr-3">
                                                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                                                    <span className="text-xs text-gray-400">??</span>
                                                </div>
                                            </div>
                                            <div className="flex-grow">
                                                <div className="font-medium text-gray-400">
                                                    Unknown Token
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {(token.balance / Math.pow(10, token.decimals)).toLocaleString()} tokens
                                                </div>
                                            </div>
                                            <div className="text-xs text-gray-500 font-mono truncate ml-2">
                                                {token.mint}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TokenBalance;
