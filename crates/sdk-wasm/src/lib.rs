use engine::types::*;
use rpc::mock::{MockFiberRpcClient, MockScenario};
use sdk_rust::XqlyteClient;
use serde_wasm_bindgen::{from_value, to_value};
use wasm_bindgen::prelude::*;

fn parse_scenario(s: &str) -> MockScenario {
    match s.to_lowercase().replace("-", "").replace("_", "").as_str() {
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

#[wasm_bindgen]
pub async fn can_pay(request: JsValue, scenario: String) -> Result<JsValue, JsValue> {
    let req: PaymentRequest = from_value(request).map_err(|e| JsValue::from_str(&e.to_string()))?;
    let sc = parse_scenario(&scenario);
    let client = MockFiberRpcClient::new(sc);
    let sdk = XqlyteClient::new(client);

    let res = sdk.can_pay(req).await.map_err(|e| JsValue::from_str(&format!("{:?}", e)))?;
    to_value(&res).map_err(|e| JsValue::from_str(&e.to_string()))
}

#[wasm_bindgen]
pub async fn diagnose_failure(request: JsValue, payment_id: String) -> Result<JsValue, JsValue> {
    let req: PaymentRequest = from_value(request).map_err(|e| JsValue::from_str(&e.to_string()))?;
    let sc = parse_scenario(&payment_id);
    let client = MockFiberRpcClient::new(sc);
    let sdk = XqlyteClient::new(client);

    let res = sdk
        .diagnose_failure(req, None, None)
        .await
        .map_err(|e| JsValue::from_str(&format!("{:?}", e)))?;
    to_value(&res).map_err(|e| JsValue::from_str(&e.to_string()))
}

#[wasm_bindgen]
pub async fn confidence_score(request: JsValue, scenario: String) -> Result<JsValue, JsValue> {
    let req: PaymentRequest = from_value(request).map_err(|e| JsValue::from_str(&e.to_string()))?;
    let sc = parse_scenario(&scenario);
    let client = MockFiberRpcClient::new(sc);
    let sdk = XqlyteClient::new(client);

    let res = sdk.confidence_score(req).await.map_err(|e| JsValue::from_str(&format!("{:?}", e)))?;
    to_value(&res).map_err(|e| JsValue::from_str(&e.to_string()))
}

#[wasm_bindgen]
pub async fn best_asset(request: JsValue, scenario: String) -> Result<JsValue, JsValue> {
    let req: PaymentRequest = from_value(request).map_err(|e| JsValue::from_str(&e.to_string()))?;
    let sc = parse_scenario(&scenario);
    let client = MockFiberRpcClient::new(sc);
    let sdk = XqlyteClient::new(client);

    let res = sdk.best_asset(req).await.map_err(|e| JsValue::from_str(&format!("{:?}", e)))?;
    to_value(&res).map_err(|e| JsValue::from_str(&e.to_string()))
}

#[wasm_bindgen]
pub async fn best_route(request: JsValue, scenario: String) -> Result<JsValue, JsValue> {
    let req: PaymentRequest = from_value(request).map_err(|e| JsValue::from_str(&e.to_string()))?;
    let sc = parse_scenario(&scenario);
    let client = MockFiberRpcClient::new(sc);
    let sdk = XqlyteClient::new(client);

    let res = sdk.best_route(req).await.map_err(|e| JsValue::from_str(&format!("{:?}", e)))?;
    to_value(&res).map_err(|e| JsValue::from_str(&e.to_string()))
}

#[wasm_bindgen]
pub async fn analyze_route(request: JsValue, scenario: String) -> Result<JsValue, JsValue> {
    let req: PaymentRequest = from_value(request).map_err(|e| JsValue::from_str(&e.to_string()))?;
    let sc = parse_scenario(&scenario);
    let client = MockFiberRpcClient::new(sc);
    let sdk = XqlyteClient::new(client);

    let res = sdk.analyze_route(req).await.map_err(|e| JsValue::from_str(&format!("{:?}", e)))?;
    to_value(&res).map_err(|e| JsValue::from_str(&e.to_string()))
}

#[wasm_bindgen]
pub async fn analyze_asset(asset: String, scenario: String) -> Result<JsValue, JsValue> {
    let sc = parse_scenario(&scenario);
    let client = MockFiberRpcClient::new(sc);
    let sdk = XqlyteClient::new(client);

    let res = sdk.analyze_asset(&asset).await.map_err(|e| JsValue::from_str(&format!("{:?}", e)))?;
    to_value(&res).map_err(|e| JsValue::from_str(&e.to_string()))
}
