use crate::types::{NodeData, RouteData};

/// Scores the route path between 0 and 30.
/// - Fewer hops = higher score.
/// - Stable nodes along the path = higher score.
pub fn analyze_route(route: &RouteData, hop_nodes: &[NodeData]) -> u8 {
    if route.hops.is_empty() {
        return 0;
    }

    let mut score: u8 = 30;

    // Hop count penalty: deduct 5 points per hop over 1 hop.
    if route.hops.len() > 1 {
        let penalty = (route.hops.len() - 1) * 5;
        score = score.saturating_sub(penalty as u8);
    }

    // Node stability penalty: deduct 5 points for any node with stability < 80.
    for node in hop_nodes {
        if node.stability_score < 80 {
            score = score.saturating_sub(5);
        }
    }

    // Minimum route score is 10 if there is a route, capped at 30.
    score.clamp(10, 30)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::HopData;

    #[test]
    fn test_happy_path_route_score() {
        let route = RouteData {
            hops: vec![
                HopData {
                    channel_id: "1".into(),
                    node_id: "nodeA".into(),
                    expiry: 144,
                    fee: 5,
                },
                HopData {
                    channel_id: "2".into(),
                    node_id: "nodeB".into(),
                    expiry: 144,
                    fee: 5,
                },
            ],
            total_fee: 10,
            total_expiry: 288,
            stability_score: 95,
        };
        let nodes = vec![
            NodeData {
                node_id: "nodeA".into(),
                uptime: 0.99,
                peer_count: 5,
                stability_score: 95,
                is_online: true,
            },
            NodeData {
                node_id: "nodeB".into(),
                uptime: 0.99,
                peer_count: 5,
                stability_score: 95,
                is_online: true,
            },
        ];
        assert_eq!(analyze_route(&route, &nodes), 25);
    }

    #[test]
    fn test_unstable_nodes_route_score() {
        let route = RouteData {
            hops: vec![
                HopData {
                    channel_id: "1".into(),
                    node_id: "nodeA".into(),
                    expiry: 144,
                    fee: 5,
                },
                HopData {
                    channel_id: "2".into(),
                    node_id: "nodeB".into(),
                    expiry: 144,
                    fee: 5,
                },
            ],
            total_fee: 10,
            total_expiry: 288,
            stability_score: 95,
        };
        let nodes = vec![
            NodeData {
                node_id: "nodeA".into(),
                uptime: 0.99,
                peer_count: 5,
                stability_score: 95,
                is_online: true,
            },
            NodeData {
                node_id: "nodeB".into(),
                uptime: 0.70,
                peer_count: 5,
                stability_score: 60,
                is_online: true,
            },
        ];
        // 30 - 5 (hops penalty) - 5 (stability penalty) = 20
        assert_eq!(analyze_route(&route, &nodes), 20);
    }
}
