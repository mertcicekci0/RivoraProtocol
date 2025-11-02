// Simple API Demo Page
// Shows how other protocols can use Rivora API

'use client'

import React, { useState } from 'react';
import { Code, ExternalLink, CheckCircle, Copy } from 'lucide-react';

export default function APIDemo() {
  const [walletAddress, setWalletAddress] = useState('');
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchScore = async () => {
    if (!walletAddress) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/v1/score/${walletAddress}`);
      const data = await response.json();
      setApiResponse(data);
    } catch (error) {
      setApiResponse({ error: 'Failed to fetch score' });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
          Rivora Protocol API
        </h1>
        <p className="text-gray-400 mb-8">
          Public API for accessing Rivora Trust Ratings and Health Scores. 
          Built for DeFi protocols, lending platforms, and DEX aggregators in the Stellar ecosystem.
        </p>

        {/* API Endpoints */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Get Score */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Get Wallet Score</h2>
              <Code className="w-5 h-5 text-gray-400" />
            </div>
            <div className="bg-black rounded p-4 mb-4 font-mono text-sm">
              <div className="text-purple-400">GET</div>
              <div className="text-cyan-400">/api/v1/score/</div>
              <div className="text-yellow-400">&#123;walletAddress&#125;</div>
            </div>
            <div className="space-y-3">
              <input
                type="text"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="Enter Stellar wallet address (G...)"
                className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white"
              />
              <button
                onClick={fetchScore}
                disabled={loading || !walletAddress}
                className="w-full bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 rounded px-4 py-2 font-medium disabled:opacity-50"
              >
                {loading ? 'Fetching...' : 'Test API'}
              </button>
            </div>
          </div>

          {/* Verify Score */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Verify On-Chain</h2>
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div className="bg-black rounded p-4 mb-4 font-mono text-sm">
              <div className="text-purple-400">GET</div>
              <div className="text-cyan-400">/api/v1/verify/</div>
              <div className="text-yellow-400">&#123;walletAddress&#125;</div>
            </div>
            <p className="text-sm text-gray-400">
              Check if wallet has scores saved on Stellar blockchain (Soroban contract)
            </p>
          </div>
        </div>

        {/* Response */}
        {apiResponse && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">API Response</h2>
              <button
                onClick={() => copyToClipboard(JSON.stringify(apiResponse, null, 2))}
                className="p-2 hover:bg-gray-800 rounded"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <pre className="bg-black rounded p-4 overflow-auto text-sm">
              {JSON.stringify(apiResponse, null, 2)}
            </pre>
          </div>
        )}

        {/* Integration Examples */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Integration Examples</h2>
          
          <div className="space-y-4">
            {/* JavaScript */}
            <div>
              <h3 className="text-lg font-medium mb-2 text-purple-400">JavaScript/TypeScript</h3>
              <pre className="bg-black rounded p-4 overflow-auto text-sm">
{`const response = await fetch(
  'https://rivora.xyz/api/v1/score/GABCDEF...'
);
const data = await response.json();

if (data.success) {
  const { trustRating, healthScore } = data.scores;
  // Use scores for lending decisions, fee adjustments, etc.
}`}
              </pre>
            </div>

            {/* cURL */}
            <div>
              <h3 className="text-lg font-medium mb-2 text-cyan-400">cURL</h3>
              <pre className="bg-black rounded p-4 overflow-auto text-sm">
{`curl https://rivora.xyz/api/v1/score/GABCDEF...`}
              </pre>
            </div>
          </div>
        </div>

        {/* Use Cases */}
        <div className="mt-8 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/30 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Use Cases</h2>
          <ul className="space-y-2 text-gray-300">
            <li>• Lending platforms: Adjust interest rates based on Trust Rating</li>
            <li>• DEX aggregators: Prioritize orders from verified wallets</li>
            <li>• Yield farming: Offer better APY to trusted users</li>
            <li>• DeFi protocols: Customize fees based on wallet credibility</li>
            <li>• Cross-protocol reputation system for Stellar ecosystem</li>
          </ul>
        </div>

        {/* Documentation Link */}
        <div className="mt-8 text-center">
          <a
            href="/api/v1/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300"
          >
            View Full API Documentation
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}

