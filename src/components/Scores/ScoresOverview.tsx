'use client'

import React, { useState } from 'react';
import { Shield, Heart, User, TrendingUp, AlertTriangle, CheckCircle, RefreshCw, AlertCircle, Link2, Loader2 } from 'lucide-react';
import { useScores, getRiskLevel, getHealthLevel, getUserTypeInfo } from '../../lib/hooks/useScores';
import { useStellarWallet } from '../../lib/hooks/useStellarWallet';

const ScoresOverview: React.FC = () => {
  const { data, loading, error, refetch, isConnected } = useScores();
  const { account } = useStellarWallet();
  const [savingToBlockchain, setSavingToBlockchain] = useState(false);
  const [blockchainStatus, setBlockchainStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  // Generate scores data with real API data or fallback
  const riskLevel = data ? getRiskLevel(data.deFiRiskScore) : { level: 'Low', color: 'text-blue-400', bgColor: 'bg-blue-500/20' };
  const healthLevel = data ? getHealthLevel(data.deFiHealthScore) : { level: 'Good', color: 'text-green-400', bgColor: 'bg-green-500/20' };
  const userTypeInfo = data ? getUserTypeInfo(data.userType) : { description: 'Active trader', emoji: '📈', color: 'text-green-400' };

  // Handle save to blockchain
  const handleSaveToBlockchain = async () => {
    if (!data || !account) return;

    setSavingToBlockchain(true);
    setBlockchainStatus(null);

    try {
      // Step 1: Get transaction XDR from API
      const response = await fetch('/api/blockchain/save-scores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: account.publicKey,
          trustRating: data.deFiRiskScore,
          healthScore: data.deFiHealthScore,
          userType: data.userType,
        }),
      });

      const result = await response.json();

      if (!result.success || !result.xdr) {
        throw new Error(result.error || 'Failed to create transaction');
      }

      // Step 2: Sign transaction with Freighter
      const { default: freighterApi } = await import('@stellar/freighter-api');
      
      const network = result.network === 'testnet' ? 'TESTNET' : 'PUBLIC';
      
      // Freighter signTransaction takes xdr and network
      const signedXdr = await freighterApi.signTransaction(result.xdr, {
        network,
      });

      if (!signedXdr) {
        throw new Error('Transaction signing was cancelled or failed');
      }

      // Step 3: Submit signed transaction
      const submitResponse = await fetch('/api/blockchain/submit-transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          xdr: signedXdr,
          network: result.network,
        }),
      });

      const submitResult = await submitResponse.json();

      if (submitResult.success) {
        setBlockchainStatus({
          success: true,
          message: `✅ Scores saved to blockchain! Transaction: ${submitResult.transactionHash?.slice(0, 12)}...`,
        });
      } else {
        throw new Error(submitResult.error || 'Failed to submit transaction');
      }

    } catch (error: any) {
      console.error('Failed to save to blockchain:', error);
      setBlockchainStatus({
        success: false,
        message: error.message || 'Failed to save scores to blockchain',
      });
    } finally {
      setSavingToBlockchain(false);
    }
  };

  // Show loading state when fetching data
  if (!isConnected) {
    return (
      <div className="space-y-6">
        <div className="dashboard-card text-center py-12">
          <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Connect Your Wallet</h3>
          <p className="text-gray-400">Please connect your wallet to view your DeFi scores and analytics.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="dashboard-card">
              <div className="animate-pulse">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gray-700 rounded-lg"></div>
                  <div className="space-y-2">
                    <div className="h-5 bg-gray-700 rounded w-32"></div>
                    <div className="h-4 bg-gray-700 rounded w-24"></div>
                  </div>
                </div>
                <div className="flex justify-center mb-4">
                  <div className="w-24 h-24 bg-gray-700 rounded-full"></div>
                </div>
                <div className="h-4 bg-gray-700 rounded mb-4"></div>
                <div className="h-8 bg-gray-700 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="dashboard-card text-center py-12">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Error Loading Scores</h3>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={refetch}
            className="btn-primary inline-flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry</span>
          </button>
        </div>
      </div>
    );
  }

  const scores = [
    {
      id: 'defi-risk',
      title: 'Rivora Trust Rating',
      subtitle: 'Wallet Credibility Index',
      score: data ? Math.round(data.deFiRiskScore) : 87,
      maxScore: 100,
      color: 'from-blue-500 to-cyan-400',
      icon: Shield,
      description: 'Security-focused analysis based on wallet history and protocol interactions',
      status: data ? (data.deFiRiskScore >= 80 ? 'excellent' : data.deFiRiskScore >= 60 ? 'good' : 'warning') : 'excellent',
      details: [
        { label: 'Trust Level', value: riskLevel.level, status: (data?.deFiRiskScore || 0) >= 60 ? 'good' : 'warning' },
        { label: 'Data Quality', value: data?.metadata?.dataQuality || 'High', status: 'good' },
        { label: 'Analysis Date', value: data ? new Date(data.metadata?.timestamp || Date.now()).toLocaleDateString() : 'Demo', status: 'good' },
        { label: 'Metrics Analyzed', value: `${data?.metadata?.analyzedMetrics?.length || 8} factors`, status: 'excellent' },
      ]
    },
    {
      id: 'health',
      title: 'DeFi Health Score',
      subtitle: 'Portfolio Health Analysis',
      score: data ? Math.round(data.deFiHealthScore) : 73,
      maxScore: 100,
      color: 'from-green-500 to-emerald-400',
      icon: Heart,
      description: 'Portfolio diversification, risk distribution and sustainability analysis',
      status: data ? (data.deFiHealthScore >= 80 ? 'excellent' : data.deFiHealthScore >= 60 ? 'good' : 'warning') : 'good',
      details: [
        { label: 'Health Level', value: healthLevel.level, status: (data?.deFiHealthScore || 0) >= 60 ? 'good' : 'warning' },
        { label: 'Diversification', value: data?.analysis?.portfolioDiversity ? `${Math.round(data.analysis.portfolioDiversity * 100)}%` : 'Analyzed', status: 'excellent' },
        { label: 'Risk Exposure', value: data?.analysis?.portfolioConcentration ? (data.analysis.portfolioConcentration > 0.7 ? 'High' : 'Moderate') : 'Calculated', status: data?.analysis?.portfolioConcentration && data.analysis.portfolioConcentration > 0.7 ? 'warning' : 'good' },
        { label: 'Gas Efficiency', value: data?.analysis?.gasEfficiency ? `${Math.round(data.analysis.gasEfficiency * 100)}%` : 'Optimized', status: 'excellent' },
      ]
    },
    {
      id: 'user-type',
      title: 'User Type Analysis',
      subtitle: 'Behavioral Classification',
      score: data ? Math.round(data.userTypeScore || 92) : 92,
      maxScore: 100,
      color: 'from-purple-500 to-pink-400',
      icon: User,
      description: 'Behavioral pattern analysis for personalized DeFi experience',
      status: 'excellent',
      details: [
        { label: 'User Type', value: userTypeInfo.description, status: 'excellent' },
        { label: 'Swap Frequency', value: data?.analysis?.transactionFrequency ? (data.analysis.transactionFrequency > 10 ? 'High' : data.analysis.transactionFrequency > 5 ? 'Medium' : 'Low') : 'High', status: 'good' },
        { label: 'Secure Swaps', value: data?.analysis?.secureSwapUsage ? `${Math.round(data.analysis.secureSwapUsage * 100)}%` : '85%', status: 'excellent' },
        { label: 'Profile Match', value: data ? 'Analyzed' : 'Active', status: 'excellent' },
      ]
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-400';
      case 'good': return 'text-blue-400';
      case 'warning': return 'text-yellow-400';
      case 'danger': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return CheckCircle;
      case 'good': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'danger': return AlertTriangle;
      default: return CheckCircle;
    }
  };

  const calculateProgress = (score: number, maxScore: number) => {
    return (score / maxScore) * 100;
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {scores.map((scoreData) => {
          const Icon = scoreData.icon;
          const progress = calculateProgress(scoreData.score, scoreData.maxScore);
          
          return (
            <div key={scoreData.id} className="dashboard-card glow-purple">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Icon className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{scoreData.title}</h3>
                    <p className="text-sm text-gray-400">{scoreData.subtitle}</p>
                  </div>
                </div>
              </div>

              {/* Score Circle */}
              <div className="flex items-center justify-center mb-4">
                <div className="relative w-24 h-24">
                  <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth="8"
                      fill="transparent"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="url(#gradient-${scoreData.id})"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={`${progress * 2.51} 251`}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-out"
                    />
                    <defs>
                      <linearGradient id={`gradient-${scoreData.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#8033ff" />
                        <stop offset="50%" stopColor="#00FFE0" />
                        <stop offset="100%" stopColor="#FF00A8" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-white">{scoreData.score}</span>
                    <span className="text-xs text-gray-400">/{scoreData.maxScore}</span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-300 text-center mb-4">
                {scoreData.description}
              </p>

              <div className={`text-center p-2 rounded-lg bg-gradient-to-r ${scoreData.color} bg-opacity-20`}>
                <span className={`text-sm font-semibold ${getStatusColor(scoreData.status)}`}>
                  {scoreData.status === 'excellent' ? 'Excellent' : 
                   scoreData.status === 'good' ? 'Good' : 
                   scoreData.status === 'warning' ? 'Warning' : 'Risk'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Analysis */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {scores.map((scoreData) => {
          const StatusIcon = getStatusIcon(scoreData.status);
          
          return (
            <div key={`${scoreData.id}-details`} className="dashboard-card">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-white/5 rounded-lg">
                  <scoreData.icon className="w-5 h-5 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">{scoreData.title} Details</h3>
              </div>

              <div className="space-y-3">
                {scoreData.details.map((detail, index) => {
                  const DetailStatusIcon = getStatusIcon(detail.status);
                  return (
                    <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <DetailStatusIcon className={`w-4 h-4 ${getStatusColor(detail.status)}`} />
                        <span className="text-sm text-gray-300">{detail.label}</span>
                      </div>
                      <span className={`text-sm font-semibold ${getStatusColor(detail.status)}`}>
                        {detail.value}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Save to Blockchain */}
      {data && account && (
        <div className="dashboard-card bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-start space-x-4 flex-1">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <Link2 className="w-6 h-6 text-purple-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">Save to Blockchain</h3>
                <p className="text-sm text-gray-300 mb-4">
                  Permanently store your Rivora scores on the Stellar blockchain. Your scores will be publicly verifiable and immutable.
                </p>
                {blockchainStatus && (
                  <div className={`mb-4 p-3 rounded-lg ${
                    blockchainStatus.success 
                      ? 'bg-green-500/20 border border-green-500/30' 
                      : 'bg-red-500/20 border border-red-500/30'
                  }`}>
                    <div className="flex items-center gap-2">
                      {blockchainStatus.success ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-400" />
                      )}
                      <p className={`text-sm ${blockchainStatus.success ? 'text-green-300' : 'text-red-300'}`}>
                        {blockchainStatus.message}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={handleSaveToBlockchain}
              disabled={savingToBlockchain || !data || !account}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {savingToBlockchain ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Signing...</span>
                </>
              ) : (
                <>
                  <Link2 className="w-5 h-5" />
                  <span>Save to Blockchain</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="dashboard-card glow-cyan">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-cyan-500/20 rounded-lg">
              <TrendingUp className="w-6 h-6 text-cyan-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Personalized Recommendations</h2>
          </div>
          {data && (
            <button
              onClick={refetch}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
              title="Refresh recommendations"
            >
              <RefreshCw className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Security Recommendation */}
          <div className={`p-4 rounded-lg border ${
            data && data.deFiRiskScore >= 80 
              ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20' 
              : 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/20'
          }`}>
            <div className="flex items-center space-x-2 mb-2">
              {data && data.deFiRiskScore >= 80 ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-semibold text-green-400">Security Excellence</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm font-semibold text-yellow-400">Security Improvement</span>
                </>
              )}
            </div>
            <p className="text-sm text-gray-300">
              {data && data.deFiRiskScore >= 80 
                ? 'With your excellent trust rating, you can access premium swap features and exclusive opportunities.'
                : 'Increase secure swap usage and interact with verified protocols to improve your trust rating.'
              }
            </p>
          </div>

          {/* Gas Optimization */}
          <div className="p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-lg border border-blue-500/20">
            <div className="flex items-center space-x-2 mb-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-semibold text-blue-400">Gas Optimization</span>
            </div>
            <p className="text-sm text-gray-300">
              {data?.analysis?.gasEfficiency && data.analysis.gasEfficiency > 0.8
                ? 'Excellent gas efficiency! Continue using limit orders and Fusion+ for optimal costs.'
                : 'Increase your Fusion+ usage to reduce gas costs by up to 25% on your swaps.'
              }
            </p>
          </div>

          {/* Portfolio Health */}
          <div className={`p-4 rounded-lg border ${
            data && data.deFiHealthScore >= 75
              ? 'bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20'
              : 'bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/20'
          }`}>
            <div className="flex items-center space-x-2 mb-2">
              {data && data.deFiHealthScore >= 75 ? (
                <>
                  <Heart className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-semibold text-purple-400">{userTypeInfo.description} Profile</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-orange-400" />
                  <span className="text-sm font-semibold text-orange-400">Portfolio Balance</span>
                </>
              )}
            </div>
            <p className="text-sm text-gray-300">
              {data && data.deFiHealthScore >= 75
                ? `${userTypeInfo.emoji} Your ${userTypeInfo.description.toLowerCase()} strategy is working well. Special notifications for arbitrage opportunities enabled.`
                : 'Consider diversifying your portfolio to reduce concentration risk and improve health score.'
              }
            </p>
          </div>
        </div>

        {/* Data Quality & Refresh Info */}
        {data && (
          <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-gray-300">
                  Analysis completed with {data.metadata?.dataQuality || 'high'} data quality
                </span>
              </div>
              <span className="text-gray-400">
                Last updated: {data.metadata?.timestamp ? new Date(data.metadata.timestamp).toLocaleTimeString() : 'Now'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScoresOverview;