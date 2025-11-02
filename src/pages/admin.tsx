// Admin Panel for Rivora Protocol API Management
// Simple MVP for hackathon demo

'use client'

import React, { useState, useEffect } from 'react';
import { Settings, BarChart3, Key, Activity, AlertCircle, CheckCircle, Users, Database } from 'lucide-react';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('overview');
  const [apiStats, setApiStats] = useState({
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    uniqueWallets: 0,
  });

  // Mock stats for demo (in production, fetch from database)
  useEffect(() => {
    // Simulate loading stats
    setApiStats({
      totalRequests: 1247,
      successfulRequests: 1189,
      failedRequests: 58,
      uniqueWallets: 342,
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0A0F] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Rivora Protocol Admin Panel
              </h1>
              <p className="text-gray-400 text-sm sm:text-base">API Management & Analytics</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-lg">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-400 text-sm whitespace-nowrap">All Systems Operational</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-gray-800 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'api-keys', label: 'API Keys', icon: Key },
            { id: 'analytics', label: 'Analytics', icon: Activity },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 sm:px-6 py-3 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-400'
                    : 'border-transparent text-gray-400 hover:text-white hover:border-gray-600'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm sm:text-base">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-400 text-sm font-medium">Total Requests</span>
                  <Activity className="w-5 h-5 text-blue-400" />
                </div>
                <div className="text-3xl font-bold text-white mb-1">{apiStats.totalRequests.toLocaleString()}</div>
                <div className="text-xs text-green-400 font-medium">+12% from last week</div>
              </div>

              <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-400 text-sm font-medium">Success Rate</span>
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <div className="text-3xl font-bold text-white mb-1">
                  {apiStats.totalRequests > 0 ? Math.round((apiStats.successfulRequests / apiStats.totalRequests) * 100) : 0}%
                </div>
                <div className="text-xs text-gray-400 font-medium">
                  {apiStats.successfulRequests.toLocaleString()} successful
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-400 text-sm font-medium">Unique Wallets</span>
                  <Users className="w-5 h-5 text-purple-400" />
                </div>
                <div className="text-3xl font-bold text-white mb-1">{apiStats.uniqueWallets.toLocaleString()}</div>
                <div className="text-xs text-cyan-400 font-medium">Active users</div>
              </div>

              <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-400 text-sm font-medium">Blockchain Saves</span>
                  <Database className="w-5 h-5 text-cyan-400" />
                </div>
                <div className="text-3xl font-bold text-white mb-1">156</div>
                <div className="text-xs text-gray-400 font-medium">On-chain records</div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-semibold mb-6 text-white">Recent API Activity</h2>
              <div className="space-y-2">
                {[
                  { endpoint: '/api/v1/score/GABC...', status: 200, time: '2s ago' },
                  { endpoint: '/api/v1/verify/GXYZ...', status: 200, time: '5s ago' },
                  { endpoint: '/api/v1/batch-scores', status: 200, time: '12s ago' },
                  { endpoint: '/api/v1/score/GDEF...', status: 400, time: '18s ago' },
                ].map((activity, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-gray-800/60 rounded-lg border border-gray-700/50 hover:bg-gray-800/80 transition-colors">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {activity.status === 200 ? (
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                      )}
                      <code className="text-sm text-gray-300 truncate">{activity.endpoint}</code>
                    </div>
                    <div className="flex items-center gap-3 text-sm flex-shrink-0 ml-4">
                      <span className={`px-3 py-1 rounded-md font-medium text-xs ${activity.status === 200 ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                        {activity.status}
                      </span>
                      <span className="text-gray-400 whitespace-nowrap">{activity.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* API Keys Tab */}
        {activeTab === 'api-keys' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-6 shadow-lg">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <h2 className="text-xl font-semibold text-white">API Keys</h2>
                <button className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-lg hover:from-purple-600 hover:to-cyan-600 transition-all font-medium text-sm whitespace-nowrap shadow-lg shadow-purple-500/20">
                  Generate New Key
                </button>
              </div>

              <div className="space-y-4">
                {[
                  { name: 'Lending Protocol Alpha', key: 'riv_live_****abcd', requests: 456, status: 'active' },
                  { name: 'DEX Aggregator Beta', key: 'riv_live_****xyz', requests: 234, status: 'active' },
                  { name: 'Yield Farm Gamma', key: 'riv_test_****test', requests: 89, status: 'test' },
                ].map((apiKey, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-gray-800/60 rounded-lg border border-gray-700/50 hover:bg-gray-800/80 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="font-semibold text-white">{apiKey.name}</h3>
                        <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${apiKey.status === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'}`}>
                          {apiKey.status}
                        </span>
                      </div>
                      <code className="text-sm text-gray-400 block break-all">{apiKey.key}</code>
                      <div className="text-xs text-gray-500 mt-2">{apiKey.requests} requests today</div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors font-medium">Copy</button>
                      <button className="px-4 py-2 text-sm bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors font-medium border border-red-500/30">Revoke</button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-sm text-yellow-300">
                  <strong className="font-semibold">MVP Note:</strong> API key system is ready for implementation. Currently all endpoints are public.
                  Rate limiting and authentication can be added based on API keys.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Endpoint Usage */}
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-6 shadow-lg">
                <h2 className="text-xl font-semibold mb-6 text-white">Endpoint Usage</h2>
                <div className="space-y-4">
                  {[
                    { endpoint: '/api/v1/score', usage: 65, color: 'bg-purple-500' },
                    { endpoint: '/api/v1/verify', usage: 20, color: 'bg-cyan-500' },
                    { endpoint: '/api/v1/batch-scores', usage: 10, color: 'bg-blue-500' },
                    { endpoint: '/api/v1/docs', usage: 5, color: 'bg-green-500' },
                  ].map((ep, idx) => (
                    <div key={idx} className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <code className="text-sm text-gray-300 font-mono">{ep.endpoint}</code>
                        <span className="text-sm text-gray-400 font-medium">{ep.usage}%</span>
                      </div>
                      <div className="w-full bg-gray-800/50 rounded-full h-2.5 overflow-hidden">
                        <div className={`${ep.color} h-full rounded-full transition-all duration-500`} style={{ width: `${ep.usage}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Response Times */}
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-6 shadow-lg">
                <h2 className="text-xl font-semibold mb-6 text-white">Performance Metrics</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-gray-800/60 rounded-lg border border-gray-700/50">
                    <span className="text-gray-300 font-medium">Average Response Time</span>
                    <span className="text-green-400 font-bold text-lg">245ms</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-800/60 rounded-lg border border-gray-700/50">
                    <span className="text-gray-300 font-medium">P95 Response Time</span>
                    <span className="text-yellow-400 font-bold text-lg">1.2s</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-800/60 rounded-lg border border-gray-700/50">
                    <span className="text-gray-300 font-medium">Error Rate</span>
                    <span className="text-red-400 font-bold text-lg">4.6%</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-800/60 rounded-lg border border-gray-700/50">
                    <span className="text-gray-300 font-medium">Uptime</span>
                    <span className="text-green-400 font-bold text-lg">99.8%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Usage Over Time */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-semibold mb-6 text-white">Requests Over Time</h2>
              <div className="h-64 flex items-end justify-between gap-2 pb-4">
                {[45, 52, 48, 61, 55, 68, 72, 65, 58, 64, 70, 75].map((height, idx) => (
                  <div
                    key={idx}
                    className="flex-1 bg-gradient-to-t from-purple-500 to-cyan-500 rounded-t hover:from-purple-400 hover:to-cyan-400 transition-all cursor-pointer shadow-lg"
                    style={{ height: `${height}%` }}
                    title={`${height} requests`}
                  ></div>
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-4 pt-4 border-t border-gray-700">
                <span>24h ago</span>
                <span>12h ago</span>
                <span>Now</span>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-semibold mb-6 text-white">API Configuration</h2>

              <div className="space-y-6">
                {/* Rate Limiting */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Rate Limit (requests per minute)
                  </label>
                  <input
                    type="number"
                    defaultValue={60}
                    className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-2">Maximum requests allowed per API key per minute</p>
                </div>

                {/* CORS Settings */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    CORS Origins (comma separated)
                  </label>
                  <input
                    type="text"
                    defaultValue="*"
                    className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-2">Allowed origins for CORS requests. Use * for all.</p>
                </div>

                {/* Cache Settings */}
                <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-purple-500 focus:ring-purple-500 focus:ring-2" />
                    <span className="text-sm font-medium text-gray-300">Enable Score Caching</span>
                  </label>
                  <p className="text-xs text-gray-500 mt-2 ml-8">Cache wallet scores for faster response times</p>
                </div>

                {/* Auto-save Settings */}
                <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-purple-500 focus:ring-purple-500 focus:ring-2" />
                    <span className="text-sm font-medium text-gray-300">Enable Auto-save to Blockchain</span>
                  </label>
                  <p className="text-xs text-gray-500 mt-2 ml-8">Automatically save scores to Soroban contract every 24 hours</p>
                </div>

                <div className="pt-6 border-t border-gray-700">
                  <button className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-lg hover:from-purple-600 hover:to-cyan-600 transition-all font-medium shadow-lg shadow-purple-500/20">
                    Save Settings
                  </button>
                </div>
              </div>
            </div>

            {/* Service Status */}
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-semibold mb-6 text-white">Service Status</h2>
              <div className="space-y-3">
                {[
                  { service: 'API Server', status: 'operational', uptime: '99.9%' },
                  { service: 'Scoring Engine', status: 'operational', uptime: '99.8%' },
                  { service: 'Soroban Contract', status: 'operational', uptime: '100%' },
                  { service: 'Horizon API', status: 'operational', uptime: '99.7%' },
                ].map((service, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-gray-800/60 rounded-lg border border-gray-700/50">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${service.status === 'operational' ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                      <span className="text-gray-300 font-medium">{service.service}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-400">{service.uptime} uptime</span>
                      <span className={`px-3 py-1 rounded-md text-xs font-medium border ${service.status === 'operational' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                        {service.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

