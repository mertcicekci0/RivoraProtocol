'use client'

import React from 'react';
import { Brain, TrendingUp, Shield, Zap, RefreshCw, AlertCircle } from 'lucide-react';
import { useScores, getRiskLevel, getHealthLevel, getUserTypeInfo } from '../../lib/hooks/useScores';

const InsightScore: React.FC = () => {
  const { data, loading, error, refetch, isConnected } = useScores();
  
  // Use real data only - NO FALLBACK DATA
  const score = data ? Math.round((data.deFiRiskScore + data.deFiHealthScore) / 2) : 0;
  const riskLevel = data ? getRiskLevel(data.deFiRiskScore) : null;
  const healthLevel = data ? getHealthLevel(data.deFiHealthScore) : null;
  const userTypeInfo = data ? getUserTypeInfo(data.userType) : null;
  
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const insights = [
    {
      icon: TrendingUp,
      title: 'Health Score',
      value: data ? `${data.deFiHealthScore.toFixed(1)}` : '0.0',
      color: healthLevel?.color || 'text-gray-400',
      bgColor: healthLevel?.bgColor || 'bg-gray-500/20',
    },
    {
      icon: Shield,
      title: 'Risk Level',
      value: riskLevel?.level || 'N/A',
      color: riskLevel?.color || 'text-gray-400',
      bgColor: riskLevel?.bgColor || 'bg-gray-500/20',
    },
    {
      icon: Zap,
      title: 'User Type',
      value: data ? `${userTypeInfo?.emoji || '⚡'} ${data.userType}` : 'N/A',
      color: userTypeInfo?.color || 'text-gray-400',
      bgColor: 'bg-yellow-500/20',
    },
  ];

  // Show loading state
  if (loading) {
    return (
      <div className="dashboard-card glow-purple">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center space-y-4">
            <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
            <p className="text-gray-400">Analyzing your DeFi profile...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="dashboard-card glow-purple border-red-500/20">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center space-y-4 text-center">
            <AlertCircle className="w-8 h-8 text-red-400" />
            <p className="text-red-400 font-medium">Failed to load insights</p>
            <p className="text-gray-400 text-sm">{error}</p>
            <button 
              onClick={refetch}
              className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show connect wallet state
  if (!isConnected) {
    return (
      <div className="dashboard-card glow-purple">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center space-y-4 text-center">
            <Brain className="w-8 h-8 text-purple-400" />
            <p className="text-gray-400 font-medium">Connect your wallet</p>
            <p className="text-gray-500 text-sm">to see your AI-powered DeFi insights</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-card glow-purple">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Brain className="w-6 h-6 text-purple-400" />
          </div>
          <h2 className="text-xl font-semibold text-white">AI Insight Score</h2>
        </div>
        {data && (
          <div className="flex items-center space-x-2">
            <button 
              onClick={refetch}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              title="Refresh scores"
            >
              <RefreshCw className="w-4 h-4 text-gray-400 hover:text-white" />
            </button>
            <div className={`px-2 py-1 rounded text-xs ${
              data.metadata?.dataQuality === 'high' ? 'bg-green-500/20 text-green-400' :
              data.metadata?.dataQuality === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              {data.metadata?.dataQuality} quality
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col xl:flex-row items-center justify-between space-y-8 xl:space-y-0 xl:space-x-12">
        {/* Circular Progress */}
        <div className="relative flex items-center justify-center flex-shrink-0">
          <svg className="progress-ring w-40 h-40" viewBox="0 0 180 180">
            <circle
              cx="90"
              cy="90"
              r={radius}
              stroke="rgba(128, 51, 255, 0.2)"
              strokeWidth="10"
              fill="transparent"
            />
            <circle
              cx="90"
              cy="90"
              r={radius}
              stroke="url(#gradient)"
              strokeWidth="10"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="progress-ring-circle"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8033ff" />
                <stop offset="50%" stopColor="#00FFE0" />
                <stop offset="100%" stopColor="#FF00A8" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold cosmic-text-gradient">{score}</span>
            <span className="text-base text-gray-400">Score</span>
          </div>
        </div>

        {/* Insights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 flex-1 w-full">
          {insights.map((insight, index) => {
            const Icon = insight.icon;
            return (
              <div
                key={index}
                className="flex items-center space-x-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-200"
              >
                <div className={`p-3 ${insight.bgColor} rounded-xl`}>
                  <Icon className={`w-6 h-6 ${insight.color}`} />
                </div>
                <div>
                  <p className="text-base text-gray-400 mb-1">{insight.title}</p>
                  <p className={`text-lg font-bold ${insight.color}`}>{insight.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-10 p-6 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 rounded-xl border border-purple-500/20">
        <p className="text-base text-gray-300 leading-relaxed">
          <span className="font-semibold text-purple-400">AI Recommendation:</span> 
          {data ? (
            <>
              {data.userType === 'Trader' && 'Consider diversifying your portfolio to reduce risk while maintaining trading opportunities.'}
              {data.userType === 'Explorer' && 'Focus on established protocols to balance your experimental approach with security.'}
              {data.userType === 'Optimizer' && 'Your efficiency-focused approach is excellent. Consider increasing position sizes for higher returns.'}
              {data.userType === 'Passive' && 'Consider active rebalancing to optimize your portfolio performance.'}
              {!['Trader', 'Explorer', 'Optimizer', 'Passive'].includes(data.userType) && 'Connect your wallet to receive personalized DeFi recommendations.'}
            </>
          ) : (
            'Connect your wallet to receive personalized AI-powered DeFi recommendations based on your portfolio analysis.'
          )}
        </p>
      </div>
    </div>
  );
};

export default InsightScore;