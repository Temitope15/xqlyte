use engine::types::*;
use rpc::client::{FiberRpcClient, RpcError};

pub struct XqlyteClient<C: FiberRpcClient> {
    rpc_client: C,
}

impl<C: FiberRpcClient> XqlyteClient<C> {
    pub fn new(rpc_client: C) -> Self {
        Self { rpc_client }
    }

    pub fn rpc_client(&self) -> &C {
        &self.rpc_client
    }

    pub async fn can_pay(
        &self,
        request: PaymentRequest,
    ) -> Result<PaymentConfidenceResult, RpcError> {
        let route = self
            .rpc_client
            .build_route(
                &request.sender,
                &request.receiver,
                request.amount,
                &request.asset,
            )
            .await
            .ok();

        let mut hop_nodes = Vec::new();
        let mut channels = Vec::new();

        if let Some(ref r) = route {
            for hop in &r.hops {
                if let Ok(node) = self.rpc_client.get_node_info(&hop.node_id).await {
                    hop_nodes.push(node);
                }
                if let Ok(chans) = self.rpc_client.list_channels(&hop.node_id).await {
                    channels.extend(chans);
                }
            }
        }

        let asset_info = self.rpc_client.get_asset_info(&request.asset).await;
        let asset_supported = match asset_info {
            Ok(a) => a.is_supported,
            Err(_) => false,
        };

        let swap_data = self
            .rpc_client
            .get_swap_info(&request.asset, "CKB")
            .await
            .ok();

        let is_missing_data = route.is_none();

        let result = engine::can_pay(
            &request,
            route.as_ref(),
            &hop_nodes,
            &channels,
            asset_supported,
            swap_data.as_ref(),
            is_missing_data,
        );

        Ok(result)
    }

    pub async fn diagnose_failure(
        &self,
        request: PaymentRequest,
        failing_hop: Option<HopRef>,
        failing_asset: Option<String>,
    ) -> Result<FailureDiagnostics, RpcError> {
        let route = self
            .rpc_client
            .build_route(
                &request.sender,
                &request.receiver,
                request.amount,
                &request.asset,
            )
            .await
            .ok();

        let mut hop_nodes = Vec::new();
        let mut channels = Vec::new();

        if let Some(ref r) = route {
            for hop in &r.hops {
                if let Ok(node) = self.rpc_client.get_node_info(&hop.node_id).await {
                    hop_nodes.push(node);
                }
                if let Ok(chans) = self.rpc_client.list_channels(&hop.node_id).await {
                    channels.extend(chans);
                }
            }
        }

        let asset_info = self.rpc_client.get_asset_info(&request.asset).await;
        let asset_supported = match asset_info {
            Ok(a) => a.is_supported,
            Err(_) => false,
        };

        let swap_data = self
            .rpc_client
            .get_swap_info(&request.asset, "CKB")
            .await
            .ok();

        let result = engine::diagnose_failure(
            &request,
            route.as_ref(),
            &hop_nodes,
            &channels,
            asset_supported,
            swap_data.as_ref(),
            failing_hop,
            failing_asset,
        );

        Ok(result)
    }

    pub async fn confidence_score(
        &self,
        request: PaymentRequest,
    ) -> Result<(u8, Vec<RiskFactor>), RpcError> {
        let res = self.can_pay(request).await?;
        Ok((res.confidence_score, res.risk_factors))
    }

    pub async fn best_asset(
        &self,
        request: PaymentRequest,
    ) -> Result<(String, u8, String), RpcError> {
        let asset_info = self.rpc_client.get_asset_info(&request.asset).await;
        let asset_supported = match asset_info {
            Ok(a) => a.is_supported,
            Err(_) => false,
        };

        let swap_data = self
            .rpc_client
            .get_swap_info(&request.asset, "CKB")
            .await
            .ok();

        let result = engine::best_asset(&request, asset_supported, swap_data.as_ref());
        Ok(result)
    }

    pub async fn best_route(
        &self,
        request: PaymentRequest,
    ) -> Result<(RouteSummary, u8, String), RpcError> {
        let route = self
            .rpc_client
            .build_route(
                &request.sender,
                &request.receiver,
                request.amount,
                &request.asset,
            )
            .await
            .ok();

        let mut routes = Vec::new();
        let mut nodes_per_route = Vec::new();

        if let Some(r) = route {
            let mut hop_nodes = Vec::new();
            for hop in &r.hops {
                if let Ok(node) = self.rpc_client.get_node_info(&hop.node_id).await {
                    hop_nodes.push(node);
                }
            }
            routes.push(r);
            nodes_per_route.push(hop_nodes);
        }

        let result = engine::best_route(&routes, &nodes_per_route);
        Ok(result)
    }

    pub async fn analyze_route(&self, request: PaymentRequest) -> Result<RouteAnalysis, RpcError> {
        let route = self
            .rpc_client
            .build_route(
                &request.sender,
                &request.receiver,
                request.amount,
                &request.asset,
            )
            .await?;

        let mut hop_nodes = Vec::new();
        let mut channels = Vec::new();

        for hop in &route.hops {
            if let Ok(node) = self.rpc_client.get_node_info(&hop.node_id).await {
                hop_nodes.push(node);
            }
            if let Ok(chans) = self.rpc_client.list_channels(&hop.node_id).await {
                channels.extend(chans);
            }
        }

        let result = engine::analyze_route_hops(&route, &hop_nodes, &channels);
        Ok(result)
    }

    pub async fn analyze_asset(&self, asset: &str) -> Result<AssetAnalysis, RpcError> {
        let asset_info = self.rpc_client.get_asset_info(asset).await;
        let asset_supported = match asset_info {
            Ok(a) => a.is_supported,
            Err(_) => false,
        };

        let swap_data = self.rpc_client.get_swap_info(asset, "CKB").await.ok();

        let result =
            engine::analyze_asset_compatibility(asset, asset_supported, swap_data.as_ref());
        Ok(result)
    }

    pub fn log_result(&self, result: &PaymentConfidenceResult) -> String {
        engine::format_log_result(result)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use rpc::mock::{MockFiberRpcClient, MockScenario};

    #[tokio::test]
    async fn test_sdk_happy_path() {
        let mock_client = MockFiberRpcClient::new(MockScenario::HappyPath);
        let sdk = XqlyteClient::new(mock_client);

        let req = PaymentRequest {
            sender: "alice".to_string(),
            receiver: "bob".to_string(),
            amount: 100.0,
            asset: "USDT".to_string(),
            metadata: None,
        };

        let res = sdk.can_pay(req).await.unwrap();
        assert_eq!(res.status, PaymentStatus::CanPay);
        assert!(res.confidence_score > 80);
    }
}
