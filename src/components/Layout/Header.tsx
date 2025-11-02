'use client'

import React from 'react';
import { Home, PieChart, ArrowLeftRight, Coins, Target } from 'lucide-react';
import { useStellarWalletContext } from '@/lib/providers/StellarWalletProvider';

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onDisconnect: () => void;
}

const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange, onDisconnect }) => {
  const { account, isConnected, connect, disconnect: disconnectWallet } = useStellarWalletContext();
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'scores', label: 'Scores', icon: PieChart },
    { id: 'swap', label: 'Swap', icon: ArrowLeftRight },
    { id: 'lending', label: 'Lending', icon: Coins },
    { id: 'limit-order', label: 'Limit Order', icon: Target },
  ];

  return (
    <header className="glassmorphism border-b border-white/10 sticky top-0 z-50">
      <div className="container mx-auto px-6 py-2">
        <div className="flex items-center justify-between h-16 relative">
          {/* Logo */}
          <div className="flex items-center h-full overflow-visible">
            <img 
              src="/rivoralogo.png"
              alt="Rivora" 
              className="h-28 md:h-36 lg:h-40 w-auto object-contain"
              style={{ 
                imageRendering: 'crisp-edges'
              }}
            />
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'tab-active bg-purple-500/20'
                      : 'tab-inactive hover:bg-white/5'
                  }`}
                >
                  <Icon size={18} />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Account & Network Info */}
          <div className="flex items-center space-x-3">
            {isConnected && account ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-300">{account.displayName}</span>
                <button
                  onClick={async () => {
                    await disconnectWallet();
                    onDisconnect();
                  }}
                  className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={connect}
                className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
              >
                Connect Freighter
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden mt-4 flex overflow-x-auto space-x-4 pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg whitespace-nowrap transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'tab-active bg-purple-500/20'
                    : 'tab-inactive hover:bg-white/5'
                }`}
              >
                <Icon size={16} />
                <span className="text-xs font-medium">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

export default Header;