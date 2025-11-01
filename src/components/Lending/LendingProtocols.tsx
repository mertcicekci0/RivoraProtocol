'use client'

import React, { useState } from 'react';
import { Coins, TrendingUp, Shield, Zap, ExternalLink } from 'lucide-react';

const LendingProtocols: React.FC = () => {
  const [selectedProtocol, setSelectedProtocol] = useState<string | null>(null);

  const protocols = [
    {
      id: 'aave',
      name: 'Aave',
      logo: '🏦',
      apy: '4.25%',
      tvl: '$12.4B',
      risk: 'Low',
      riskColor: 'text-green-400',
      description: 'Leading decentralized lending protocol with proven security',
      tokens: ['USDC', 'ETH', 'WBTC', 'DAI'],
      features: ['Flash Loans', 'Collateral Swapping', 'Rate Switching'],
    },
    {
      id: 'compound',
      name: 'Compound',
      logo: '🏛️',
      apy: '3.85%',
      tvl: '$8.2B',
      risk: 'Low',
      riskColor: 'text-green-400',
      description: 'Algorithmic money market protocol with autonomous interest rates',
      tokens: ['USDC', 'ETH', 'WBTC', 'UNI'],
      features: ['Governance Token', 'Autonomous Rates', 'Liquidation Protection'],
    },
    {
      id: 'maker',
      name: 'MakerDAO',
      logo: '🎯',
      apy: '5.12%',
      tvl: '$6.8B',
      risk: 'Medium',
      riskColor: 'text-yellow-400',
      description: 'Decentralized credit platform enabling DAI generation',
      tokens: ['ETH', 'WBTC', 'LINK', 'YFI'],
      features: ['DAI Minting', 'Stability Fee', 'Liquidation Auctions'],
    },
    {
      id: 'yearn',
      name: 'Yearn Finance',
      logo: '🌾',
      apy: '6.78%',
      tvl: '$4.1B',
      risk: 'High',
      riskColor: 'text-red-400',
      description: 'Yield optimization protocol with automated strategies',
      tokens: ['USDC', 'DAI', 'USDT', 'WETH'],
      features: ['Auto-Compounding', 'Strategy Optimization', 'Vault System'],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="dashboard-card glow-cyan">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-cyan-500/20 rounded-lg">
              <Coins className="w-6 h-6 text-cyan-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Lending Protocols</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {protocols.map((protocol) => (
            <div
              key={protocol.id}
              className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                selectedProtocol === protocol.id
                  ? 'bg-white/10 border-cyan-500/50'
                  : 'bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20'
              }`}
              onClick={() => setSelectedProtocol(selectedProtocol === protocol.id ? null : protocol.id)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{protocol.logo}</span>
                  <div>
                    <h3 className="font-semibold text-white">{protocol.name}</h3>
                    <p className="text-sm text-gray-400">TVL: {protocol.tvl}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-cyan-400">{protocol.apy}</p>
                  <p className="text-sm text-gray-400">APY</p>
                </div>
              </div>

              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-400">Risk:</span>
                  <span className={`text-sm font-medium ${protocol.riskColor}`}>
                    {protocol.risk}
                  </span>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400" />
              </div>

              <p className="text-sm text-gray-300 mb-3">{protocol.description}</p>

              <div className="flex flex-wrap gap-2 mb-3">
                {protocol.tokens.map((token) => (
                  <span
                    key={token}
                    className="px-2 py-1 bg-cyan-500/20 text-cyan-400 text-xs rounded-full"
                  >
                    {token}
                  </span>
                ))}
              </div>

              {selectedProtocol === protocol.id && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <h4 className="text-sm font-semibold text-white mb-2">Features:</h4>
                  <div className="space-y-1">
                    {protocol.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Zap className="w-3 h-3 text-cyan-400" />
                        <span className="text-sm text-gray-300">{feature}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button className="px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 text-sm rounded-lg transition-colors duration-200">
                      Supply
                    </button>
                    <button className="px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-sm rounded-lg transition-colors duration-200">
                      Borrow
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Lending Summary */}
      <div className="dashboard-card">
        <h3 className="text-lg font-semibold text-white mb-4">Your Lending Position</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/20">
            <TrendingUp className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">$8,450</p>
            <p className="text-sm text-gray-400">Total Supplied</p>
          </div>
          <div className="text-center p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <Coins className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">$2,100</p>
            <p className="text-sm text-gray-400">Total Borrowed</p>
          </div>
          <div className="text-center p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
            <Shield className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">75%</p>
            <p className="text-sm text-gray-400">Health Factor</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LendingProtocols;