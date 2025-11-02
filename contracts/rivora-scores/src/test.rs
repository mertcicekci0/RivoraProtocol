#![cfg(test)]

use super::*;
use soroban_sdk::{symbol_short, testutils::Address as _, Address, Env, Symbol};

#[test]
fn test_save_and_get_scores() {
    let env = Env::default();
    let contract_id = env.register_contract(None, RivoraScoresContract);
    let client = RivoraScoresContractClient::new(&env, &contract_id);

    let wallet_address = Address::generate(&env);

    let result = client.save_scores(
        &wallet_address,
        &8550i128,
        &7230i128,
        &symbol_short!("balanced"),
    );

    assert_eq!(result.wallet_address, wallet_address);
    assert_eq!(result.trust_rating, 8550);
    assert_eq!(result.health_score, 7230);

    let retrieved = client.get_scores(&wallet_address);
    assert!(retrieved.is_some());
    let scores = retrieved.unwrap();
    assert_eq!(scores.trust_rating, 8550);
    assert_eq!(scores.health_score, 7230);

    assert!(client.has_scores(&wallet_address));
}
