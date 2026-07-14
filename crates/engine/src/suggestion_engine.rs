use crate::types::FailureCategory;

pub struct Suggestion {
    pub fix: String,
    pub retry: String,
}

pub fn get_suggestion(category: FailureCategory) -> Suggestion {
    match category {
        FailureCategory::Capacity => Suggestion {
            fix: "add liquidity / rebalance / reduce amount".to_string(),
            retry: "Re-check after channel rebalancing or try a smaller amount".to_string(),
        },
        FailureCategory::Asset => Suggestion {
            fix: "use recommended asset / enable swap".to_string(),
            retry: "Attempt using a supported asset or configure a swap provider".to_string(),
        },
        FailureCategory::Route => Suggestion {
            fix: "retry later / alternative asset / more peers".to_string(),
            retry: "Connect to more peers or verify routing channels".to_string(),
        },
        FailureCategory::Fee => Suggestion {
            fix: "increase fee budget / shorter route".to_string(),
            retry: "Adjust maximum fee limit or find a shorter path".to_string(),
        },
        FailureCategory::Node => Suggestion {
            fix: "avoid node / reconnect peers".to_string(),
            retry: "Wait for node reconnection or avoid the failing peer".to_string(),
        },
        FailureCategory::Timeout => Suggestion {
            fix: "shorter route / larger expiry window".to_string(),
            retry: "Reduce the number of path hops or increase expiry parameters".to_string(),
        },
        FailureCategory::Swap => Suggestion {
            fix: "use supported asset / retry / alt provider".to_string(),
            retry: "Verify swap provider status or use a native token".to_string(),
        },
        FailureCategory::Unknown => Suggestion {
            fix: "retry / refresh gossip / increase RPC timeout".to_string(),
            retry: "Refresh network gossip database and retry query".to_string(),
        },
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_suggestions() {
        let cap_sug = get_suggestion(FailureCategory::Capacity);
        assert_eq!(cap_sug.fix, "add liquidity / rebalance / reduce amount");
        assert_eq!(
            cap_sug.retry,
            "Re-check after channel rebalancing or try a smaller amount"
        );
    }
}
