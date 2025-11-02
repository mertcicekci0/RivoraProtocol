# Soroban Smart Contract Integration

Rivora now supports storing scores on-chain using **Soroban smart contracts** in addition to native Stellar Data Entry.

## 🚀 Quick Start

### 1. Prerequisites

- **Rust**: Install from [rustup.rs](https://rustup.rs/)
- **Soroban CLI**: Install with `cargo install --locked soroban-cli`
- **Stellar SDK**: Already included in `package.json`

### 2. Build the Contract

```bash
./scripts/build-contract.sh
```

This will compile the Rust contract to WASM format.

### 3. Deploy the Contract

```bash
# For testnet (default)
STELLAR_NETWORK=testnet ./scripts/deploy-contract.sh

# For futurenet (Soroban testing network)
STELLAR_NETWORK=futurenet ./scripts/deploy-contract.sh
```

The script will output a **Contract ID** - save this!

### 4. Configure Environment

Add to your `.env` file:

```bash
# Use Soroban smart contract (or 'data-entry' for native)
BLOCKCHAIN_STORAGE_METHOD=soroban

# Contract ID from deployment
SOROBAN_CONTRACT_ID=YOUR_CONTRACT_ID_HERE

# Network
STELLAR_NETWORK=testnet

# Soroban RPC URL (optional, defaults provided)
SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
```

### 5. Use in Application

The application automatically uses Soroban if:
- `BLOCKCHAIN_STORAGE_METHOD=soroban`
- `SOROBAN_CONTRACT_ID` is set

Otherwise, it falls back to Data Entry (native Stellar).

## 📋 Contract Functions

### `save_scores`
Save Rivora scores for a wallet.

**Parameters:**
- `wallet_address`: Stellar wallet address (Address)
- `trust_rating`: Trust rating (0-100, multiplied by 100: 85.5 → 8550)
- `health_score`: Health score (0-100, multiplied by 100)
- `user_type`: "conservative", "balanced", or "aggressive"

**Returns:** Stored `ScoreData`

### `get_scores`
Retrieve scores for a wallet.

**Parameters:**
- `wallet_address`: Stellar wallet address to query

**Returns:** `Option<ScoreData>` - Score data if exists

### `has_scores`
Check if scores exist for a wallet.

**Parameters:**
- `wallet_address`: Stellar wallet address to check

**Returns:** `bool`

## 🏗️ Contract Structure

```
contracts/rivora-scores/
├── Cargo.toml          # Rust dependencies
├── src/
│   ├── lib.rs          # Main contract code
│   └── test.rs         # Unit tests
```

## 🧪 Testing

Run contract tests:

```bash
cd contracts/rivora-scores
cargo test
```

## 📚 Differences: Soroban vs Data Entry

| Feature | Data Entry | Soroban Contract |
|---------|-----------|------------------|
| **Storage** | Account data (64 bytes max) | Contract storage (unlimited) |
| **Validation** | None | Built-in validation |
| **Querying** | Horizon API | Contract function calls |
| **Complexity** | Simple | More complex, more powerful |
| **Cost** | Lower | Higher (smart contract fees) |
| **Upgradability** | No | Yes (with admin) |

## 🔧 Troubleshooting

### Contract not deploying
- Check Rust installation: `rustc --version`
- Check Soroban CLI: `soroban --version`
- Ensure network RPC is accessible

### "Contract ID not set" error
- Verify `SOROBAN_CONTRACT_ID` in `.env`
- Re-deploy contract if needed

### Transaction fails
- Check wallet has enough XLM for fees
- Verify contract is deployed on correct network
- Check Soroban RPC endpoint is accessible

## 📖 Additional Resources

- [Soroban Documentation](https://soroban.stellar.org/docs)
- [Stellar SDK Docs](https://developers.stellar.org/docs/sdks/js)
- [Soroban Examples](https://github.com/stellar/soroban-examples)

