use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct PaymentRequest {
    pub sender: String,
    pub receiver: String,
    pub amount: f64,
    pub asset: String,
    pub metadata: Option<serde_json::Value>,
}

#[derive(Debug, Copy, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum PaymentStatus {
    CanPay,
    CannotPay,
    Unknown,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct PaymentConfidenceResult {
    pub status: PaymentStatus,
    pub confidence_score: u8, // Range: 0-100
    pub best_route: Option<RouteSummary>,
    pub best_asset: Option<String>,
    pub reason: String,           // User-facing text
    pub technical_reason: String, // Technical detail
    pub suggested_fix: String,
    pub risk_factors: Vec<RiskFactor>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct RiskFactor {
    pub category: String, // route, asset, liquidity, fee, node, RPC-data
    pub severity: String, // Low | Medium | High
    pub description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct RouteSummary {
    pub hops: Vec<String>, // Node IDs along the path
    pub total_fee: f64,
    pub total_expiry: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct FailureDiagnostics {
    pub failure_category: FailureCategory,
    pub human_reason: String,
    pub technical_reason: String,
    pub failing_hop: Option<HopRef>,
    pub failing_asset: Option<String>,
    pub suggested_fix: String,
    pub retry_strategy: String,
}

#[derive(Debug, Copy, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum FailureCategory {
    Capacity,
    Asset,
    Route,
    Fee,
    Node,
    Timeout,
    Swap,
    Unknown,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct HopRef {
    pub channel_id: String,
    pub node_id: String,
    pub hop_index: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct RouteRef {
    pub hops: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct RouteAnalysis {
    pub route_score: u8,
    pub hops: Vec<HopAnalysis>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct HopAnalysis {
    pub channel_id: String,
    pub node_id: String,
    pub capacity: f64,
    pub local_balance: f64,
    pub remote_balance: f64,
    pub node_stable: bool,
    pub fee: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct AssetAnalysis {
    pub asset: String,
    pub is_supported: bool,
    pub liquidity: f64,
    pub swap_provider_available: bool,
    pub average_fee: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ChannelData {
    pub channel_id: String,
    pub capacity: u64,
    pub local_balance: u64,
    pub remote_balance: u64,
    pub asset: String,
    pub health: String, // "Healthy" | "Degraded" | "Offline"
    pub age: u64,       // channel age in blocks/seconds
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct RouteData {
    pub hops: Vec<HopData>,
    pub total_fee: u64,
    pub total_expiry: u32,
    pub stability_score: u8, // 0-100
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct HopData {
    pub channel_id: String,
    pub node_id: String,
    pub expiry: u32,
    pub fee: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct AssetData {
    pub asset_id: String,
    pub liquidity: u64,
    pub network: String,
    pub is_supported: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct NodeData {
    pub node_id: String,
    pub uptime: f64, // 0.0 to 1.0 representation
    pub peer_count: usize,
    pub stability_score: u8, // 0-100
    pub is_online: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct FeeData {
    pub base_fee: u64,
    pub proportional_fee: u64,
    pub fee_schedule: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct SwapData {
    pub provider: String,
    pub liquidity: u64,
    pub fee: u64,
    pub is_compatible: bool,
}
