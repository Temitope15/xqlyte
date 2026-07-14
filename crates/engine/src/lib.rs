pub mod asset_analyzer;
pub mod confidence_model;
pub mod failure_classifier;
pub mod fee_analyzer;
pub mod liquidity_analyzer;
pub mod node_analyzer;
pub mod route_analyzer;
pub mod suggestion_engine;
pub mod types;
pub mod validator;

use asset_analyzer::analyze_asset as score_asset;
use confidence_model::{ConfidenceInput, calculate_confidence};
use failure_classifier::{ClassifierInput, classify_failure};
use fee_analyzer::analyze_fee as score_fee;
use liquidity_analyzer::analyze_liquidity as score_liquidity;
use node_analyzer::analyze_node_health as score_node;
use route_analyzer::analyze_route as score_route;
use types::*;
use validator::validate_request;

/// Determines payment confidence and feasibility.
#[allow(clippy::too_many_arguments)]
pub fn can_pay(
    request: &PaymentRequest,
    route: Option<&RouteData>,
    hop_nodes: &[NodeData],
    channels: &[ChannelData],
    asset_supported: bool,
    swap_data: Option<&SwapData>,
    is_missing_data: bool,
) -> PaymentConfidenceResult {
    // 1. Validate request
    let req = match validate_request(request) {
        Ok(r) => r,
        Err(e) => {
            return PaymentConfidenceResult {
                status: PaymentStatus::CannotPay,
                confidence_score: 0,
                best_route: None,
                best_asset: None,
                reason: format!("Validation failed: {}", e),
                technical_reason: e.to_string(),
                suggested_fix: "Correct the payment request parameters.".to_string(),
                risk_factors: vec![RiskFactor {
                    category: "validation".to_string(),
                    severity: "High".to_string(),
                    description: e.to_string(),
                }],
            };
        }
    };

    // 2. Perform score analysis
    let route_score = if let Some(r) = route {
        score_route(r, hop_nodes)
    } else {
        0
    };

    let asset_score = score_asset(asset_supported, swap_data);
    let liquidity_score = score_liquidity(req.amount, channels);

    let fee_score = if let Some(r) = route {
        score_fee(req.amount, r.total_fee as f64)
    } else {
        0
    };

    let node_score = score_node(hop_nodes);

    let best_route = route.map(|r| RouteSummary {
        hops: r.hops.iter().map(|h| h.node_id.clone()).collect(),
        total_fee: r.total_fee as f64,
        total_expiry: r.total_expiry,
    });

    let best_asset = if asset_score >= 12 {
        Some(req.asset.clone())
    } else {
        None
    };

    // 3. Compute confidence
    calculate_confidence(ConfidenceInput {
        route_score,
        asset_score,
        liquidity_score,
        fee_score,
        node_score,
        is_missing_data,
        best_route,
        best_asset,
    })
}

/// Diagnoses path or payment constraints and maps to taxonomy failure.
#[allow(clippy::too_many_arguments)]
pub fn diagnose_failure(
    request: &PaymentRequest,
    route: Option<&RouteData>,
    hop_nodes: &[NodeData],
    channels: &[ChannelData],
    asset_supported: bool,
    swap_data: Option<&SwapData>,
    failing_hop: Option<HopRef>,
    failing_asset: Option<String>,
) -> FailureDiagnostics {
    let route_failed = route.is_none();

    let route_score = if let Some(r) = route {
        score_route(r, hop_nodes)
    } else {
        0
    };

    let asset_score = score_asset(asset_supported, swap_data);
    let liquidity_score = score_liquidity(request.amount, channels);

    let fee_score = if let Some(r) = route {
        score_fee(request.amount, r.total_fee as f64)
    } else {
        0
    };

    let node_score = score_node(hop_nodes);

    classify_failure(ClassifierInput {
        request: request.clone(),
        route_score,
        asset_score,
        liquidity_score,
        fee_score,
        node_score,
        route_failed,
        failing_hop,
        failing_asset,
    })
}

/// Returns confidence score and risk factors.
#[allow(clippy::too_many_arguments)]
pub fn confidence_score(
    request: &PaymentRequest,
    route: Option<&RouteData>,
    hop_nodes: &[NodeData],
    channels: &[ChannelData],
    asset_supported: bool,
    swap_data: Option<&SwapData>,
    is_missing_data: bool,
) -> (u8, Vec<RiskFactor>) {
    let res = can_pay(
        request,
        route,
        hop_nodes,
        channels,
        asset_supported,
        swap_data,
        is_missing_data,
    );
    (res.confidence_score, res.risk_factors)
}

/// Evaluates and suggests the best asset config.
pub fn best_asset(
    request: &PaymentRequest,
    asset_supported: bool,
    swap_data: Option<&SwapData>,
) -> (String, u8, String) {
    let asset_score = score_asset(asset_supported, swap_data);
    if asset_score == 20 {
        (
            request.asset.clone(),
            100,
            "Asset is natively supported and compatible.".to_string(),
        )
    } else if asset_score == 12 {
        (
            request.asset.clone(),
            60,
            "Asset requires a compatible swap provider.".to_string(),
        )
    } else {
        (
            "CKB".to_string(),
            0,
            "Requested asset is unsupported and swap is unavailable.".to_string(),
        )
    }
}

/// Evaluates and selects the best route path.
pub fn best_route(
    routes: &[RouteData],
    nodes_per_route: &[Vec<NodeData>],
) -> (RouteSummary, u8, String) {
    let mut best_summary = RouteSummary {
        hops: vec![],
        total_fee: 0.0,
        total_expiry: 0,
    };
    let mut max_score = 0;
    let mut best_index = 0;

    for (idx, route) in routes.iter().enumerate() {
        let score = score_route(route, &nodes_per_route[idx]);
        if score > max_score {
            max_score = score;
            best_index = idx;
        }
    }

    if routes.is_empty() {
        return (
            best_summary,
            0,
            "No viable routing paths available.".to_string(),
        );
    }

    let br = &routes[best_index];
    best_summary = RouteSummary {
        hops: br.hops.iter().map(|h| h.node_id.clone()).collect(),
        total_fee: br.total_fee as f64,
        total_expiry: br.total_expiry,
    };

    (
        best_summary,
        max_score,
        format!(
            "Route selected with score {}/30 based on hop count and node stability.",
            max_score
        ),
    )
}

/// Evaluates detailed route hop analytics.
pub fn analyze_route_hops(
    route: &RouteData,
    hop_nodes: &[NodeData],
    channels: &[ChannelData],
) -> RouteAnalysis {
    let score = score_route(route, hop_nodes);
    let mut hops = Vec::new();

    for h in &route.hops {
        let node = hop_nodes.iter().find(|n| n.node_id == h.node_id);
        let chan = channels.iter().find(|c| c.channel_id == h.channel_id);

        let capacity = chan.map(|c| c.capacity as f64).unwrap_or(0.0);
        let local_balance = chan.map(|c| c.local_balance as f64).unwrap_or(0.0);
        let remote_balance = chan.map(|c| c.remote_balance as f64).unwrap_or(0.0);
        let node_stable = node.map(|n| n.stability_score >= 80).unwrap_or(false);
        let fee = h.fee as f64;

        hops.push(HopAnalysis {
            channel_id: h.channel_id.clone(),
            node_id: h.node_id.clone(),
            capacity,
            local_balance,
            remote_balance,
            node_stable,
            fee,
        });
    }

    RouteAnalysis {
        route_score: score,
        hops,
    }
}

/// Evaluates asset compatibility properties.
pub fn analyze_asset_compatibility(
    asset: &str,
    asset_supported: bool,
    swap_data: Option<&SwapData>,
) -> AssetAnalysis {
    let is_supported = asset_supported;
    let liquidity = swap_data.map(|s| s.liquidity as f64).unwrap_or(0.0);
    let swap_provider_available = swap_data.is_some();
    let average_fee = swap_data.map(|s| s.fee as f64).unwrap_or(0.0);

    AssetAnalysis {
        asset: asset.to_string(),
        is_supported,
        liquidity,
        swap_provider_available,
        average_fee,
    }
}

/// Formats a PaymentConfidenceResult as a structured log record.
pub fn format_log_result(result: &PaymentConfidenceResult) -> String {
    serde_json::to_string(result).unwrap_or_default()
}
