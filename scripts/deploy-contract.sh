#!/bin/bash

# Deploy Soroban contract script
# Deploys the Rivora Scores smart contract to Stellar network

set -e

# Configuration
NETWORK="${STELLAR_NETWORK:-testnet}"
CONTRACT_NAME="rivora-scores"
WASM_FILE="contracts/rivora-scores/target/wasm32v1-none/release/rivora_scores.wasm"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "🚀 Deploying Rivora Scores Contract to $NETWORK network..."

# Check if contract WASM exists
if [ ! -f "$WASM_FILE" ]; then
    echo -e "${RED}❌ Error: Contract WASM file not found: $WASM_FILE${NC}"
    echo "Please run './scripts/build-contract.sh' first."
    exit 1
fi

# Check if soroban-cli is installed
if ! command -v soroban &> /dev/null; then
    echo -e "${RED}❌ Error: soroban-cli is not installed.${NC}"
    echo "Install with: cargo install --locked soroban-cli"
    exit 1
fi

# Set network flag
NETWORK_FLAG=""
if [ "$NETWORK" = "testnet" ]; then
    NETWORK_FLAG="--network testnet"
elif [ "$NETWORK" = "futurenet" ]; then
    NETWORK_FLAG="--network futurenet"
else
    NETWORK_FLAG="--network testnet"
fi

# Get source account
SOURCE_ACCOUNT="${SOROBAN_SOURCE_ACCOUNT:-}"

if [ -z "$SOURCE_ACCOUNT" ]; then
    echo -e "${YELLOW}⚠️  Warning: SOROBAN_SOURCE_ACCOUNT not set.${NC}"
    echo "For testnet deployment, you need a source account."
    echo ""
    echo "Options:"
    echo "1. Set SOROBAN_SOURCE_ACCOUNT environment variable:"
    echo "   export SOROBAN_SOURCE_ACCOUNT=your_testnet_account"
    echo ""
    echo "2. Create a test account on testnet:"
    echo "   Visit: https://laboratory.stellar.org/#account-creator?network=testnet"
    echo "   Or use: stellar-testnet-cli"
    echo ""
    echo "3. Use Soroban CLI identity (if configured):"
    echo "   soroban keys add --network testnet"
    echo ""
    read -p "Enter your testnet account address (G...): " SOURCE_ACCOUNT
    
    if [ -z "$SOURCE_ACCOUNT" ]; then
        echo -e "${RED}❌ Error: Source account is required for deployment${NC}"
        exit 1
    fi
fi

echo "📤 Deploying contract with source account: $SOURCE_ACCOUNT"
DEPLOY_RESULT=$(soroban contract deploy $NETWORK_FLAG --source-account "$SOURCE_ACCOUNT" --wasm "$WASM_FILE" 2>&1)

# Extract contract ID from output
CONTRACT_ID=$(echo "$DEPLOY_RESULT" | grep -oP 'Contract ID: \K[0-9a-f]+' || echo "$DEPLOY_RESULT")

if [ -z "$CONTRACT_ID" ]; then
    echo -e "${RED}❌ Failed to extract contract ID from deployment output${NC}"
    echo "Deployment output: $DEPLOY_RESULT"
    exit 1
fi

echo -e "${GREEN}✅ Contract deployed successfully!${NC}"
echo -e "${GREEN}📋 Contract ID: $CONTRACT_ID${NC}"
echo ""
echo "📝 Next steps:"
echo "1. Save this contract ID to your environment variables:"
echo "   export SOROBAN_CONTRACT_ID=$CONTRACT_ID"
echo "2. Update your .env file:"
echo "   SOROBAN_CONTRACT_ID=$CONTRACT_ID"
echo "3. Use this ID in your TypeScript code to interact with the contract"

# Save contract ID to a file
echo "$CONTRACT_ID" > .soroban-contract-id
echo ""
echo "💾 Contract ID saved to .soroban-contract-id"

