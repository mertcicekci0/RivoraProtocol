#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Symbol};

// Score data structure stored on-chain
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ScoreData {
    pub wallet_address: Address,
    pub trust_rating: i128,
    pub health_score: i128,
    pub user_type: Symbol,
    pub timestamp: u64,
}

// Contract storage key
#[contracttype]
enum DataKey {
    Scores(Address),
}

#[contract]
pub struct RivoraScoresContract;

#[contractimpl]
impl RivoraScoresContract {
    /// Save Rivora scores for a wallet address
    pub fn save_scores(
        e: Env,
        wallet_address: Address,
        trust_rating: i128,
        health_score: i128,
        user_type: Symbol,
    ) -> ScoreData {
        // Basic validation
        if trust_rating < 0 || trust_rating > 10000 {
            panic!("Invalid trust rating");
        }
        if health_score < 0 || health_score > 10000 {
            panic!("Invalid health score");
        }

        // Create score data
        let score_data = ScoreData {
            wallet_address: wallet_address.clone(),
            trust_rating,
            health_score,
            user_type,
            timestamp: e.ledger().timestamp(),
        };

        // Store in contract storage
        let key = DataKey::Scores(wallet_address);
        e.storage().instance().set(&key, &score_data);

        score_data
    }

    /// Read Rivora scores for a wallet address
    pub fn get_scores(e: Env, wallet_address: Address) -> Option<ScoreData> {
        let key = DataKey::Scores(wallet_address);
        e.storage().instance().get(&key)
    }

    /// Check if scores exist for a wallet address
    pub fn has_scores(e: Env, wallet_address: Address) -> bool {
        let key = DataKey::Scores(wallet_address);
        e.storage().instance().has(&key)
    }
}

#[cfg(test)]
mod test;
