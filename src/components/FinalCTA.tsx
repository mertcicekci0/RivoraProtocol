'use client'

import React from 'react';
import { useStellarWalletContext } from '@/lib/providers/StellarWalletProvider';

interface FinalCTAProps {
  onConnectWallet: () => void;
}

const FinalCTA: React.FC<FinalCTAProps> = ({ onConnectWallet }) => {
  const { account, isConnected, isConnecting, error, isMounted, connect } = useStellarWalletContext();
  return (
    <section className="relative py-32 z-10">
      <div className="container mx-auto px-6 text-center">
        <div className="final-cta-content">
          <h2 className="final-title">
            <span className="title-word" style={{ animationDelay: '0s' }}>Begin</span>
            <span className="title-word" style={{ animationDelay: '0.2s' }}>Your</span>
            <span className="title-word gradient-text" style={{ animationDelay: '0.4s' }}>Journey</span>
          </h2>
          
          <p className="final-subtitle">
            Step into the future of decentralized finance with confidence and clarity.
          </p>
          
          <div className="mt-16">
            <div
              {...(!isMounted && {
                'aria-hidden': true,
                'style': {
                  opacity: 0,
                  pointerEvents: 'none',
                  userSelect: 'none',
                },
              })}
            >
              {!isMounted ? (
                <div className="final-cta-button group opacity-0 pointer-events-none">
                  <span className="button-text">Connect Wallet</span>
                </div>
              ) : isConnected && account ? (
                <div className="flex gap-4 items-center justify-center">
                  <button 
                    className="final-cta-button group !py-3 !px-6"
                    onClick={() => {
                      onConnectWallet();
                    }}
                  >
                    <span className="button-text">{account.displayName}</span>
                  </button>
                </div>
              ) : (
                <button 
                  onClick={async () => {
                    await connect();
                    onConnectWallet();
                  }}
                  disabled={isConnecting}
                  className="final-cta-button group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="button-text">
                    {isConnecting ? 'Connecting...' : error ? 'Retry Connection' : 'Connect Freighter Wallet'}
                  </span>
                  <span className="button-arrow">→</span>
                  <div className="button-glow-effect"></div>
                  <div className="button-ripple"></div>
                  <div className="button-magnetic-field"></div>
                </button>
              )}
              {error && (
                <p className="mt-4 text-red-400 text-sm max-w-md mx-auto">
                  {error}
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* Ambient Background Elements */}
        <div className="final-ambient-1"></div>
        <div className="final-ambient-2"></div>
        <div className="final-ambient-3"></div>
      </div>
    </section>
  );
};

export default FinalCTA;