#!/bin/bash
# Script to train ML model with large dataset (1000 wallets)
# This demonstrates the scalability of the ML training system

echo "🚀 Large Dataset ML Training"
echo "============================"
echo ""
echo "This will:"
echo "1. Collect data from 1000 Stellar wallets"
echo "2. Train ML models with the collected data"
echo "3. Show training statistics"
echo ""
echo "⏰ Estimated time: 30-60 minutes (depending on API response times)"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Cancelled."
    exit 1
fi

echo ""
echo "📦 Step 1: Collecting training data from 1000 wallets..."
echo "=================================================="
npm run collect-data

if [ $? -ne 0 ]; then
    echo "❌ Data collection failed!"
    exit 1
fi

echo ""
echo "🤖 Step 2: Training ML models..."
echo "=================================================="
npm run train-model

if [ $? -ne 0 ]; then
    echo "❌ Model training failed!"
    exit 1
fi

echo ""
echo "✅ Large dataset training complete!"
echo "📊 Check training-data.json for collected samples"
echo "🎯 Models are now ready for production use!"

