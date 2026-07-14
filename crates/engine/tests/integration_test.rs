use engine::{can_pay, types::*};

#[test]
fn test_can_pay_integration_happy_path() {
    let req = PaymentRequest {
        sender: "alice".to_string(),
        receiver: "bob".to_string(),
        amount: 1000.0,
        asset: "USDT".to_string(),
        metadata: None,
    };

    let route = RouteData {
        hops: vec![
            HopData {
                channel_id: "c1".into(),
                node_id: "nodeA".into(),
                expiry: 144,
                fee: 5,
            },
            HopData {
                channel_id: "c2".into(),
                node_id: "bob".into(),
                expiry: 144,
                fee: 5,
            },
        ],
        total_fee: 10,
        total_expiry: 288,
        stability_score: 95,
    };

    let hop_nodes = vec![
        NodeData {
            node_id: "nodeA".into(),
            uptime: 0.99,
            peer_count: 5,
            stability_score: 95,
            is_online: true,
        },
        NodeData {
            node_id: "bob".into(),
            uptime: 0.99,
            peer_count: 5,
            stability_score: 95,
            is_online: true,
        },
    ];

    let channels = vec![
        ChannelData {
            channel_id: "c1".to_string(),
            capacity: 10000,
            local_balance: 5000,
            remote_balance: 5000,
            asset: "USDT".to_string(),
            health: "Healthy".to_string(),
            age: 100,
        },
        ChannelData {
            channel_id: "c2".to_string(),
            capacity: 10000,
            local_balance: 5000,
            remote_balance: 5000,
            asset: "USDT".to_string(),
            health: "Healthy".to_string(),
            age: 100,
        },
    ];

    let result = can_pay(&req, Some(&route), &hop_nodes, &channels, true, None, false);

    assert_eq!(result.status, PaymentStatus::CanPay);
    assert_eq!(result.confidence_score, 92); // 25 route + 20 asset + 30 liquidity + 8 fee + 9 node = 92
    assert_eq!(result.risk_factors.len(), 3); // route, fee, node health are less than max budgets
}
