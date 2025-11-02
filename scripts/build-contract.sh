#!/bin/bash

# Build Soroban contract script
# Builds the Rivora Scores smart contract for deployment

set -e

echo "🔨 Building Rivora Scores Soroban Contract..."

CONTRACT_DIR="contracts/rivora-scores"
TARGET_DIR="target"

# Check if Rust and Cargo are installed
if ! command -v cargo &> /dev/null; then
    echo "❌ Error: Cargo (Rust) is not installed."
    echo "Please install Rust: https://rustup.rs/"
    exit 1
fi

# Check if soroban-cli is installed
if ! command -v soroban &> /dev/null; then
    echo "⚠️  Warning: soroban-cli is not installed."
    echo "Installing soroban-cli..."
    cargo install --locked soroban-cli
fi

# Navigate to contract directory
cd "$CONTRACT_DIR" || exit 1

# Build the contract
echo "📦 Building contract..."
soroban contract build

echo "✅ Contract built successfully!"
echo "📁 WASM file location: target/wasm32-unknown-unknown/release/rivora_scores.wasm"

cd - > /dev/null

