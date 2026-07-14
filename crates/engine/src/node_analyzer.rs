use crate::types::NodeData;

/// Scores node health between 0 and 10.
/// - Stable = high
/// - Unstable = medium
/// - Offline = 0
pub fn analyze_node_health(nodes: &[NodeData]) -> u8 {
    if nodes.is_empty() {
        return 0;
    }

    let mut total_stability = 0.0;
    for node in nodes {
        if !node.is_online {
            return 0;
        }
        total_stability += node.stability_score as f64;
    }

    let avg = total_stability / nodes.len() as f64;
    // For avg = 95.0, 95 / 10 = 9.5, floor is 9.
    (avg / 10.0).floor().min(10.0) as u8
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_happy_path_node_health() {
        let nodes = vec![
            NodeData {
                node_id: "nodeA".to_string(),
                uptime: 0.99,
                peer_count: 5,
                stability_score: 95,
                is_online: true,
            },
            NodeData {
                node_id: "nodeB".to_string(),
                uptime: 0.99,
                peer_count: 5,
                stability_score: 95,
                is_online: true,
            },
        ];
        assert_eq!(analyze_node_health(&nodes), 9);
    }

    #[test]
    fn test_offline_node() {
        let nodes = vec![
            NodeData {
                node_id: "nodeA".to_string(),
                uptime: 0.99,
                peer_count: 5,
                stability_score: 95,
                is_online: true,
            },
            NodeData {
                node_id: "nodeB".to_string(),
                uptime: 0.1,
                peer_count: 1,
                stability_score: 20,
                is_online: false,
            },
        ];
        assert_eq!(analyze_node_health(&nodes), 0);
    }

    #[test]
    fn test_empty_nodes() {
        assert_eq!(analyze_node_health(&[]), 0);
    }
}
