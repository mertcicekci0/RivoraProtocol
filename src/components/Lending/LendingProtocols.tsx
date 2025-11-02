'use client'

import React, { useState, useMemo } from 'react';
import { Coins, Shield, Zap, ExternalLink, Sparkles, AlertCircle } from 'lucide-react';
import { useScores } from '../../lib/hooks/useScores';

const LendingProtocols: React.FC = () => {
  const [selectedProtocol, setSelectedProtocol] = useState<string | null>(null);
  const { data: scoreData, loading: scoresLoading, isConnected } = useScores();

  const protocols = [
    {
      id: 'stellarterm',
      name: 'StellarTerm',
      logo: '⭐',
      apy: '3.5%',
      tvl: '$125M',
      risk: 'Low',
      riskColor: 'text-green-400',
      description: 'Native Stellar DEX with liquidity pools and yield farming',
      tokens: ['XLM', 'USDC', 'USDT', 'EURT'],
      features: ['Native DEX', 'Liquidity Pools', 'Path Payments'],
    },
    {
      id: 'stellarx',
      name: 'StellarX',
      logo: '🌐',
      apy: '4.2%',
      tvl: '$89M',
      risk: 'Low',
      riskColor: 'text-green-400',
      description: 'Decentralized exchange on Stellar with integrated lending markets',
      tokens: ['XLM', 'BTC', 'ETH', 'USDC'],
      features: ['Integrated Trading', 'Trustline Management', 'Multi-Asset Support'],
    },
    {
      id: 'lobstr',
      name: 'Lobstr',
      logo: '🦞',
      apy: '2.8%',
      tvl: '$45M',
      risk: 'Medium',
      riskColor: 'text-yellow-400',
      description: 'User-friendly wallet and DeFi platform with yield opportunities',
      tokens: ['XLM', 'USDC', 'BRL', 'NGN'],
      features: ['Mobile Wallet', 'Fiat On-Ramp', 'Yield Staking'],
    },
    {
      id: 'stellarport',
      name: 'StellarPort',
      logo: '🚀',
      apy: '5.1%',
      tvl: '$67M',
      risk: 'Medium',
      riskColor: 'text-yellow-400',
      description: 'Advanced DEX interface with liquidity provision and lending',
      tokens: ['XLM', 'USDC', 'USDT', 'XRP'],
      features: ['Advanced Trading', 'Liquidity Provision', 'Multi-Sig Support'],
    },
    {
      id: 'ultrastellar',
      name: 'UltraStellar',
      logo: '⚡',
      apy: '6.3%',
      tvl: '$32M',
      risk: 'Medium',
      riskColor: 'text-yellow-400',
      description: 'Yield optimization and liquidity aggregation on Stellar network',
      tokens: ['XLM', 'USDC', 'BTC', 'ETH'],
      features: ['Yield Aggregation', 'Liquidity Mining', 'Auto-Compounding'],
    },
    {
      id: 'stellarquest',
      name: 'StellarQuest',
      logo: '🎮',
      apy: '7.5%',
      tvl: '$18M',
      risk: 'High',
      riskColor: 'text-red-400',
      description: 'Emerging DeFi protocol with innovative lending mechanisms',
      tokens: ['XLM', 'USDC', 'Custom Tokens'],
      features: ['Innovative Models', 'Community Governance', 'Early Access'],
    },
  ];

  // Get recommended protocol based on trust rating
  const recommendedProtocolId = useMemo(() => {
    if (!scoreData || !isConnected) return null;

    const trustRating = scoreData.deFiRiskScore;

    // High trust rating (80+) = Excellent Trust = Recommend premium protocols
    if (trustRating >= 80) {
      return 'stellarterm'; // Safest, most established
    }
    // Good trust rating (60-79) = Strong Trust = Recommend established protocols
    if (trustRating >= 60) {
      return 'stellarx'; // Good balance of safety and features
    }
    // Moderate trust rating (40-59) = Building Trust = Recommend balanced protocols
    if (trustRating >= 40) {
      return 'stellarport'; // Medium risk, good features
    }
    // Lower trust rating (<40) = Emerging Trust = Recommend safest with guidance
    return 'stellarterm'; // Default to safest
  }, [scoreData, isConnected]);

  const recommendedProtocol = protocols.find(p => p.id === recommendedProtocolId);

  return (
    <div className="space-y-6">
      {/* Personalized Recommendation Banner */}
      {isConnected && scoreData && recommendedProtocol && (
        <div className="dashboard-card bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/30">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4 flex-1">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <Sparkles className="w-6 h-6 text-purple-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold text-white">Recommended for You</h3>
                  <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full">
                    Trust Rating: {scoreData.deFiRiskScore.toFixed(0)}/100
                  </span>
                </div>
                <p className="text-sm text-gray-300 mb-3">
                  Based on your Rivora Trust Rating of <span className="text-purple-400 font-semibold">{scoreData.deFiRiskScore.toFixed(0)}</span>, we recommend{' '}
                  <span className="text-cyan-400 font-semibold">{recommendedProtocol.name}</span> as the perfect match for your trust profile.
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Shield className="w-3 h-3" />
                    <span>Protocol Risk: {recommendedProtocol.risk}</span>
                  </div>
                  <span className="text-xs text-gray-500">•</span>
                  <div className="flex items-center gap-1 text-xs text-cyan-400">
                    <Coins className="w-3 h-3" />
                    <span>APY: {recommendedProtocol.apy}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Guidance for Emerging Trust */}
      {isConnected && scoreData && scoreData.deFiRiskScore < 40 && (
        <div className="dashboard-card bg-yellow-500/10 border border-yellow-500/30">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-yellow-400 mb-1">Building Your Trust Profile</h4>
              <p className="text-xs text-gray-300">
                Your Trust Rating is {scoreData.deFiRiskScore.toFixed(0)}. We recommend starting with established protocols to build your DeFi reputation and enhance your trust rating.
              </p>
            </div>
          </div>
        </div>
      )}

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
          {protocols.map((protocol) => {
            const isRecommended = recommendedProtocolId === protocol.id && isConnected && scoreData;
            return (
            <div
              key={protocol.id}
              className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer relative ${
                isRecommended
                  ? 'bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border-purple-500/50 shadow-lg shadow-purple-500/20'
                  : selectedProtocol === protocol.id
                  ? 'bg-white/10 border-cyan-500/50'
                  : 'bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20'
              }`}
              onClick={() => setSelectedProtocol(selectedProtocol === protocol.id ? null : protocol.id)}
            >
              {/* Recommended Badge */}
              {isRecommended && (
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-purple-500/30 border border-purple-400/50 rounded-full">
                  <Sparkles className="w-3 h-3 text-purple-300" />
                  <span className="text-xs font-semibold text-purple-300">Recommended</span>
                </div>
              )}
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
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LendingProtocols;