use crate::client::{FiberRpcClient, RpcError};
use crate::types::*;
use async_trait::async_trait;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum MockScenario {
    HappyPath,
    CapacityFail,
    AssetFail,
    RouteFail,
    FeeFail,
    NodeFail,
    TimeoutFail,
    SwapFail,
    UnknownFail,
}

pub struct MockFiberRpcClient {
    pub scenario: MockScenario,
}

impl MockFiberRpcClient {
    pub fn new(scenario: MockScenario) -> Self {
        Self { scenario }
    }
}

#[async_trait]
impl FiberRpcClient for MockFiberRpcClient {
    async fn get_node_info(&self, node_id: &str) -> Result<NodeData, RpcError> {
        match self.scenario {
            MockScenario::NodeFail => {
                if node_id == "node_offline" || node_id == "bob" {
                    Ok(NodeData {
                        node_id: node_id.to_string(),
                        uptime: 0.1,
                        peer_count: 0,
                        stability_score: 10,
                        is_online: false,
                    })
                } else {
                    Ok(NodeData {
                        node_id: node_id.to_string(),
                        uptime: 0.95,
                        peer_count: 4,
                        stability_score: 90,
                        is_online: true,
                    })
                }
            }
            MockScenario::UnknownFail => Err(RpcError::NodeNotFound(node_id.to_string())),
            _ => Ok(NodeData {
                node_id: node_id.to_string(),
                uptime: 0.99,
                peer_count: 5,
                stability_score: 95,
                is_online: true,
            }),
        }
    }

    async fn list_channels(&self, _node_id: &str) -> Result<Vec<ChannelData>, RpcError> {
        match self.scenario {
            MockScenario::CapacityFail => {
                Ok(vec![ChannelData {
                    channel_id: "channel_1".to_string(),
                    capacity: 10000,
                    local_balance: 50, // Low capacity for the transfer
                    remote_balance: 9950,
                    asset: "USDT".to_string(),
                    health: "Healthy".to_string(),
                    age: 100,
                }])
            }
            MockScenario::NodeFail => Ok(vec![ChannelData {
                channel_id: "channel_1".to_string(),
                capacity: 10000,
                local_balance: 5000,
                remote_balance: 5000,
                asset: "USDT".to_string(),
                health: "Offline".to_string(),
                age: 100,
            }]),
            MockScenario::UnknownFail => {
                Ok(vec![]) // Empty channels list -> unknown fail
            }
            _ => Ok(vec![ChannelData {
                channel_id: "channel_1".to_string(),
                capacity: 10000,
                local_balance: 6000,
                remote_balance: 4000,
                asset: "USDT".to_string(),
                health: "Healthy".to_string(),
                age: 100,
            }]),
        }
    }

    async fn build_route(
        &self,
        _sender: &str,
        receiver: &str,
        _amount: f64,
        _asset: &str,
    ) -> Result<RouteData, RpcError> {
        match self.scenario {
            MockScenario::RouteFail => Err(RpcError::RouteBuildingFailed(
                "No viable path found".to_string(),
            )),
            MockScenario::TimeoutFail => {
                Ok(RouteData {
                    hops: vec![
                        HopData {
                            channel_id: "channel_1".to_string(),
                            node_id: "nodeA".to_string(),
                            expiry: 500000, // Excessive expiry delta
                            fee: 10,
                        },
                        HopData {
                            channel_id: "channel_2".to_string(),
                            node_id: receiver.to_string(),
                            expiry: 500000,
                            fee: 10,
                        },
                    ],
                    total_fee: 20,
                    total_expiry: 1000000,
                    stability_score: 95,
                })
            }
            MockScenario::FeeFail => {
                Ok(RouteData {
                    hops: vec![
                        HopData {
                            channel_id: "channel_1".to_string(),
                            node_id: "nodeA".to_string(),
                            expiry: 144,
                            fee: 1500, // Very high fee
                        },
                        HopData {
                            channel_id: "channel_2".to_string(),
                            node_id: receiver.to_string(),
                            expiry: 144,
                            fee: 1500,
                        },
                    ],
                    total_fee: 3000, // Exceeds budget
                    total_expiry: 288,
                    stability_score: 95,
                })
            }
            _ => {
                // Happy path or generic success shape
                Ok(RouteData {
                    hops: vec![
                        HopData {
                            channel_id: "channel_1".to_string(),
                            node_id: "nodeA".to_string(),
                            expiry: 144,
                            fee: 5,
                        },
                        HopData {
                            channel_id: "channel_2".to_string(),
                            node_id: receiver.to_string(),
                            expiry: 144,
                            fee: 5,
                        },
                    ],
                    total_fee: 10,
                    total_expiry: 288,
                    stability_score: 95,
                })
            }
        }
    }

    async fn get_asset_info(&self, asset_id: &str) -> Result<AssetData, RpcError> {
        match self.scenario {
            MockScenario::AssetFail => Ok(AssetData {
                asset_id: asset_id.to_string(),
                liquidity: 0,
                network: "CKB_testnet".to_string(),
                is_supported: false,
            }),
            _ => Ok(AssetData {
                asset_id: asset_id.to_string(),
                liquidity: 1000000,
                network: "CKB_testnet".to_string(),
                is_supported: true,
            }),
        }
    }

    async fn get_fee_info(&self, _channel_id: &str) -> Result<FeeData, RpcError> {
        match self.scenario {
            MockScenario::FeeFail => Ok(FeeData {
                base_fee: 1000,
                proportional_fee: 500000,
                fee_schedule: "Aggressive".to_string(),
            }),
            _ => Ok(FeeData {
                base_fee: 10,
                proportional_fee: 100,
                fee_schedule: "Standard".to_string(),
            }),
        }
    }

    async fn get_swap_info(&self, _asset_in: &str, _asset_out: &str) -> Result<SwapData, RpcError> {
        match self.scenario {
            MockScenario::SwapFail => Ok(SwapData {
                provider: "MockSwapProvider".to_string(),
                liquidity: 10,
                fee: 500,
                is_compatible: false,
            }),
            _ => Ok(SwapData {
                provider: "MockSwapProvider".to_string(),
                liquidity: 50000,
                fee: 5,
                is_compatible: true,
            }),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_happy_path_loads() {
        let client = MockFiberRpcClient::new(MockScenario::HappyPath);
        let node = client.get_node_info("alice").await.unwrap();
        assert_eq!(node.is_online, true);
        assert_eq!(node.stability_score, 95);

        let channels = client.list_channels("alice").await.unwrap();
        assert_eq!(channels.len(), 1);
        assert_eq!(channels[0].health, "Healthy");

        let route = client
            .build_route("alice", "bob", 10.0, "USDT")
            .await
            .unwrap();
        assert_eq!(route.hops.len(), 2);
        assert_eq!(route.total_fee, 10);
    }

    #[tokio::test]
    async fn test_capacity_fail_loads() {
        let client = MockFiberRpcClient::new(MockScenario::CapacityFail);
        let channels = client.list_channels("alice").await.unwrap();
        assert_eq!(channels[0].local_balance, 50);
    }

    #[tokio::test]
    async fn test_asset_fail_loads() {
        let client = MockFiberRpcClient::new(MockScenario::AssetFail);
        let asset = client.get_asset_info("USDT").await.unwrap();
        assert_eq!(asset.is_supported, false);
    }

    #[tokio::test]
    async fn test_route_fail_loads() {
        let client = MockFiberRpcClient::new(MockScenario::RouteFail);
        let route_result = client.build_route("alice", "bob", 10.0, "USDT").await;
        assert!(matches!(
            route_result,
            Err(RpcError::RouteBuildingFailed(_))
        ));
    }
}
