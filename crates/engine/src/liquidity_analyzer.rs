use crate::types::ChannelData;

/// Scores the liquidity of the path between 0 and 30.
/// - Sufficient = 30
/// - Borderline (amount <= local_balance < amount * 2) = 15
/// - Insufficient = 0
pub fn analyze_liquidity(amount: f64, channels: &[ChannelData]) -> u8 {
    if channels.is_empty() {
        return 0;
    }

    let mut min_balance = f64::MAX;
    for chan in channels {
        let bal = chan.local_balance as f64;
        if bal < min_balance {
            min_balance = bal;
        }
    }

    if min_balance < amount {
        0
    } else if min_balance >= amount * 2.0 {
        30
    } else {
        15
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_abundant_liquidity() {
        let channels = vec![ChannelData {
            channel_id: "c1".to_string(),
            capacity: 10000,
            local_balance: 5000,
            remote_balance: 5000,
            asset: "USDT".to_string(),
            health: "Healthy".to_string(),
            age: 100,
        }];
        assert_eq!(analyze_liquidity(100.0, &channels), 30);
    }

    #[test]
    fn test_borderline_liquidity() {
        let channels = vec![ChannelData {
            channel_id: "c1".to_string(),
            capacity: 10000,
            local_balance: 150,
            remote_balance: 9850,
            asset: "USDT".to_string(),
            health: "Healthy".to_string(),
            age: 100,
        }];
        // 150 >= 100 but 150 < 200, so borderline (15)
        assert_eq!(analyze_liquidity(100.0, &channels), 15);
    }

    #[test]
    fn test_insufficient_liquidity() {
        let channels = vec![ChannelData {
            channel_id: "c1".to_string(),
            capacity: 10000,
            local_balance: 50,
            remote_balance: 9950,
            asset: "USDT".to_string(),
            health: "Healthy".to_string(),
            age: 100,
        }];
        assert_eq!(analyze_liquidity(100.0, &channels), 0);
    }
}
