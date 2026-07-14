use crate::types::{PaymentConfidenceResult, PaymentStatus, RiskFactor, RouteSummary};

pub struct ConfidenceInput {
    pub route_score: u8,
    pub asset_score: u8,
    pub liquidity_score: u8,
    pub fee_score: u8,
    pub node_score: u8,
    pub is_missing_data: bool,
    pub best_route: Option<RouteSummary>,
    pub best_asset: Option<String>,
}

pub fn calculate_confidence(input: ConfidenceInput) -> PaymentConfidenceResult {
    let mut risk_factors = Vec::new();
    let mut score = input.route_score as u16
        + input.asset_score as u16
        + input.liquidity_score as u16
        + input.fee_score as u16
        + input.node_score as u16;

    if input.is_missing_data {
        risk_factors.push(RiskFactor {
            category: "RPC-data".to_string(),
            severity: "High".to_string(),
            description: "Required RPC network data is missing or stale".to_string(),
        });
        score = score.saturating_sub(50);
    }

    let final_score = (score.min(100)) as u8;

    if input.route_score < 30 {
        risk_factors.push(RiskFactor {
            category: "route".to_string(),
            severity: if input.route_score < 15 {
                "High".to_string()
            } else {
                "Medium".to_string()
            },
            description: format!("Route score is degraded ({}/30)", input.route_score),
        });
    }

    if input.asset_score < 20 {
        risk_factors.push(RiskFactor {
            category: "asset".to_string(),
            severity: if input.asset_score == 0 {
                "High".to_string()
            } else {
                "Medium".to_string()
            },
            description: format!(
                "Asset compatibility is suboptimal ({}/20)",
                input.asset_score
            ),
        });
    }

    if input.liquidity_score < 30 {
        risk_factors.push(RiskFactor {
            category: "liquidity".to_string(),
            severity: if input.liquidity_score == 0 {
                "High".to_string()
            } else {
                "Medium".to_string()
            },
            description: format!(
                "Path liquidity is borderline or insufficient ({}/30)",
                input.liquidity_score
            ),
        });
    }

    if input.fee_score < 10 {
        risk_factors.push(RiskFactor {
            category: "fee".to_string(),
            severity: if input.fee_score < 5 {
                "Medium".to_string()
            } else {
                "Low".to_string()
            },
            description: format!("Route fees are elevated ({}/10)", input.fee_score),
        });
    }

    if input.node_score < 10 {
        risk_factors.push(RiskFactor {
            category: "node".to_string(),
            severity: if input.node_score == 0 {
                "High".to_string()
            } else {
                "Medium".to_string()
            },
            description: format!(
                "Node stability along path is degraded ({}/10)",
                input.node_score
            ),
        });
    }

    let status = if final_score >= 70 {
        PaymentStatus::CanPay
    } else if final_score <= 40 {
        PaymentStatus::CannotPay
    } else {
        PaymentStatus::Unknown
    };

    let reason = match status {
        PaymentStatus::CanPay => {
            "Payment feasibility is high. Sufficient liquidity and stable route detected."
        }
        PaymentStatus::CannotPay => {
            "Payment cannot be processed due to critical path or asset constraints."
        }
        PaymentStatus::Unknown => {
            "Payment feasibility is uncertain. Review individual risk factors."
        }
    }
    .to_string();

    let technical_reason = format!(
        "route={}, asset={}, liquidity={}, fee={}, node={}, missing_data={}",
        input.route_score,
        input.asset_score,
        input.liquidity_score,
        input.fee_score,
        input.node_score,
        input.is_missing_data
    );

    PaymentConfidenceResult {
        status,
        confidence_score: final_score,
        best_route: input.best_route,
        best_asset: input.best_asset,
        reason,
        technical_reason,
        suggested_fix: if status == PaymentStatus::CanPay {
            "None required."
        } else {
            "Review risk factors and recommendations."
        }
        .to_string(),
        risk_factors,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_prd_worked_example() {
        // route 25 + asset 20 + liquidity 30 + fee 8 + node 9 = 92 -> CAN_PAY
        let input = ConfidenceInput {
            route_score: 25,
            asset_score: 20,
            liquidity_score: 30,
            fee_score: 8,
            node_score: 9,
            is_missing_data: false,
            best_route: None,
            best_asset: None,
        };
        let result = calculate_confidence(input);
        assert_eq!(result.status, PaymentStatus::CanPay);
        assert_eq!(result.confidence_score, 92);
        assert_eq!(result.risk_factors.len(), 3); // route (<30), fee (<10), node (<10)
    }

    #[test]
    fn test_threshold_boundaries() {
        // CanPay exact threshold (70)
        let exact_can_pay = calculate_confidence(ConfidenceInput {
            route_score: 20,
            asset_score: 15,
            liquidity_score: 20,
            fee_score: 5,
            node_score: 10,
            is_missing_data: false,
            best_route: None,
            best_asset: None,
        });
        assert_eq!(exact_can_pay.status, PaymentStatus::CanPay);
        assert_eq!(exact_can_pay.confidence_score, 70);

        // Unknown exact threshold (69)
        let exact_unknown = calculate_confidence(ConfidenceInput {
            route_score: 20,
            asset_score: 14,
            liquidity_score: 20,
            fee_score: 5,
            node_score: 10,
            is_missing_data: false,
            best_route: None,
            best_asset: None,
        });
        assert_eq!(exact_unknown.status, PaymentStatus::Unknown);
        assert_eq!(exact_unknown.confidence_score, 69);

        // Unknown boundary (41)
        let boundary_unknown = calculate_confidence(ConfidenceInput {
            route_score: 10,
            asset_score: 10,
            liquidity_score: 10,
            fee_score: 5,
            node_score: 6,
            is_missing_data: false,
            best_route: None,
            best_asset: None,
        });
        assert_eq!(boundary_unknown.status, PaymentStatus::Unknown);
        assert_eq!(boundary_unknown.confidence_score, 41);

        // CannotPay exact threshold (40)
        let exact_cannot_pay = calculate_confidence(ConfidenceInput {
            route_score: 10,
            asset_score: 10,
            liquidity_score: 10,
            fee_score: 5,
            node_score: 5,
            is_missing_data: false,
            best_route: None,
            best_asset: None,
        });
        assert_eq!(exact_cannot_pay.status, PaymentStatus::CannotPay);
        assert_eq!(exact_cannot_pay.confidence_score, 40);
    }
}
