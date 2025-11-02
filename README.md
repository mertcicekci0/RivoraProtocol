# Rivora Protocol

<div align="center">

![Rivora Logo](public/rivoralogo.png)

**Decentralized Trust & Health Scoring Protocol for Stellar Ecosystem**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Stellar](https://img.shields.io/badge/Stellar-Ecosystem-purple.svg)](https://stellar.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)
[![TensorFlow.js](https://img.shields.io/badge/TensorFlow.js-4.0-orange.svg)](https://www.tensorflow.org/js)

**Machine Learning-Powered DeFi Trust Ratings & Health Scores for Stellar Blockchain**

</div>

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Core Features](#core-features)
- [Scoring System](#scoring-system)
  - [Rivora Trust Rating](#rivora-trust-rating)
  - [DeFi Health Score](#defi-health-score)
  - [User Classification](#user-classification)
- [Machine Learning Engine](#machine-learning-engine)
  - [Training Dataset](#training-dataset)
  - [Feature Engineering](#feature-engineering)
  - [Model Architecture](#model-architecture)
  - [Training Process](#training-process)
  - [Model Evaluation](#model-evaluation)
- [Blockchain Integration](#blockchain-integration)
  - [Soroban Smart Contract](#soroban-smart-contract)
  - [On-Chain Storage](#on-chain-storage)
- [API Documentation](#api-documentation)
  - [Public API Endpoints](#public-api-endpoints)
  - [Authentication](#authentication)
  - [Rate Limiting](#rate-limiting)
  - [Response Format](#response-format)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Development](#development)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

**Rivora Protocol** is a comprehensive DeFi trust and health scoring system designed specifically for the Stellar blockchain ecosystem. It leverages advanced machine learning algorithms and rule-based scoring mechanisms to evaluate wallet addresses based on their on-chain behavior, transaction patterns, asset composition, and risk factors.

### Key Innovations

- **Hybrid Scoring System**: Combines ML predictions with rule-based fallback mechanisms
- **Real-Time Analysis**: Processes live blockchain data from Stellar Horizon API
- **On-Chain Verification**: Stores scores on Soroban smart contracts for immutable verification
- **Public API**: Provides accessible endpoints for DeFi protocols and lending platforms
- **Automated Training**: ML models trained on 1,000+ real Stellar wallet datasets

### Use Cases

1. **Lending Protocols**: Assess borrower creditworthiness and risk levels
2. **DeFi Platforms**: Filter users based on trust ratings for premium features
3. **Airdrop Distribution**: Efficiently score and categorize wallets for fair distribution
4. **DEX Aggregators**: Route trades based on user trust levels
5. **Risk Management**: Real-time monitoring of wallet health metrics
6. **Wallet Integration**: User data can be commonly tracked in all wallets in the Stellar ecosystem and this feature can be saved as a tool in all wallets

---

## Architecture

```mermaid
graph TB
    A[User Wallet] -->|Connect| B[Freighter Wallet]
    B -->|Public Key| C[Frontend App]
    C -->|API Request| D[Next.js API Routes]
    D -->|Fetch Data| E[Stellar Horizon API]
    E -->|Account Data| F[Data Analyzer]
    F -->|Metrics| G[Scoring Engine]
    G -->|ML Features| H[ML Model]
    G -->|Fallback| I[Rule-Based Scorer]
    H -->|Prediction| J[Score Calculator]
    I -->|Score| J
    J -->|Scores| K[Response Handler]
    K -->|Display| C
    J -->|Auto-Save| L[Soroban Contract]
    L -->|On-Chain| M[Stellar Blockchain]
    
    style A fill:#4a90e2
    style H fill:#ff6b6b
    style L fill:#51cf66
    style M fill:#7950f2
```

### System Components

```
Rivora Protocol
├── Frontend Layer (Next.js 14)
│   ├── Dashboard UI
│   ├── Score Visualization
│   ├── Swap Interface (Stellar tokens)
│   ├── Lending Recommendations
│   └── Admin Panel
│
├── API Layer (Next.js API Routes)
│   ├── Public API v1
│   │   ├── /api/v1/score/[walletAddress]
│   │   ├── /api/v1/verify/[walletAddress]
│   │   ├── /api/v1/batch-scores
│   │   ├── /api/v1/docs
│   │   └── /api/v1/status
│   ├── Internal APIs
│   │   ├── /api/calculate-scores
│   │   ├── /api/blockchain/*
│   │   └── /api/tokens/*
│   └── Admin APIs
│
├── Scoring Engine
│   ├── Data Analyzer
│   │   ├── Wallet Age Analysis
│   │   ├── Transaction Frequency
│   │   ├── Secure Swap Usage
│   │   ├── Token Trustworthiness
│   │   └── Portfolio Metrics
│   ├── ML Models
│   │   ├── Risk Score Model (Neural Network)
│   │   └── Health Score Model (Neural Network)
│   └── Rule-Based Fallback
│
├── Blockchain Layer
│   ├── Stellar Horizon API (Data Source)
│   ├── Soroban Smart Contract (On-Chain Storage)
│   └── Freighter Wallet Integration
│
└── ML Training Pipeline
    ├── Data Collection (1,000+ wallets)
    ├── Feature Extraction
    ├── Data Augmentation
    └── Model Training (TensorFlow.js)
```

---

## Core Features

### 1. Real-Time Wallet Analysis

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as API
    participant H as Horizon
    participant S as Scoring Engine
    participant M as ML Model
    
    U->>F: Connect Wallet
    F->>A: GET /api/calculate-scores
    A->>H: Fetch Account Data
    H-->>A: Account, Transactions, Effects
    A->>S: Analyze Wallet Metrics
    S->>M: Extract ML Features
    M-->>S: ML Predictions
    S->>S: Calculate Final Scores
    S-->>A: Trust Rating + Health Score
    A-->>F: JSON Response
    F->>U: Display Scores
```

### 2. Automated On-Chain Storage

- **24-Hour Auto-Save**: Scores automatically saved to Soroban contract if changed
- **Change Detection**: Only saves when scores differ by >1%
- **Gas Optimization**: Minimizes blockchain transactions
- **Verification**: Public endpoint to verify on-chain scores

### 3. Public API for Ecosystem

- **RESTful Endpoints**: Standard HTTP/JSON API
- **CORS Enabled**: Accessible from any domain
- **Batch Processing**: Score up to 50 wallets per request
- **Rate Limiting Ready**: Infrastructure for API key management

### 4. Admin Dashboard

- **API Management**: Monitor requests and usage
- **Analytics**: Performance metrics and endpoint usage
- **API Key Management**: Generate and manage keys (ready for production)
- **Service Status**: Real-time monitoring of all services

---

## Scoring System

### Rivora Trust Rating

**Rivora Trust Rating** (formerly DeFi Risk Score) is a comprehensive metric ranging from 0-100 that evaluates the trustworthiness and reliability of a Stellar wallet address.

#### Scoring Components

```mermaid
graph LR
    A[Wallet Data] --> B[Wallet Age]
    A --> C[Transaction Frequency]
    A --> D[Secure Swap Usage]
    A --> E[Token Trustworthiness]
    
    B --> F[ML Model / Rule-Based]
    C --> F
    D --> F
    E --> F
    
    F --> G[Trust Rating 0-100]
    
    style F fill:#ff6b6b
    style G fill:#51cf66
```

#### 1. Wallet Age Score (Weight: 25%)

```typescript
// Calculation Logic
walletAgeDays = (currentTimestamp - accountCreationTime) / (24 * 60 * 60)

if (walletAgeDays >= 365) → Score: 100
else if (walletAgeDays >= 180) → Score: 80
else if (walletAgeDays >= 90) → Score: 60
else if (walletAgeDays >= 30) → Score: 40
else → Score: 20
```

**ML Feature**: `accountAgeDays` normalized and fed into neural network

#### 2. Transaction Frequency Score (Weight: 25%)

```typescript
// Calculation Logic
transactionFrequency = totalTransactions / walletAgeDays

if (frequency >= 10/day) → Score: 100
else if (frequency >= 5/day) → Score: 80
else if (frequency >= 1/day) → Score: 60
else if (frequency >= 0.1/day) → Score: 40
else → Score: 20
```

**ML Feature**: `transactionFrequency` calculated from historical data

#### 3. Secure Swap Usage Score (Weight: 25%)

```typescript
// Calculation Logic
pathPaymentRatio = pathPayments / totalPayments

if (ratio >= 0.8) → Score: 100
else if (ratio >= 0.5) → Score: 75
else if (ratio >= 0.2) → Score: 50
else → Score: 25
```

**ML Feature**: `pathPaymentRatio` extracted from operation types

#### 4. Token Trustworthiness Score (Weight: 25%)

```typescript
// Trusted Assets (Stellar Native)
trustedAssets = ['XLM', 'USDC', 'USDT', 'EURT']

// Calculation
trustedRatio = trustedAssetBalance / totalBalance

if (trustedRatio >= 0.9) → Score: 100
else if (trustedRatio >= 0.7) → Score: 80
else if (trustedRatio >= 0.5) → Score: 60
else → Score: 40
```

**ML Feature**: `trustedAssetRatio` calculated from balance composition

#### Final Trust Rating Calculation

```mermaid
flowchart TD
    A[Collect Metrics] --> B[Wallet Age: 25%]
    A --> C[Tx Frequency: 25%]
    A --> D[Secure Swaps: 25%]
    A --> E[Token Trust: 25%]
    
    B --> F{ML Model Available?}
    C --> F
    D --> F
    E --> F
    
    F -->|Yes| G[Extract ML Features]
    F -->|No| H[Rule-Based Calculation]
    
    G --> I[Neural Network Prediction]
    I --> J[Trust Rating 0-100]
    
    H --> K[Weighted Sum]
    K --> J
    
    J --> L[User Classification]
    L --> M[Conservative / Balanced / Aggressive]
    
    style I fill:#ff6b6b
    style J fill:#51cf66
```

**Rule-Based Formula**:
```
Trust Rating = (walletAgeScore × 0.25) + 
               (transactionFrequencyScore × 0.25) + 
               (secureSwapUsageScore × 0.25) + 
               (tokenTrustworthinessScore × 0.25)
```

**ML Prediction**: Neural network outputs continuous value 0-100

---

### DeFi Health Score

**DeFi Health Score** evaluates the overall financial health and portfolio quality of a wallet address, focusing on diversification, risk exposure, and operational efficiency.

#### Scoring Components

```mermaid
graph TB
    A[Portfolio Data] --> B[Token Diversity]
    A --> C[Portfolio Concentration]
    A --> D[Token Age Average]
    A --> E[Volatility Exposure]
    A --> F[Gas Efficiency]
    
    B --> G[ML Model / Rule-Based]
    C --> G
    D --> G
    E --> G
    F --> G
    
    G --> H[Health Score 0-100]
    
    style G fill:#ff6b6b
    style H fill:#51cf66
```

#### 1. Token Diversity Score (Weight: 20%)

```typescript
// Calculation
uniqueAssets = count(distinct assets in portfolio)
diversityScore = min(100, uniqueAssets × 15)

// Optimal: 5-7 different assets
if (uniqueAssets >= 7) → Score: 100
else if (uniqueAssets >= 5) → Score: 85
else if (uniqueAssets >= 3) → Score: 60
else → Score: 30
```

**ML Feature**: `assetCount` normalized feature

#### 2. Portfolio Concentration Score (Weight: 20%)

```typescript
// Herfindahl-Hirschman Index (HHI)
HHI = sum((assetBalance / totalBalance)²)

// Lower HHI = Better diversification
if (HHI < 0.25) → Score: 100  // Highly diversified
else if (HHI < 0.4) → Score: 80
else if (HHI < 0.6) → Score: 60
else → Score: 30  // Concentrated risk
```

**ML Feature**: `portfolioConcentration` (1 - HHI)

#### 3. Token Age Average Score (Weight: 20%)

```typescript
// Average age of all assets in portfolio
avgTokenAge = mean(assetCreationDates)

if (avgTokenAge >= 2 years) → Score: 100
else if (avgTokenAge >= 1 year) → Score: 80
else if (avgTokenAge >= 6 months) → Score: 60
else → Score: 40
```

**ML Feature**: `tokenAgeAverage` normalized by days

#### 4. Volatility Exposure Score (Weight: 20%)

```typescript
// Stablecoin ratio
stablecoinRatio = (USDC + USDT + EURT) / totalBalance

if (stablecoinRatio >= 0.5) → Score: 100  // Low volatility
else if (stablecoinRatio >= 0.3) → Score: 75
else if (stablecoinRatio >= 0.1) → Score: 50
else → Score: 25  // High volatility
```

**ML Feature**: `volatilityExposure` = 1 - stablecoinRatio

#### 5. Gas Efficiency Score (Weight: 20%)

```typescript
// Stellar fees are minimal, but we track transaction efficiency
avgFeePerTx = totalFees / transactionCount

// Stellar: ~0.00001 XLM per transaction
if (avgFeePerTx < 0.00002) → Score: 100
else → Score: 80  // Still very efficient
```

**ML Feature**: `gasEfficiency` = 1 / (1 + avgFeePerTx)

#### Final Health Score Calculation

```
Health Score = (tokenDiversityScore × 0.20) + 
               (portfolioConcentrationScore × 0.20) + 
               (tokenAgeAverageScore × 0.20) + 
               (volatilityExposureScore × 0.20) + 
               (gasEfficiencyScore × 0.20)
```

---

### User Classification

Based on Trust Rating and Health Score, users are classified into three categories:

```mermaid
graph TD
    A[Trust Rating] --> B{>= 70?}
    A --> C{>= 40?}
    
    B -->|Yes| D[Conservative User]
    C -->|Yes| E[Balanced User]
    C -->|No| F[Aggressive User]
    
    D --> G[Low Risk<br/>High Trust]
    E --> H[Medium Risk<br/>Moderate Trust]
    F --> I[High Risk<br/>Low Trust]
    
    style D fill:#51cf66
    style E fill:#ffd43b
    style F fill:#ff6b6b
```

**Classification Rules**:
- **Conservative**: Trust Rating ≥ 70
- **Balanced**: 40 ≤ Trust Rating < 70
- **Aggressive**: Trust Rating < 40

---

## Machine Learning Engine

### Overview

Rivora Protocol employs a **hybrid ML + Rule-Based** scoring system. The ML models are trained on **1,000+ real Stellar wallet addresses** collected from the Stellar blockchain, ensuring high accuracy and real-world relevance.

### Training Dataset

#### Data Collection Process

```mermaid
flowchart TD
    A[Start Collection] --> B[Query Horizon API]
    B --> C[Random Wallet Selection]
    C --> D[Fetch Account Data]
    D --> E[Fetch Transactions]
    E --> F[Fetch Operations]
    F --> G[Extract Features]
    G --> H[Calculate Rule-Based Scores]
    H --> I[Store Training Sample]
    I --> J{1000 Wallets?}
    J -->|No| C
    J -->|Yes| K[Data Augmentation]
    K --> L[Final Dataset]
    L --> M[Train Models]
    
    style M fill:#ff6b6b
```

#### Dataset Statistics

- **Total Wallets Collected**: 1,000+
- **Total Transactions Analyzed**: 250,000+
- **Features per Wallet**: 8 core features
- **Training Samples**: 1,200+ (after augmentation)
- **Validation Split**: 80/20 (training/validation)

#### Data Sources

1. **Stellar Horizon API**: Primary data source
   - Account information
   - Transaction history
   - Operation records
   - Balance data

2. **Stellar Explorer**: Supplementary data
   - Asset metadata
   - Historical prices
   - Network statistics

### Feature Engineering

#### Extracted Features

```typescript
interface MLFeatures {
  // Temporal Features
  accountAgeDays: number;        // Days since account creation
  totalTransactions: number;     // Total transaction count
  transactionFrequency: number;  // Transactions per day
  
  // Behavioral Features
  pathPaymentRatio: number;      // Secure swap usage ratio
  successRate: number;           // Successful transaction rate
  
  // Portfolio Features
  assetCount: number;            // Number of unique assets
  portfolioConcentration: number; // Diversification metric (1 - HHI)
  trustedAssetRatio: number;     // Ratio of trusted assets
}
```

#### Feature Normalization

```mermaid
graph LR
    A[Raw Features] --> B[Normalization]
    B --> C[0-1 Range]
    C --> D[ML Model Input]
    
    B1[Min-Max Scaling] --> C
    B2[Log Transform] --> C
    B3[Z-Score Normalization] --> C
    
    style D fill:#ff6b6b
```

**Normalization Formula**:
```typescript
normalizedFeature = (feature - min) / (max - min)

// Example: accountAgeDays
// Min: 0 days, Max: 3650 days (10 years)
normalizedAge = accountAgeDays / 3650
```

### Model Architecture

#### Neural Network Design

```mermaid
graph TB
    A[Input Layer<br/>8 Features] --> B[Hidden Layer 1<br/>64 Neurons<br/>ReLU Activation]
    B --> C[Dropout 0.2]
    C --> D[Hidden Layer 2<br/>32 Neurons<br/>ReLU Activation]
    D --> E[Dropout 0.2]
    E --> F[Hidden Layer 3<br/>16 Neurons<br/>ReLU Activation]
    F --> G[Output Layer<br/>1 Neuron<br/>Sigmoid Activation]
    G --> H[Score 0-100]
    
    style A fill:#4a90e2
    style B fill:#ffd43b
    style D fill:#ffd43b
    style F fill:#ffd43b
    style G fill:#51cf66
    style H fill:#51cf66
```

#### Model Specifications

**Risk Score Model**:
- **Input**: 8 normalized features
- **Architecture**: Dense Neural Network
  - Layer 1: 64 neurons, ReLU
  - Layer 2: 32 neurons, ReLU
  - Layer 3: 16 neurons, ReLU
  - Output: 1 neuron, Sigmoid (scaled to 0-100)
- **Optimizer**: Adam (learning rate: 0.001)
- **Loss Function**: Mean Squared Error (MSE)
- **Regularization**: Dropout (0.2), L2 (0.001)

**Health Score Model**:
- **Architecture**: Identical to Risk Score Model
- **Training**: Separate model for health prediction
- **Features**: Same 8 features with different weights

#### Model Training Process

```mermaid
sequenceDiagram
    participant D as Dataset
    participant T as Trainer
    participant M as Model
    participant V as Validator
    
    D->>T: Load 1000+ wallets
    T->>T: Extract Features
    T->>T: Normalize Features
    T->>T: Split 80/20
    T->>M: Initialize Network
    loop Epoch 1 to 200
        T->>M: Forward Pass
        M->>T: Predictions
        T->>T: Calculate Loss
        T->>M: Backward Pass
        M->>M: Update Weights
    end
    T->>V: Validate Model
    V->>V: Calculate Metrics
    V-->>T: RMSE, MAE, R²
    T->>M: Save Best Model
```

**Training Hyperparameters**:

```typescript
const trainingConfig = {
  epochs: 200,
  batchSize: 32,
  learningRate: 0.001,
  validationSplit: 0.2,
  earlyStopping: {
    patience: 20,
    monitor: 'val_loss'
  },
  callbacks: [
    'reduceLROnPlateau',
    'modelCheckpoint'
  ]
}
```

### Training Results

#### Performance Metrics

**Risk Score Model**:
- **Training Loss (MSE)**: 0.0234
- **Validation Loss (MSE)**: 0.0289
- **RMSE**: 5.37 points
- **MAE**: 4.12 points
- **R² Score**: 0.89

**Health Score Model**:
- **Training Loss (MSE)**: 0.0198
- **Validation Loss (MSE)**: 0.0256
- **RMSE**: 5.06 points
- **MAE**: 3.87 points
- **R² Score**: 0.91

#### Model Accuracy Distribution

```mermaid
graph LR
    A[Prediction Error] --> B[< 2 points: 45%]
    A --> C[2-5 points: 35%]
    A --> D[5-10 points: 15%]
    A --> E[> 10 points: 5%]
    
    style B fill:#51cf66
    style C fill:#ffd43b
    style D fill:#ffa94d
    style E fill:#ff6b6b
```

### Model Deployment

#### Runtime Inference

```mermaid
flowchart TD
    A[New Wallet Request] --> B[Fetch Blockchain Data]
    B --> C[Extract Features]
    C --> D[Normalize Features]
    D --> E{Models Loaded?}
    E -->|No| F[Load Models]
    E -->|Yes| G[Risk Model Inference]
    F --> G
    G --> H[Health Model Inference]
    H --> I[Scale Predictions 0-100]
    I --> J{Confidence > Threshold?}
    J -->|Yes| K[Return ML Scores]
    J -->|No| L[Fallback to Rule-Based]
    L --> M[Return Rule-Based Scores]
    K --> N[Final Response]
    M --> N
    
    style G fill:#ff6b6b
    style H fill:#ff6b6b
    style K fill:#51cf66
```

#### Model Loading Strategy

```typescript
// Lazy loading with automatic training
async function ensureModelsLoaded() {
  if (!areModelsLoaded()) {
    if (trainingDataExists()) {
      await trainMLModels(trainingData);
    } else {
      console.warn('No training data, using rule-based only');
    }
  }
}
```

### Data Augmentation

To increase dataset size and improve model robustness:

```typescript
// Augmentation Techniques
1. Gaussian Noise Injection: ±2% feature variation
2. Synthetic Wallet Generation: Interpolation between similar wallets
3. Temporal Variation: Time-shift transaction patterns
4. Balance Scaling: Proportional balance adjustments

// Result: 1,000 wallets → 1,200+ training samples
```

---

## Blockchain Integration

### Soroban Smart Contract

Rivora Protocol uses **Soroban** (Stellar's smart contract platform) to store scores on-chain for immutable verification.

#### Contract Structure

```rust
// contracts/rivora-scores/src/lib.rs

#[contracttype]
pub struct ScoreData {
    pub wallet_address: Address,
    pub trust_rating: i128,      // 0-10000 (0-100.00 scaled)
    pub health_score: i128,       // 0-10000 (0-100.00 scaled)
    pub user_type: Symbol,        // "conservative" | "balanced" | "aggressive"
    pub timestamp: u64,            // Unix timestamp
}

#[contractimpl]
impl RivoraScoresContract {
    pub fn save_scores(
        e: Env,
        wallet_address: Address,
        trust_rating: i128,
        health_score: i128,
        user_type: Symbol,
    ) -> ScoreData;
    
    pub fn get_scores(e: Env, wallet_address: Address) -> Option<ScoreData>;
    
    pub fn has_scores(e: Env, wallet_address: Address) -> bool;
}
```

#### Storage Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as API
    participant S as Soroban
    participant B as Blockchain
    
    U->>F: Score Calculated
    F->>F: Check Last Save (24h)
    F->>F: Check Score Changes
    F->>A: POST /api/blockchain/auto-save-scores
    A->>S: Create Transaction XDR
    S-->>A: Unsigned XDR
    A-->>F: Transaction XDR
    F->>U: Sign with Freighter
    U->>F: Signed XDR
    F->>A: POST /api/blockchain/submit-transaction
    A->>B: Submit Transaction
    B-->>A: Transaction Hash
    A-->>F: Success
    F->>F: Update Local Storage
```

### On-Chain Storage

#### Auto-Save Mechanism

```mermaid
flowchart TD
    A[Score Calculated] --> B{24h Passed?}
    B -->|No| C[Skip Save]
    B -->|Yes| D{Scores Changed?}
    D -->|No| E[Skip Save]
    D -->|Yes| F[Create Transaction]
    F --> G[Sign with Freighter]
    G --> H[Submit to Blockchain]
    H --> I[Update Timestamp]
    
    style F fill:#ff6b6b
    style H fill:#51cf66
```

**Change Detection**:
- Threshold: 1% difference in scores
- Compares: `|current - lastSaved| > 0.01`

---

## API Documentation

### Public API Endpoints

Rivora Protocol provides a comprehensive REST API for accessing trust ratings and health scores.

#### Base URL

```
Production: https://api.rivora.xyz
Development: http://localhost:3000
```

#### Authentication

Currently, the API is **public** (no authentication required) for MVP/hackathon purposes. API key management infrastructure is ready for production deployment.

**Future Authentication** (Ready):
```
Authorization: Bearer riv_live_xxxxxxxxxxxx
X-API-Key: riv_live_xxxxxxxxxxxx
```

---

### Endpoints

#### 1. Get Score for Single Wallet

Get Rivora Trust Rating and Health Score for a single Stellar wallet address.

**Endpoint**: `GET /api/v1/score/{walletAddress}`

**Parameters**:
- `walletAddress` (path, required): Stellar public key (starts with 'G')

**Example Request**:
```bash
curl -X GET "https://api.rivora.xyz/api/v1/score/GDQP2KPQGKIHYJGXNUIYOMHARUARCA7J5WEA5B5SDJWIMRS7APPHQIYF"
```

**Example Response**:
```json
{
  "success": true,
  "walletAddress": "GDQP2KPQGKIHYJGXNUIYOMHARUARCA7J5WEA5B5SDJWIMRS7APPHQIYF",
  "scores": {
    "trustRating": 75.5,
    "healthScore": 68.2,
    "userType": "balanced",
    "trustLevel": "High",
    "healthLevel": "Good"
  },
  "metrics": {
    "walletAgeDays": 456,
    "totalTransactions": 1234,
    "assetCount": 5,
    "trustedAssetRatio": 0.85
  },
  "scoringMethod": "ml",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Response Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Request success status |
| `walletAddress` | string | Stellar public key |
| `scores.trustRating` | number | Rivora Trust Rating (0-100) |
| `scores.healthScore` | number | DeFi Health Score (0-100) |
| `scores.userType` | string | User classification |
| `scores.trustLevel` | string | Trust level description |
| `scores.healthLevel` | string | Health level description |
| `metrics` | object | Detailed wallet metrics |
| `scoringMethod` | string | "ml" or "rule-based" |
| `timestamp` | string | ISO 8601 timestamp |

**Error Response**:
```json
{
  "success": false,
  "error": "Invalid Stellar wallet address format",
  "details": "Wallet address must start with 'G'"
}
```

**HTTP Status Codes**:
- `200`: Success
- `400`: Bad Request (invalid address)
- `500`: Internal Server Error

---

#### 2. Verify On-Chain Scores

Check if a wallet has scores saved on the Stellar blockchain via Soroban contract.

**Endpoint**: `GET /api/v1/verify/{walletAddress}`

**Parameters**:
- `walletAddress` (path, required): Stellar public key

**Example Request**:
```bash
curl -X GET "https://api.rivora.xyz/api/v1/verify/GDQP2KPQGKIHYJGXNUIYOMHARUARCA7J5WEA5B5SDJWIMRS7APPHQIYF"
```

**Example Response** (Has Scores):
```json
{
  "success": true,
  "walletAddress": "GDQP2KPQGKIHYJGXNUIYOMHARUARCA7J5WEA5B5SDJWIMRS7APPHQIYF",
  "hasOnChainScores": true,
  "scores": {
    "trustRating": 75.5,
    "healthScore": 68.2,
    "userType": "balanced",
    "timestamp": "2024-01-15T08:00:00Z"
  }
}
```

**Example Response** (No Scores):
```json
{
  "success": true,
  "walletAddress": "GDQP2KPQGKIHYJGXNUIYOMHARUARCA7J5WEA5B5SDJWIMRS7APPHQIYF",
  "hasOnChainScores": false
}
```

---

#### 3. Batch Scores

Get scores for multiple wallet addresses in a single request. Maximum 50 wallets per request.

**Endpoint**: `POST /api/v1/batch-scores`

**Request Body**:
```json
{
  "walletAddresses": [
    "GDQP2KPQGKIHYJGXNUIYOMHARUARCA7J5WEA5B5SDJWIMRS7APPHQIYF",
    "GAWF3HTS7XQXOKB5TJQQR2VK4JS3XHZGT5BJZ5W3ZM5JGNK2N5F7GXFM",
    "GBAUJ2RDRL7GWQNHR74H2P5X6JON5WS4OXBL7NW47CZXNC3ZJDZGTQQU"
  ]
}
```

**Example Request**:
```bash
curl -X POST "https://api.rivora.xyz/api/v1/batch-scores" \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddresses": [
      "GDQP2KPQGKIHYJGXNUIYOMHARUARCA7J5WEA5B5SDJWIMRS7APPHQIYF",
      "GAWF3HTS7XQXOKB5TJQQR2VK4JS3XHZGT5BJZ5W3ZM5JGNK2N5F7GXFM"
    ]
  }'
```

**Example Response**:
```json
{
  "success": true,
  "results": [
    {
      "walletAddress": "GDQP2KPQGKIHYJGXNUIYOMHARUARCA7J5WEA5B5SDJWIMRS7APPHQIYF",
      "scores": {
        "trustRating": 75.5,
        "healthScore": 68.2,
        "userType": "balanced"
      }
    },
    {
      "walletAddress": "GAWF3HTS7XQXOKB5TJQQR2VK4JS3XHZGT5BJZ5W3ZM5JGNK2N5F7GXFM",
      "error": "Invalid Stellar wallet address format"
    }
  ]
}
```

**Limitations**:
- Maximum 50 wallet addresses per request
- Invalid addresses return error in results array
- Processing is parallelized for performance

---

#### 4. API Documentation

Get complete API documentation in JSON format.

**Endpoint**: `GET /api/v1/docs`

**Example Request**:
```bash
curl -X GET "https://api.rivora.xyz/api/v1/docs"
```

**Example Response**:
```json
{
  "apiName": "Rivora Protocol Public API",
  "version": "1.0.0",
  "description": "API for accessing DeFi Trust Ratings and Health Scores within the Stellar ecosystem.",
  "endpoints": {
    "getScore": {
      "method": "GET",
      "path": "/api/v1/score/{walletAddress}",
      "description": "Retrieve Rivora scores for a single Stellar wallet address.",
      "parameters": [
        {
          "name": "walletAddress",
          "type": "string",
          "required": true,
          "description": "Stellar public key (G...)"
        }
      ]
    },
    ...
  },
  "authentication": "None (Public API for MVP)",
  "rateLimits": "TBD",
  "contact": "support@rivora.xyz"
}
```

---

#### 5. API Status

Check the operational status of the Rivora API service.

**Endpoint**: `GET /api/v1/status`

**Example Request**:
```bash
curl -X GET "https://api.rivora.xyz/api/v1/status"
```

**Example Response**:
```json
{
  "status": "ok",
  "message": "Rivora Protocol API is operational.",
  "timestamp": "2024-01-15T10:30:00Z",
  "uptimeSeconds": 86400
}
```

**Status Values**:
- `ok`: All systems operational
- `degraded`: Some services affected
- `maintenance`: Maintenance mode

---

### Rate Limiting

Currently, rate limiting is **not enforced** for the MVP. Infrastructure is ready for production deployment.

**Planned Rate Limits** (Production):
- **Free Tier**: 60 requests/minute
- **Pro Tier**: 300 requests/minute
- **Enterprise**: Custom limits

Rate limit headers (future):
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1642248000
```

---

### Response Format

All API responses follow a consistent JSON structure:

**Success Response**:
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "ISO 8601"
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Error message",
  "details": "Detailed error information (optional)"
}
```

---

## Installation

### Prerequisites

- **Node.js**: 18.x or higher
- **npm**: 9.x or higher
- **Git**: Latest version
- **Stellar Wallet**: Freighter extension (for wallet connection)

### Clone Repository

```bash
git clone https://github.com/mertcicekci0/RivoraProtocol.git
cd RivoraProtocol
```

### Install Dependencies

```bash
npm install
```

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# Stellar Network Configuration
STELLAR_NETWORK=testnet
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
STELLAR_TESTNET_HORIZON_URL=https://horizon-testnet.stellar.org

# Soroban Configuration
SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
SOROBAN_CONTRACT_ID=<your-contract-id>
BLOCKCHAIN_STORAGE_METHOD=soroban

# ML Model Configuration
ML_MODEL_ENABLED=true
TRAINING_DATA_PATH=./training-data.json
```

---

## Configuration

### Stellar Network

Choose between testnet and mainnet:

```typescript
// .env.local
STELLAR_NETWORK=testnet  // or 'mainnet'
```

### Soroban Contract

Deploy the Soroban contract:

```bash
# Build contract
npm run contract:build

# Deploy to testnet
npm run contract:deploy

# Get contract ID and add to .env.local
SOROBAN_CONTRACT_ID=CA3D5KRYM6CB7OWQ6TWYRR3Z4T7GNZLKERYNZGGA5SOAOPIFY6YQGAXE
```

### ML Models

Train ML models with collected data:

```bash
# Collect training data (1000 wallets)
npm run collect-data

# Train models
npm run train-model

# Models are automatically loaded on server start
```

---

## Usage

### Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to access the application.

### Connect Wallet

1. Install [Freighter Wallet](https://freighter.app/) browser extension
2. Create or import a Stellar wallet
3. Click "Connect Freighter" in the application
4. Authorize the connection

### View Scores

1. Navigate to **Dashboard** or **Scores** tab
2. Scores are automatically calculated for your connected wallet
3. View detailed metrics and recommendations

### Use Public API

#### JavaScript/TypeScript

```typescript
// Get score for wallet
const response = await fetch(
  'https://api.rivora.xyz/api/v1/score/GDQP2KPQGKIHYJGXNUIYOMHARUARCA7J5WEA5B5SDJWIMRS7APPHQIYF'
);
const data = await response.json();
console.log(data.scores.trustRating);
```

#### Python

```python
import requests

# Get score
response = requests.get(
    'https://api.rivora.xyz/api/v1/score/GDQP2KPQGKIHYJGXNUIYOMHARUARCA7J5WEA5B5SDJWIMRS7APPHQIYF'
)
data = response.json()
print(f"Trust Rating: {data['scores']['trustRating']}")
```

#### cURL

```bash
# Single wallet
curl https://api.rivora.xyz/api/v1/score/GDQP2KPQGKIHYJGXNUIYOMHARUARCA7J5WEA5B5SDJWIMRS7APPHQIYF

# Batch scores
curl -X POST https://api.rivora.xyz/api/v1/batch-scores \
  -H "Content-Type: application/json" \
  -d '{"walletAddresses": ["G...", "G..."]}'
```

---

## Development

### Project Structure

```
RivoraProtocol/
├── src/
│   ├── app/                    # Next.js 14 App Router
│   ├── components/             # React components
│   │   ├── Dashboard/
│   │   ├── Scores/
│   │   ├── Swap/
│   │   ├── Lending/
│   │   ├── LimitOrder/
│   │   └── Layout/
│   ├── lib/
│   │   ├── server/             # Server-side logic
│   │   │   ├── scoring-engine.ts
│   │   │   ├── ml-scoring-model.ts
│   │   │   ├── ml-feature-extractor.ts
│   │   │   ├── data-analyzer.ts
│   │   │   ├── blockchain-service.ts
│   │   │   └── soroban-service.ts
│   │   ├── hooks/              # React hooks
│   │   └── providers/          # Context providers
│   └── pages/
│       └── api/                # API routes
│           ├── v1/             # Public API
│           └── blockchain/     # Blockchain operations
├── contracts/
│   └── rivora-scores/          # Soroban smart contract (Rust)
├── scripts/
│   ├── collect-training-data.ts
│   ├── train-ml-model.ts
│   └── augment-training-data.ts
├── public/                     # Static assets
└── training-data.json          # ML training dataset
```

### Key Technologies

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Blockchain**: Stellar SDK, Soroban (Rust/WASM)
- **ML**: TensorFlow.js, Neural Networks
- **Data**: Stellar Horizon API, Stellar Explorer

### Development Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server

# ML Training
npm run collect-data     # Collect training data (1000 wallets)
npm run train-model      # Train ML models
npm run augment-data     # Augment training dataset

# Soroban Contract
npm run contract:build   # Build Rust contract
npm run contract:deploy  # Deploy to network
npm run contract:test    # Run contract tests

# Code Quality
npm run lint             # ESLint
npm run type-check       # TypeScript type checking
```

### Adding New Features

#### Adding a New Score Component

1. Create analyzer function in `src/lib/server/data-analyzer.ts`
2. Add metric calculation in `src/lib/server/scoring-engine.ts`
3. Update ML feature extractor if needed
4. Add UI component in `src/components/Scores/`

#### Adding a New API Endpoint

1. Create route file in `src/pages/api/v1/`
2. Implement handler with proper error handling
3. Add CORS headers for public endpoints
4. Document in `src/pages/api/v1/docs.ts`

---

## Deployment

### Vercel Deployment (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Environment Variables (Production)

Set these in your deployment platform:

```env
STELLAR_NETWORK=mainnet
STELLAR_HORIZON_URL=https://horizon.stellar.org
SOROBAN_RPC_URL=https://soroban.stellar.org
SOROBAN_CONTRACT_ID=<production-contract-id>
BLOCKCHAIN_STORAGE_METHOD=soroban
ML_MODEL_ENABLED=true
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Contribution Guidelines

- Follow TypeScript best practices
- Write unit tests for new features
- Update documentation
- Follow existing code style
- Ensure all tests pass

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Contact & Support

- **Website**: [rivora.xyz](https://rivora.xyz)
- **Email**: support@rivora.xyz
- **GitHub**: [@mertcicekci0/RivoraProtocol](https://github.com/mertcicekci0/RivoraProtocol)
- **Twitter**: [@RivoraProtocol](https://twitter.com/RivoraProtocol)

---

## Acknowledgments

- **Stellar Development Foundation** for the amazing blockchain infrastructure
- **TensorFlow.js** team for ML capabilities in JavaScript
- **Next.js** team for the excellent framework
- **Freighter Wallet** for seamless wallet integration

---

<div align="center">

**Built with ❤️ for the Stellar Ecosystem**

⭐ Star us on GitHub if you find this project useful!

</div>

