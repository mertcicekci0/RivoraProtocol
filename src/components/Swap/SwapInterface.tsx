'use client'

import React, { useState } from 'react';
import { ArrowUpDown, Settings, Zap, Info } from 'lucide-react';

const SwapInterface: React.FC = () => {
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [fromToken, setFromToken] = useState('ETH');
  const [toToken, setToToken] = useState('USDC');
  const [slippage, setSlippage] = useState('0.5');

  const tokens = [
    { symbol: 'ETH', name: 'Ethereum', price: '$2,450', balance: '5.2341' },
    { symbol: 'USDC', name: 'USD Coin', price: '$1.00', balance: '12,450.50' },
    { symbol: 'BTC', name: 'Bitcoin', price: '$43,250', balance: '0.1592' },
    { symbol: 'AAVE', name: 'Aave', price: '$275.80', balance: '10.0' },
    { symbol: 'UNI', name: 'Uniswap', price: '$13.45', balance: '102.7' },
  ];

  const handleSwapTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

  const calculateToAmount = (amount: string) => {
    if (!amount) return '';
    const rate = fromToken === 'ETH' ? 2450 : fromToken === 'BTC' ? 43250 : 1;
    const toRate = toToken === 'ETH' ? 2450 : toToken === 'BTC' ? 43250 : 1;
    return ((parseFloat(amount) * rate) / toRate).toFixed(6);
  };

  const handleFromAmountChange = (value: string) => {
    setFromAmount(value);
    setToAmount(calculateToAmount(value));
  };

  return (
    <div className="dashboard-card glow-purple max-w-md mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <ArrowUpDown className="w-6 h-6 text-purple-400" />
          </div>
          <h2 className="text-xl font-semibold text-white">Token Swap</h2>
        </div>
        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200">
          <Settings className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      <div className="space-y-4">
        {/* From Token */}
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-400">From</span>
            <span className="text-sm text-gray-400">
              Balance: {tokens.find(t => t.symbol === fromToken)?.balance}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <input
              type="number"
              value={fromAmount}
              onChange={(e) => handleFromAmountChange(e.target.value)}
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
                  {token.symbol}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-2 text-sm text-gray-400">
            ≈ ${fromAmount ? (parseFloat(fromAmount) * parseFloat(tokens.find(t => t.symbol === fromToken)?.price.replace('$', '').replace(',', '') || '0')).toLocaleString() : '0.00'}
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <button
            onClick={handleSwapTokens}
            className="p-3 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 hover:from-purple-500/30 hover:to-cyan-500/30 rounded-full transition-all duration-200 hover:scale-110"
          >
            <ArrowUpDown className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* To Token */}
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-400">To</span>
            <span className="text-sm text-gray-400">
              Balance: {tokens.find(t => t.symbol === toToken)?.balance}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <input
              type="number"
              value={toAmount}
              readOnly
              placeholder="0.0"
              className="flex-1 bg-transparent text-2xl font-semibold text-white placeholder-gray-500 outline-none"
            />
            <select
              value={toToken}
              onChange={(e) => setToToken(e.target.value)}
              className="bg-white/10 text-white px-3 py-2 rounded-lg outline-none cursor-pointer"
            >
              {tokens.map((token) => (
                <option key={token.symbol} value={token.symbol} className="bg-gray-800">
                  {token.symbol}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-2 text-sm text-gray-400">
            ≈ ${toAmount ? (parseFloat(toAmount) * parseFloat(tokens.find(t => t.symbol === toToken)?.price.replace('$', '').replace(',', '') || '0')).toLocaleString() : '0.00'}
          </div>
        </div>

        {/* Swap Details */}
        {fromAmount && toAmount && (
          <div className="bg-gradient-to-r from-purple-500/10 to-cyan-500/10 rounded-xl p-4 border border-purple-500/20">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-400">Exchange Rate</span>
              <span className="text-white">1 {fromToken} = {(parseFloat(toAmount) / parseFloat(fromAmount)).toFixed(6)} {toToken}</span>
            </div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-400">Price Impact</span>
              <span className="text-green-400">{'<0.01%'}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Network Fee</span>
              <span className="text-white">~$12.50</span>
            </div>
          </div>
        )}

        {/* Slippage Settings */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 text-gray-400" />
            <span className="text-gray-400">Slippage Tolerance</span>
          </div>
          <div className="flex items-center space-x-2">
            {['0.1', '0.5', '1.0'].map((value) => (
              <button
                key={value}
                onClick={() => setSlippage(value)}
                className={`px-2 py-1 rounded text-xs transition-all duration-200 ${
                  slippage === value
                    ? 'bg-purple-500/20 text-purple-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {value}%
              </button>
            ))}
          </div>
        </div>

        {/* Swap Button */}
        <button
          disabled={!fromAmount || !toAmount}
          className="w-full py-4 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center space-x-2"
        >
          <Zap className="w-5 h-5" />
          <span>{fromAmount && toAmount ? 'Swap Tokens' : 'Enter Amount'}</span>
        </button>
      </div>
    </div>
  );
};

export default SwapInterface;