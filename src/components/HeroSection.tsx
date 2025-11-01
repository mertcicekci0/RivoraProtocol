'use client'

import React, { useRef, useEffect } from 'react';
import { useStellarWalletContext } from '@/lib/providers/StellarWalletProvider';

interface HeroSectionProps {
  onConnectWallet: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onConnectWallet }) => {
  const { account, isConnected, isConnecting, error, isMounted, connect } = useStellarWalletContext();
  return (
    <section className="relative min-h-screen flex items-center justify-center">
      <div className="container mx-auto px-6 text-center relative z-10">
        {/* Interactive Liquid Metal Orb */}
        <div className="relative mb-16">
          <div className="liquid-orb">
            <div className="orb-core"></div>
            <div className="orb-liquid"></div>
            <div className="orb-glow-ring"></div>
            <div className="orb-reflection"></div>
            <div className="orb-caustics"></div>
          </div>
        </div>

        {/* Hero Typography */}
        <div className="hero-content">
          <h1 className="hero-title">
            <span className="word-decode rivora-title" style={{ animationDelay: '0s' }}>
              Rivora
            </span>
          </h1>
          
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
                <div className="premium-hero-cta-button group opacity-0 pointer-events-none">
                  <span className="button-text">Connect Wallet</span>
                </div>
              ) : isConnected && account ? (
                <div className="flex gap-4 items-center justify-center">
                  <button 
                    className="premium-hero-cta-button group !py-3 !px-6"
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
                  className="premium-hero-cta-button group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="button-text">
                    {isConnecting ? 'Connecting...' : error ? 'Retry Connection' : 'Connect Freighter Wallet'}
                  </span>
                  <span className="button-arrow">→</span>
                  <div className="button-glow-effect"></div>
                  <div className="button-ripple"></div>
                  <div className="button-energy-field"></div>
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
      </div>

      {/* Atmospheric Lighting */}
      <div className="spotlight spotlight-1"></div>
      <div className="spotlight spotlight-2"></div>
      <div className="spotlight spotlight-3"></div>
    </section>
  );
};

export default HeroSection;