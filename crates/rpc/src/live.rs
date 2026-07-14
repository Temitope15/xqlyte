use crate::client::{FiberRpcClient, RpcError};
use crate::types::*;
use async_trait::async_trait;

pub struct LiveFiberRpcClient {
    pub rpc_url: String,
}

impl LiveFiberRpcClient {
    pub fn new(rpc_url: &str) -> Self {
        Self {
            rpc_url: rpc_url.to_string(),
        }
    }
}

#[async_trait]
impl FiberRpcClient for LiveFiberRpcClient {
    async fn get_node_info(&self, _node_id: &str) -> Result<NodeData, RpcError> {
        Err(RpcError::TransportError(
            "Live RPC not fully implemented yet".to_string(),
        ))
    }
    async fn list_channels(&self, _node_id: &str) -> Result<Vec<ChannelData>, RpcError> {
        Err(RpcError::TransportError(
            "Live RPC not fully implemented yet".to_string(),
        ))
    }
    async fn build_route(
        &self,
        _sender: &str,
        _receiver: &str,
        _amount: f64,
        _asset: &str,
    ) -> Result<RouteData, RpcError> {
        Err(RpcError::TransportError(
            "Live RPC not fully implemented yet".to_string(),
        ))
    }
    async fn get_asset_info(&self, _asset_id: &str) -> Result<AssetData, RpcError> {
        Err(RpcError::TransportError(
            "Live RPC not fully implemented yet".to_string(),
        ))
    }
    async fn get_fee_info(&self, _channel_id: &str) -> Result<FeeData, RpcError> {
        Err(RpcError::TransportError(
            "Live RPC not fully implemented yet".to_string(),
        ))
    }
    async fn get_swap_info(&self, _asset_in: &str, _asset_out: &str) -> Result<SwapData, RpcError> {
        Err(RpcError::TransportError(
            "Live RPC not fully implemented yet".to_string(),
        ))
    }
}
