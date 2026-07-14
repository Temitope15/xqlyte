use crate::suggestion_engine::get_suggestion;
use crate::types::{FailureCategory, FailureDiagnostics, HopRef, PaymentRequest};

pub struct ClassifierInput {
    pub request: PaymentRequest,
    pub route_score: u8,
    pub asset_score: u8,
    pub liquidity_score: u8,
    pub fee_score: u8,
    pub node_score: u8,
    pub route_failed: bool,
    pub failing_hop: Option<HopRef>,
    pub failing_asset: Option<String>,
}

pub fn classify_failure(input: ClassifierInput) -> FailureDiagnostics {
    let category = if input.route_failed || input.route_score == 0 {
        FailureCategory::Route
    } else if input.liquidity_score == 0 {
        FailureCategory::Capacity
    } else if input.asset_score == 0 {
        if input.failing_asset.is_some() {
            FailureCategory::Swap
        } else {
            FailureCategory::Asset
        }
    } else if input.fee_score == 0 {
        FailureCategory::Fee
    } else if input.node_score == 0 {
        FailureCategory::Node
    } else {
        FailureCategory::Unknown
    };

    let human_reason = match category {
        FailureCategory::Route => {
            "No viable routing path exists to the destination node.".to_string()
        }
        FailureCategory::Capacity => {
            "Insufficient balance/liquidity in channels along the routing path.".to_string()
        }
        FailureCategory::Asset => format!(
            "Asset {} is unsupported by one or more hops.",
            input.request.asset
        ),
        FailureCategory::Swap => {
            "An asset swap is required but swap execution failed or is incompatible.".to_string()
        }
        FailureCategory::Fee => {
            "Total routing fees exceed acceptable threshold limits.".to_string()
        }
        FailureCategory::Node => {
            "One or more intermediary routing nodes are offline or unstable.".to_string()
        }
        FailureCategory::Timeout => {
            "The payment request timed out or exceeded HTLC expiry locks.".to_string()
        }
        FailureCategory::Unknown => {
            "Payment check failed due to incomplete network information.".to_string()
        }
    };

    let technical_reason = match category {
        FailureCategory::Route => {
            "build_route RPC call returned empty hops or route pathfinding failed.".to_string()
        }
        FailureCategory::Capacity => {
            "Channel local balance is less than the requested payment amount.".to_string()
        }
        FailureCategory::Asset => {
            "Node lacks support script cell deps for the requested UDT token.".to_string()
        }
        FailureCategory::Swap => {
            "Swap provider reported zero liquidity or false compatibility flag.".to_string()
        }
        FailureCategory::Fee => {
            "Fee-to-amount ratio is higher than the max budget threshold.".to_string()
        }
        FailureCategory::Node => {
            "Target or intermediary node online flag is false or stability score is critical."
                .to_string()
        }
        FailureCategory::Timeout => {
            "Expiry block/locktime parameters exceed channel policy limits.".to_string()
        }
        FailureCategory::Unknown => {
            "Missing required channel, route, or node info in network query.".to_string()
        }
    };

    let suggestion = get_suggestion(category);

    FailureDiagnostics {
        failure_category: category,
        human_reason,
        technical_reason,
        failing_hop: input.failing_hop,
        failing_asset: input.failing_asset,
        suggested_fix: suggestion.fix,
        retry_strategy: suggestion.retry,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_classify_capacity_failure() {
        let req = PaymentRequest {
            sender: "alice".to_string(),
            receiver: "bob".to_string(),
            amount: 100.0,
            asset: "USDT".to_string(),
            metadata: None,
        };
        let input = ClassifierInput {
            request: req,
            route_score: 25,
            asset_score: 20,
            liquidity_score: 0, // Capacity trigger
            fee_score: 10,
            node_score: 10,
            route_failed: false,
            failing_hop: Some(HopRef {
                channel_id: "channel_1".to_string(),
                node_id: "nodeA".to_string(),
                hop_index: 0,
            }),
            failing_asset: None,
        };
        let diag = classify_failure(input);
        assert_eq!(diag.failure_category, FailureCategory::Capacity);
        assert_eq!(
            diag.suggested_fix,
            "add liquidity / rebalance / reduce amount"
        );
        assert!(diag.failing_hop.is_some());
    }
}
