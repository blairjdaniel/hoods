"use client";
import React, { useMemo } from 'react';
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
// Additional adapters removed to avoid package version conflicts during install

export default function Providers({ children }: { children: React.ReactNode }){
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => network === WalletAdapterNetwork.Devnet ? 'https://api.devnet.solana.com' : 'https://api.mainnet-beta.solana.com', [network]);
  const wallets = useMemo(() => [
    new PhantomWalletAdapter(),
  ], [network]);

  // Workaround type issues with some library JSX types in the Next.js TS build
  const ConnectionProviderAny: any = ConnectionProvider;
  const WalletProviderAny: any = WalletProvider;

  return (
    <ConnectionProviderAny endpoint={endpoint}>
      <WalletProviderAny wallets={wallets} autoConnect>
        {children}
      </WalletProviderAny>
    </ConnectionProviderAny>
  );
}
