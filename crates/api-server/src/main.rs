use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    routing::{get, post},
    Json, Router,
};
use rpc::client::FiberRpcClient;
use rpc::mock::{MockFiberRpcClient, MockScenario};
use sdk_rust::XqlyteClient;
use engine::types::*;
use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use tower_http::cors::{Any, CorsLayer};

#[derive(Clone)]
struct AppState {
    db: Arc<Mutex<rusqlite::Connection>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LogEntry {
    pub id: Option<i64>,
    pub timestamp: String,
    pub sender: String,
    pub receiver: String,
    pub amount: f64,
    pub asset: String,
    pub status: String,
    pub confidence_score: u8,
    pub failure_category: Option<String>,
    pub reason: String,
    pub technical_reason: String,
    pub suggested_fix: String,
}

#[derive(Deserialize)]
struct CanPayParams {
    scenario: Option<String>,
    payment_id: Option<String>,
}

#[derive(Deserialize)]
struct DiagnoseParams {
    sender: Option<String>,
    receiver: Option<String>,
    amount: Option<f64>,
    asset: Option<String>,
}

#[derive(Deserialize)]
struct RouteParams {
    sender: Option<String>,
    amount: Option<f64>,
    scenario: Option<String>,
}

#[derive(Deserialize)]
struct AssetParams {
    scenario: Option<String>,
}

#[derive(Deserialize)]
struct LogParams {
    recent: Option<u32>,
}

#[derive(Serialize)]
struct ScoreResponse {
    score: u8,
    risk_factors: Vec<RiskFactor>,
}

#[derive(Serialize)]
struct BestAssetResponse {
    asset: String,
    confidence: u8,
    reason: String,
}

#[derive(Serialize)]
struct BestRouteResponse {
    route: RouteSummary,
    score: u8,
    reason: String,
}

fn parse_scenario(s: &str) -> MockScenario {
    match s.to_lowercase().replace("-", "").as_str() {
        "happypath" | "happy" => MockScenario::HappyPath,
        "capacityfail" | "capacity" => MockScenario::CapacityFail,
        "assetfail" | "asset" => MockScenario::AssetFail,
        "routefail" | "route" => MockScenario::RouteFail,
        "feefail" | "fee" => MockScenario::FeeFail,
        "nodefail" | "node" => MockScenario::NodeFail,
        "timeoutfail" | "timeout" => MockScenario::TimeoutFail,
        "swapfail" | "swap" => MockScenario::SwapFail,
        "unknownfail" | "unknown" => MockScenario::UnknownFail,
        _ => MockScenario::HappyPath,
    }
}

fn get_scenario_from_params(scenario: Option<String>, payment_id: Option<String>) -> MockScenario {
    if let Some(s) = scenario {
        parse_scenario(&s)
    } else if let Some(p) = payment_id {
        parse_scenario(&p)
    } else {
        MockScenario::HappyPath
    }
}

#[tokio::main]
async fn main() {
    // 1. Initialize SQLite Database
    let conn = rusqlite::Connection::open("xqlyte_logs.db")
        .expect("Failed to open SQLite database 'xqlyte_logs.db'");

    conn.execute(
        "CREATE TABLE IF NOT EXISTS logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            sender TEXT NOT NULL,
            receiver TEXT NOT NULL,
            amount REAL NOT NULL,
            asset TEXT NOT NULL,
            status TEXT NOT NULL,
            confidence_score INTEGER NOT NULL,
            failure_category TEXT,
            reason TEXT NOT NULL,
            technical_reason TEXT NOT NULL,
            suggested_fix TEXT NOT NULL
        )",
        [],
    )
    .expect("Failed to create table 'logs'");

    // Seed initial mock log entries if database is empty
    let count: i64 = conn.query_row("SELECT count(*) FROM logs", [], |row| row.get(0)).unwrap_or(0);
    if count == 0 {
        let sample_logs = vec![
            (
                "2026-07-14T04:22:30Z", "alice", "bob", 100.0, "USDT", "CanPay", 92,
                None, "Payment feasibility is high. Sufficient liquidity and stable route detected.",
                "route=30, asset=20, liquidity=30, fee=4, node=8, missing_data=false", "None required."
            ),
            (
                "2026-07-14T04:23:15Z", "alice", "bob", 1500.0, "USDT", "CannotPay", 0,
                Some("Capacity"), "Insufficient balance/liquidity in channels along the routing path.",
                "Channel local balance is less than the requested payment amount.", "add liquidity / rebalance / reduce amount"
            ),
        ];

        for log in sample_logs {
            let _ = conn.execute(
                "INSERT INTO logs (timestamp, sender, receiver, amount, asset, status, confidence_score, failure_category, reason, technical_reason, suggested_fix)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
                rusqlite::params![log.0, log.1, log.2, log.3, log.4, log.5, log.6, log.7, log.8, log.9, log.10],
            );
        }
    }

    let shared_state = AppState {
        db: Arc::new(Mutex::new(conn)),
    };

    // 2. Configure CORS
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    // 3. Build routes
    let app = Router::new()
        .route("/can-pay", post(handle_can_pay))
        .route("/diagnose/:payment_id", get(handle_diagnose))
        .route("/confidence-score", post(handle_confidence_score))
        .route("/best-asset", post(handle_best_asset))
        .route("/best-route", post(handle_best_route))
        .route("/route/:to", get(handle_route_analysis))
        .route("/asset/:asset", get(handle_asset_analysis))
        .route("/topology/nodes", get(handle_topology_nodes))
        .route("/topology/channels", get(handle_topology_channels))
        .route("/logs", get(handle_logs))
        .layer(cors)
        .with_state(shared_state);

    // 4. Start Axum server
    let port = std::env::var("PORT").unwrap_or_else(|_| "3000".to_string());
    let addr = format!("0.0.0.0:{}", port);
    let listener = tokio::net::TcpListener::bind(&addr)
        .await
        .unwrap();
    println!("XQlyte API Server started on http://{}", addr);
    axum::serve(listener, app).await.unwrap();
}

async fn handle_can_pay(
    State(state): State<AppState>,
    Query(params): Query<CanPayParams>,
    Json(payload): Json<PaymentRequest>,
) -> (StatusCode, Json<PaymentConfidenceResult>) {
    let scenario = get_scenario_from_params(params.scenario, params.payment_id);
    let mock_client = MockFiberRpcClient::new(scenario);
    let sdk = XqlyteClient::new(mock_client);

    match sdk.can_pay(payload.clone()).await {
        Ok(result) => {
            // Write to SQLite
            let timestamp = chrono::Utc::now().to_rfc3339();
            let status_str = match result.status {
                PaymentStatus::CanPay => "CanPay",
                PaymentStatus::CannotPay => "CannotPay",
                PaymentStatus::Unknown => "Unknown",
            };

            let (failure_category, final_fix) = if result.status != PaymentStatus::CanPay {
                if let Ok(diag) = sdk.diagnose_failure(payload.clone(), None, None).await {
                    (
                        Some(format!("{:?}", diag.failure_category)),
                        diag.suggested_fix,
                    )
                } else {
                    (None, result.suggested_fix.clone())
                }
            } else {
                (None, result.suggested_fix.clone())
            };

            let db = state.db.lock().unwrap();
            let _ = db.execute(
                "INSERT INTO logs (timestamp, sender, receiver, amount, asset, status, confidence_score, failure_category, reason, technical_reason, suggested_fix)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
                rusqlite::params![
                    timestamp,
                    payload.sender,
                    payload.receiver,
                    payload.amount,
                    payload.asset,
                    status_str,
                    result.confidence_score,
                    failure_category,
                    result.reason,
                    result.technical_reason,
                    final_fix
                ],
            );

            (StatusCode::OK, Json(result))
        }
        Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, Json(PaymentConfidenceResult {
            status: PaymentStatus::Unknown,
            confidence_score: 0,
            best_route: None,
            best_asset: None,
            reason: "RPC communication failure.".to_string(),
            technical_reason: "Internal connection error".to_string(),
            suggested_fix: "Check your local RPC daemon health.".to_string(),
            risk_factors: vec![],
        })),
    }
}

async fn handle_diagnose(
    Path(payment_id): Path<String>,
    Query(params): Query<DiagnoseParams>,
) -> (StatusCode, Json<FailureDiagnostics>) {
    let scenario = parse_scenario(&payment_id);
    let mock_client = MockFiberRpcClient::new(scenario);
    let sdk = XqlyteClient::new(mock_client);

    let req = PaymentRequest {
        sender: params.sender.unwrap_or_else(|| "alice".to_string()),
        receiver: params.receiver.unwrap_or_else(|| "bob".to_string()),
        amount: params.amount.unwrap_or(100.0),
        asset: params.asset.unwrap_or_else(|| "USDT".to_string()),
        metadata: None,
    };

    match sdk.diagnose_failure(req, None, None).await {
        Ok(diag) => (StatusCode::OK, Json(diag)),
        Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, Json(FailureDiagnostics {
            failure_category: FailureCategory::Unknown,
            human_reason: "Failed to query diagnostics".to_string(),
            technical_reason: "RPC connection error".to_string(),
            suggested_fix: "Retry request".to_string(),
            retry_strategy: "Immediate retry".to_string(),
            failing_hop: None,
            failing_asset: None,
        })),
    }
}

async fn handle_confidence_score(
    Query(params): Query<CanPayParams>,
    Json(payload): Json<PaymentRequest>,
) -> (StatusCode, Json<ScoreResponse>) {
    let scenario = get_scenario_from_params(params.scenario, params.payment_id);
    let mock_client = MockFiberRpcClient::new(scenario);
    let sdk = XqlyteClient::new(mock_client);

    match sdk.confidence_score(payload).await {
        Ok((score, risk_factors)) => (StatusCode::OK, Json(ScoreResponse { score, risk_factors })),
        Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, Json(ScoreResponse { score: 0, risk_factors: vec![] })),
    }
}

async fn handle_best_asset(
    Query(params): Query<CanPayParams>,
    Json(payload): Json<PaymentRequest>,
) -> (StatusCode, Json<BestAssetResponse>) {
    let scenario = get_scenario_from_params(params.scenario, params.payment_id);
    let mock_client = MockFiberRpcClient::new(scenario);
    let sdk = XqlyteClient::new(mock_client);

    match sdk.best_asset(payload).await {
        Ok((asset, confidence, reason)) => (StatusCode::OK, Json(BestAssetResponse { asset, confidence, reason })),
        Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, Json(BestAssetResponse {
            asset: "".to_string(),
            confidence: 0,
            reason: "RPC error".to_string(),
        })),
    }
}

async fn handle_best_route(
    Query(params): Query<CanPayParams>,
    Json(payload): Json<PaymentRequest>,
) -> (StatusCode, Json<BestRouteResponse>) {
    let scenario = get_scenario_from_params(params.scenario, params.payment_id);
    let mock_client = MockFiberRpcClient::new(scenario);
    let sdk = XqlyteClient::new(mock_client);

    match sdk.best_route(payload).await {
        Ok((route, score, reason)) => (StatusCode::OK, Json(BestRouteResponse { route, score, reason })),
        Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, Json(BestRouteResponse {
            route: RouteSummary { hops: vec![], total_fee: 0.0, total_expiry: 0 },
            score: 0,
            reason: "RPC error".to_string(),
        })),
    }
}

async fn handle_route_analysis(
    Path(to): Path<String>,
    Query(params): Query<RouteParams>,
) -> (StatusCode, Json<RouteAnalysis>) {
    let scenario = get_scenario_from_params(params.scenario, None);
    let mock_client = MockFiberRpcClient::new(scenario);
    let sdk = XqlyteClient::new(mock_client);

    let req = PaymentRequest {
        sender: params.sender.unwrap_or_else(|| "alice".to_string()),
        receiver: to,
        amount: params.amount.unwrap_or(100.0),
        asset: "USDT".to_string(),
        metadata: None,
    };

    match sdk.analyze_route(req).await {
        Ok(analysis) => (StatusCode::OK, Json(analysis)),
        Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, Json(RouteAnalysis {
            route_score: 0,
            hops: vec![],
        })),
    }
}

async fn handle_asset_analysis(
    Path(asset): Path<String>,
    Query(params): Query<AssetParams>,
) -> (StatusCode, Json<AssetAnalysis>) {
    let scenario = get_scenario_from_params(params.scenario, None);
    let mock_client = MockFiberRpcClient::new(scenario);
    let sdk = XqlyteClient::new(mock_client);

    match sdk.analyze_asset(&asset).await {
        Ok(analysis) => (StatusCode::OK, Json(analysis)),
        Err(_) => (StatusCode::INTERNAL_SERVER_ERROR, Json(AssetAnalysis {
            asset,
            is_supported: false,
            liquidity: 0.0,
            swap_provider_available: false,
            average_fee: 0.0,
        })),
    }
}

async fn handle_logs(
    State(state): State<AppState>,
    Query(params): Query<LogParams>,
) -> (StatusCode, Json<Vec<LogEntry>>) {
    let limit = params.recent.unwrap_or(20);
    let db = state.db.lock().unwrap();
    let mut stmt = match db.prepare(
        "SELECT id, timestamp, sender, receiver, amount, asset, status, confidence_score, failure_category, reason, technical_reason, suggested_fix
         FROM logs ORDER BY id DESC LIMIT ?1"
    ) {
        Ok(s) => s,
        Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(vec![])),
    };

    let log_iter = match stmt.query_map(rusqlite::params![limit], |row| {
        Ok(LogEntry {
            id: Some(row.get(0)?),
            timestamp: row.get(1)?,
            sender: row.get(2)?,
            receiver: row.get(3)?,
            amount: row.get(4)?,
            asset: row.get(5)?,
            status: row.get(6)?,
            confidence_score: row.get(7)?,
            failure_category: row.get(8)?,
            reason: row.get(9)?,
            technical_reason: row.get(10)?,
            suggested_fix: row.get(11)?,
        })
    }) {
        Ok(iter) => iter,
        Err(_) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(vec![])),
    };

    let mut logs = Vec::new();
    for log in log_iter {
        if let Ok(entry) = log {
            logs.push(entry);
        }
    }

    (StatusCode::OK, Json(logs))
}

async fn handle_topology_nodes(
    Query(params): Query<CanPayParams>,
) -> (StatusCode, Json<Vec<NodeData>>) {
    let scenario = get_scenario_from_params(params.scenario, params.payment_id);
    let mock_client = MockFiberRpcClient::new(scenario);
    
    let node_ids = vec!["alice", "bob", "nodeA", "nodeB", "nodeC", "node_offline"];
    let mut nodes = Vec::new();
    for id in node_ids {
        if let Ok(info) = mock_client.get_node_info(id).await {
            nodes.push(info);
        }
    }
    (StatusCode::OK, Json(nodes))
}

async fn handle_topology_channels(
    Query(params): Query<CanPayParams>,
) -> (StatusCode, Json<Vec<ChannelData>>) {
    let scenario = get_scenario_from_params(params.scenario, params.payment_id);
    let mock_client = MockFiberRpcClient::new(scenario);
    
    let node_ids = vec!["alice", "nodeA", "nodeB", "nodeC"];
    let mut channels = Vec::new();
    for id in node_ids {
        if let Ok(chans) = mock_client.list_channels(id).await {
            channels.extend(chans);
        }
    }
    // Deduplicate channels by channel_id
    channels.sort_by(|a, b| a.channel_id.cmp(&b.channel_id));
    channels.dedup_by(|a, b| a.channel_id == b.channel_id);
    
    (StatusCode::OK, Json(channels))
}
