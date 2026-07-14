use crate::types::*;
use async_trait::async_trait;
use thiserror::Error;

#[derive(Debug, Error, Clone, serde::Serialize, serde::Deserialize, PartialEq, Eq)]
pub enum RpcError {
    #[error("Node not found: {0}")]
    NodeNotFound(String),
    #[error("Route building failed: {0}")]
    RouteBuildingFailed(String),
    #[error("Channel error: {0}")]
    ChannelError(String),
    #[error("RPC transport error: {0}")]
    TransportError(String),
    #[error("Asset error: {0}")]
    AssetError(String),
}

#[async_trait]
pub trait FiberRpcClient: Send + Sync {
    async fn get_node_info(&self, node_id: &str) -> Result<NodeData, RpcError>;
    async fn list_channels(&self, node_id: &str) -> Result<Vec<ChannelData>, RpcError>;
    async fn build_route(
        &self,
        sender: &str,
        receiver: &str,
        amount: f64,
        asset: &str,
    ) -> Result<RouteData, RpcError>;
    async fn get_asset_info(&self, asset_id: &str) -> Result<AssetData, RpcError>;
    async fn get_fee_info(&self, channel_id: &str) -> Result<FeeData, RpcError>;
    async fn get_swap_info(&self, asset_in: &str, asset_out: &str) -> Result<SwapData, RpcError>;
}
