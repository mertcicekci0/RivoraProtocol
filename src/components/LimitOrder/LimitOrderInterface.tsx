'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, Clock, Target, Settings, Shield, Zap, Award, RefreshCw, AlertCircle, X } from 'lucide-react';
import { useStellarWallet } from '../../lib/hooks/useStellarWallet';
import { useScores } from '../../lib/hooks/useScores';
import { useLimitOrders, getOrderStatus, getOrderProgress, getTimeUntilExpiry, LimitOrder } from '../../lib/hooks/useLimitOrders';
import { useTokens, Token, formatPrice, formatPriceChange } from '../../lib/hooks/useTokens';

const LimitOrderInterface: React.FC = () => {
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');
  const [fromToken, setFromToken] = useState('USDC');
  const [toToken, setToToken] = useState('ETH');
  const [amount, setAmount] = useState('');
  const [limitPrice, setLimitPrice] = useState('');
  const [expiry, setExpiry] = useState('1d');

  // Get user scores for intelligent recommendations
  const { data: scoreData, isConnected } = useScores();
  const { account } = useStellarWallet();
  const address = account?.publicKey || null;
  
  // Get limit orders data
  const { 
    orders, 
    loading, 
    error, 
    creating, 
    cancelling, 
    createOrder, 
    cancelOrder, 
    refetch 
  } = useLimitOrders();

  // Real token data with dynamic pricing and balances
  const { 
    tokens: availableTokens, 
    loading: tokensLoading, 
    error: tokensError,
    searchTokens,
    refreshBalances 
  } = useTokens(1);

  // Token selection state with better defaults
  const [tokens, setTokens] = useState(availableTokens);
  const [showTokenApproval, setShowTokenApproval] = useState(false);
  const [approvalToken, setApprovalToken] = useState<string>('');
  const [priceImpact, setPriceImpact] = useState<number>(0);

  // Update tokens when available tokens change and set better defaults
  useEffect(() => {
    if (availableTokens.length > 0) {
      setTokens(availableTokens);
      
      // Set default tokens if they exist
      const hasUSDC = availableTokens.some(t => t.symbol === 'USDC');
      const hasETH = availableTokens.some(t => t.symbol === 'ETH' || t.symbol === 'WETH');
      
      if (!hasUSDC && availableTokens.length > 0) {
        setFromToken(availableTokens[0].symbol);
      }
      if (!hasETH && availableTokens.length > 1) {
        setToToken(availableTokens[1].symbol);
      }
    }
  }, [availableTokens]);

  // Calculate price impact and validate order
  const calculatePriceImpact = useCallback((amount: string, price: string, fromTokenSymbol: string, toTokenSymbol: string) => {
    const fromToken = tokens.find(t => t.symbol === fromTokenSymbol);
    const toToken = tokens.find(t => t.symbol === toTokenSymbol);
    
    if (!fromToken || !toToken || !amount || !price) {
      setPriceImpact(0);
      return;
    }

    const marketPrice = toToken.price / fromToken.price;
    const limitPriceNum = parseFloat(price);
    const impact = Math.abs((limitPriceNum - marketPrice) / marketPrice) * 100;
    setPriceImpact(impact);
  }, [tokens]);

  // Real-time price impact calculation
  useEffect(() => {
    calculatePriceImpact(amount, limitPrice, fromToken, toToken);
  }, [amount, limitPrice, fromToken, toToken, calculatePriceImpact]);

  // Enhanced order creation with validation and approval workflow
  const handleCreateOrder = async () => {
    if (!amount || !limitPrice || !isConnected) return;

    try {
      const fromTokenData = tokens.find(t => t.symbol === fromToken);
      const toTokenData = tokens.find(t => t.symbol === toToken);
      
      if (!fromTokenData || !toTokenData) {
        throw new Error('Token not found');
      }

      // Validate balance
      const requiredAmount = parseFloat(amount);
      const availableBalance = parseFloat(fromTokenData.balance);
      
      if (requiredAmount > availableBalance) {
        throw new Error(`Insufficient ${fromToken} balance. Required: ${amount}, Available: ${fromTokenData.balance}`);
      }

      // Check if token approval is needed (skip for ETH)
      if (fromTokenData.address !== '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE') {
        // For demo purposes, assume approval is needed for non-ETH tokens
        // In production, check allowance via token contract
        console.log('🔐 Token approval required for:', fromToken);
        setApprovalToken(fromToken);
        setShowTokenApproval(true);
        return;
      }

      // Calculate precise amounts with proper decimals
      const makingAmount = (parseFloat(amount) * Math.pow(10, fromTokenData.decimals)).toString();
      const takingAmount = (parseFloat(amount) * parseFloat(limitPrice) * Math.pow(10, toTokenData.decimals)).toString();

      await createOrder({
        makerAsset: fromTokenData.address,
        takerAsset: toTokenData.address,
        makingAmount,
        takingAmount,
        maker: address || '',
        chainId: 1, // Ethereum mainnet
        makerDecimals: fromTokenData.decimals,
        takerDecimals: toTokenData.decimals,
      });

      // Reset form
      setAmount('');
      setLimitPrice('');
      
      // Refresh balances after order creation
      await refreshBalances();
      
    } catch (error) {
      console.error('Failed to create order:', error);
    }
  };

  // Token approval check function
  const checkTokenApproval = async (tokenAddress: string, amount: string, decimals: number): Promise<boolean> => {
    try {
      const response = await fetch('/api/tokens/approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenAddress,
          walletAddress: address,
          amount,
          decimals,
          chainId: 1,
        }),
      });

      if (!response.ok) return true; // Assume approval needed if check fails

      const data = await response.json();
      return !data.hasApproval;
    } catch (error) {
      console.error('Failed to check token approval:', error);
      return true; // Assume approval needed on error
    }
  };

  // Enhanced order cancellation with optimistic updates
  const handleCancelOrder = async (orderHash: string) => {
    try {
      await cancelOrder(orderHash);
      // Refresh balances after cancellation
      await refreshBalances();
    } catch (error) {
      console.error('Failed to cancel order:', error);
    }
  };

  // Get enhanced status color with more states
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-blue-400 bg-blue-500/20';
      case 'partial': return 'text-yellow-400 bg-yellow-500/20';
      case 'completed': return 'text-green-400 bg-green-500/20';
      case 'cancelled': return 'text-red-400 bg-red-500/20';
      case 'expired': return 'text-gray-400 bg-gray-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  // Price impact indicator
  const getPriceImpactColor = (impact: number) => {
    if (impact < 1) return 'text-green-400';
    if (impact < 5) return 'text-yellow-400';
    return 'text-red-400';
  };

  // Form validation functions
  const isFormValid = () => {
    if (!amount || !limitPrice) return false;
    
    const fromTokenData = tokens.find(t => t.symbol === fromToken);
    if (!fromTokenData) return false;

    const requiredAmount = parseFloat(amount);
    const availableBalance = parseFloat(fromTokenData.balance);
    
    if (requiredAmount <= 0) return false;
    if (requiredAmount > availableBalance) return false;
    if (parseFloat(limitPrice) <= 0) return false;
    
    return true;
  };

  const getValidationMessage = () => {
    if (!amount) return 'Enter Amount';
    if (!limitPrice) return 'Enter Limit Price';
    
    const fromTokenData = tokens.find(t => t.symbol === fromToken);
    if (!fromTokenData) return 'Token Not Found';

    const requiredAmount = parseFloat(amount);
    const availableBalance = parseFloat(fromTokenData.balance);
    
    if (requiredAmount <= 0) return 'Invalid Amount';
    if (requiredAmount > availableBalance) return 'Insufficient Balance';
    if (parseFloat(limitPrice) <= 0) return 'Invalid Price';
    
    return 'Enter Details';
  };

  // Loading state for tokens
  if (tokensLoading && tokens.length === 0) {
    return (
      <div className="space-y-6">
        <div className="dashboard-card text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold text-white mb-2">Loading Tokens</h3>
          <p className="text-gray-400">Fetching real-time token data and prices...</p>
        </div>
      </div>
    );
  }

  // Show token error with fallback
  if (tokensError && tokens.length === 0) {
    return (
      <div className="space-y-6">
        <div className="dashboard-card text-center py-12">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Token Loading Error</h3>
          <p className="text-gray-400 mb-4">Unable to load token data. Using fallback tokens.</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show wallet connection prompt
  if (!isConnected) {
    return (
      <div className="space-y-6">
        <div className="dashboard-card text-center py-12">
          <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Connect Your Wallet</h3>
          <p className="text-gray-400">Please connect your wallet to access limit order functionality.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create Limit Order */}
      <div className="dashboard-card glow-purple max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Target className="w-6 h-6 text-purple-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Create Limit Order</h2>
          </div>
          <button className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200">
            <Settings className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Order Type Toggle */}
        <div className="flex items-center space-x-2 mb-6 bg-white/5 rounded-lg p-1">
          <button
            onClick={() => setOrderType('buy')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
              orderType === 'buy'
                ? 'bg-green-500/20 text-green-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Buy Order
          </button>
          <button
            onClick={() => setOrderType('sell')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
              orderType === 'sell'
                ? 'bg-red-500/20 text-red-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Sell Order
          </button>
        </div>

        <div className="space-y-4">
          {/* From Token */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-400">
                {orderType === 'buy' ? 'Pay with' : 'Sell'}
              </span>
              <span className="text-sm text-gray-400">
                Balance: {tokens.find(t => t.symbol === fromToken)?.balance || '0.0'}
                <span className="ml-2 text-xs">
                  ${(parseFloat(tokens.find(t => t.symbol === fromToken)?.balance || '0') * 
                    (tokens.find(t => t.symbol === fromToken)?.price || 0)).toFixed(2)}
                </span>
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                className="flex-1 bg-transparent text-2xl font-semibold text-white placeholder-gray-500 outline-none"
              />
              <select
                value={fromToken}
                onChange={(e) => setFromToken(e.target.value)}
                className="bg-white/10 text-white px-3 py-2 rounded-lg outline-none cursor-pointer"
              >
                {tokens.map((token) => (
                  <option key={token.symbol} value={token.symbol} className="bg-gray-800">
                    {token.symbol} - {formatPrice(token.price)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* To Token */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-400">
                {orderType === 'buy' ? 'Buy' : 'Receive'}
              </span>
              <span className="text-sm text-gray-400">
                Current: {formatPrice(tokens.find(t => t.symbol === toToken)?.price || 0)}
                <span className={`ml-2 ${formatPriceChange(tokens.find(t => t.symbol === toToken)?.priceChange24h || 0).color}`}>
                  {formatPriceChange(tokens.find(t => t.symbol === toToken)?.priceChange24h || 0).formatted}
                </span>
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <input
                type="number"
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
                placeholder="Limit Price"
                className="flex-1 bg-transparent text-2xl font-semibold text-white placeholder-gray-500 outline-none"
              />
              <select
                value={toToken}
                onChange={(e) => setToToken(e.target.value)}
                className="bg-white/10 text-white px-3 py-2 rounded-lg outline-none cursor-pointer"
              >
                {tokens.map((token) => (
                  <option key={token.symbol} value={token.symbol} className="bg-gray-800">
                    {token.symbol} - {formatPrice(token.price)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Expiry Settings */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Order Expiry</span>
            <div className="flex items-center space-x-2">
              {['1h', '1d', '1w', '1m'].map((time) => (
                <button
                  key={time}
                  onClick={() => setExpiry(time)}
                  className={`px-3 py-1 rounded text-sm transition-all duration-200 ${
                    expiry === time
                      ? 'bg-purple-500/20 text-purple-400'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          {amount && limitPrice && (
            <div className="bg-gradient-to-r from-purple-500/10 to-cyan-500/10 rounded-xl p-4 border border-purple-500/20">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-400">Order Type</span>
                <span className={`font-semibold ${orderType === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                  {orderType === 'buy' ? 'Buy' : 'Sell'} {toToken}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-400">Amount</span>
                <span className="text-white">{amount} {fromToken}</span>
              </div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-400">Limit Price</span>
                <span className="text-white">{limitPrice} {fromToken}/{toToken}</span>
              </div>
              {priceImpact > 0 && (
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-400">Price Impact</span>
                  <span className={`font-semibold ${getPriceImpactColor(priceImpact)}`}>
                    {priceImpact.toFixed(2)}%
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm border-t border-white/10 pt-2">
                <span className="text-gray-400">Est. Total</span>
                <span className="text-white font-semibold">
                  ${((parseFloat(amount || '0') * parseFloat(limitPrice || '0')) * 
                    (tokens.find(t => t.symbol === fromToken)?.price || 0)).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Create Order Button */}
          <button
            onClick={handleCreateOrder}
            disabled={!amount || !limitPrice || creating || !isFormValid()}
            className={`w-full py-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-2 ${
              orderType === 'buy'
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
                : 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600'
            } disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white`}
          >
            <Target className="w-5 h-5" />
            <span>
              {creating ? 'Creating...' : 
               !isFormValid() ? getValidationMessage() :
               amount && limitPrice ? `Create ${orderType === 'buy' ? 'Buy' : 'Sell'} Order` : 'Enter Details'}
            </span>
          </button>
        </div>
      </div>

      {/* AI-Powered Recommendations */}
      {scoreData && (
        <div className="dashboard-card glow-purple">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Zap className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">AI Recommendations</h3>
            <div className="flex items-center space-x-1">
              <Shield className="w-4 h-4 text-green-400" />
              <span className="text-xs text-green-400">Risk Score: {scoreData.deFiRiskScore}/100</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-lg border border-blue-500/20">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-semibold text-blue-400">Price Strategy</span>
              </div>
              <p className="text-xs text-gray-300">
                {scoreData.deFiRiskScore > 70 
                  ? 'Your high risk score qualifies you for tighter spreads. Consider limit orders 2-3% from market price.'
                  : 'Start with conservative limit orders 5-8% from market price to build your trading history.'
                }
              </p>
            </div>

            <div className="p-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20">
              <div className="flex items-center space-x-2 mb-2">
                <Award className="w-4 h-4 text-green-400" />
                <span className="text-sm font-semibold text-green-400">User Type Bonus</span>
              </div>
              <p className="text-xs text-gray-300">
                As an {scoreData.userType.toLowerCase()}, you get enhanced order matching priority and reduced fees on limit orders.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Active Orders */}
      <div className="dashboard-card glow-cyan">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-cyan-500/20 rounded-lg">
              <Clock className="w-6 h-6 text-cyan-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Your Limit Orders</h2>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">
              {orders.length} order{orders.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={refetch}
              disabled={loading}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh orders"
            >
              <RefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {loading && orders.length === 0 ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse p-4 bg-white/5 rounded-lg">
                <div className="h-4 bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-700 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-red-400 mb-4">{error}</p>
            <button onClick={refetch} className="btn-primary">
              Retry
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Active Orders</h3>
            <p className="text-gray-400">Create your first limit order to get started with automated trading.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order: LimitOrder) => {
              const status = getOrderStatus(order);
              const progress = getOrderProgress(order);
              const timeLeft = getTimeUntilExpiry(order);
              
              // Get token info for display
              const makerToken = tokens.find(t => t.address.toLowerCase() === order.makerAsset.toLowerCase());
              const takerToken = tokens.find(t => t.address.toLowerCase() === order.takerAsset.toLowerCase());
              
              // Format amounts for display
              const makingAmountFormatted = makerToken 
                ? (parseFloat(order.makingAmount) / Math.pow(10, makerToken.decimals)).toFixed(4)
                : parseFloat(order.makingAmount).toFixed(4);
              const takingAmountFormatted = takerToken
                ? (parseFloat(order.takingAmount) / Math.pow(10, takerToken.decimals)).toFixed(4)
                : parseFloat(order.takingAmount).toFixed(4);
              
              return (
                <div key={order.orderHash} className="p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/8 transition-colors duration-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${status.color}`}>
                        {status.label}
                      </span>
                      <span className="text-white font-medium">
                        {makingAmountFormatted} {makerToken?.symbol || 'Token'} → {takingAmountFormatted} {takerToken?.symbol || 'Token'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {status.status === 'active' && (
                        <button 
                          onClick={() => handleCancelOrder(order.orderHash)}
                          disabled={cancelling === order.orderHash}
                          className="p-1 hover:bg-red-500/20 rounded transition-colors duration-200 text-red-400"
                          title="Cancel order"
                        >
                          {cancelling === order.orderHash ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <X className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Selling</p>
                      <p className="text-white font-semibold">{makingAmountFormatted} {makerToken?.symbol || 'Token'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">For</p>
                      <p className="text-white font-semibold">{takingAmountFormatted} {takerToken?.symbol || 'Token'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Progress</p>
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-white/10 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                        <span className="text-white font-semibold text-xs">{progress.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-400">Expires</p>
                      <p className="text-white font-semibold">{timeLeft}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Token Approval Modal */}
      {showTokenApproval && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-gray-900 to-black border border-white/20 rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white">Token Approval Required</h3>
              <button 
                onClick={() => setShowTokenApproval(false)}
                className="p-1 hover:bg-white/10 rounded transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-300 mb-4">
                You need to approve {approvalToken} spending before creating this limit order.
              </p>
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-yellow-400 font-medium text-sm">Security Notice</p>
                    <p className="text-yellow-300 text-xs mt-1">
                      This approval allows the 1inch Limit Order Protocol to spend your {approvalToken} tokens.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowTokenApproval(false)}
                className="flex-1 py-3 px-4 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  // TODO: Implement token approval logic
                  setShowTokenApproval(false);
                  // Retry order creation after approval
                  await handleCreateOrder();
                }}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-white rounded-lg transition-all duration-200"
              >
                Approve {approvalToken}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LimitOrderInterface;