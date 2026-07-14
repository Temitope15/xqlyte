use crate::types::PaymentRequest;
use thiserror::Error;

#[derive(Debug, Error, Clone, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
pub enum ValidationError {
    #[error("Sender address cannot be empty")]
    EmptySender,
    #[error("Receiver address cannot be empty")]
    EmptyReceiver,
    #[error("Amount must be greater than zero, got {0}")]
    InvalidAmount(String),
    #[error("Asset code cannot be empty")]
    EmptyAsset,
}

pub fn validate_request(req: &PaymentRequest) -> Result<PaymentRequest, ValidationError> {
    let sender = req.sender.trim();
    if sender.is_empty() {
        return Err(ValidationError::EmptySender);
    }

    let receiver = req.receiver.trim();
    if receiver.is_empty() {
        return Err(ValidationError::EmptyReceiver);
    }

    if req.amount <= 0.0 {
        return Err(ValidationError::InvalidAmount(req.amount.to_string()));
    }

    let asset = req.asset.trim();
    if asset.is_empty() {
        return Err(ValidationError::EmptyAsset);
    }

    Ok(PaymentRequest {
        sender: sender.to_string(),
        receiver: receiver.to_string(),
        amount: req.amount,
        asset: asset.to_uppercase(),
        metadata: req.metadata.clone(),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_valid_request() {
        let req = PaymentRequest {
            sender: "  alice_peer_id  ".to_string(),
            receiver: "  bob_peer_id  ".to_string(),
            amount: 100.0,
            asset: "  usdt  ".to_string(),
            metadata: None,
        };

        let result = validate_request(&req);
        assert!(result.is_ok());
        let validated = result.unwrap();
        assert_eq!(validated.sender, "alice_peer_id");
        assert_eq!(validated.receiver, "bob_peer_id");
        assert_eq!(validated.amount, 100.0);
        assert_eq!(validated.asset, "USDT");
    }

    #[test]
    fn test_invalid_sender() {
        let req = PaymentRequest {
            sender: "   ".to_string(),
            receiver: "bob".to_string(),
            amount: 10.0,
            asset: "USDT".to_string(),
            metadata: None,
        };
        let result = validate_request(&req);
        assert_eq!(result, Err(ValidationError::EmptySender));
    }

    #[test]
    fn test_invalid_receiver() {
        let req = PaymentRequest {
            sender: "alice".to_string(),
            receiver: "".to_string(),
            amount: 10.0,
            asset: "USDT".to_string(),
            metadata: None,
        };
        let result = validate_request(&req);
        assert_eq!(result, Err(ValidationError::EmptyReceiver));
    }

    #[test]
    fn test_invalid_amount() {
        let req = PaymentRequest {
            sender: "alice".to_string(),
            receiver: "bob".to_string(),
            amount: 0.0,
            asset: "USDT".to_string(),
            metadata: None,
        };
        let result = validate_request(&req);
        assert!(matches!(result, Err(ValidationError::InvalidAmount(_))));

        let req_neg = PaymentRequest {
            sender: "alice".to_string(),
            receiver: "bob".to_string(),
            amount: -5.0,
            asset: "USDT".to_string(),
            metadata: None,
        };
        let result_neg = validate_request(&req_neg);
        assert!(matches!(result_neg, Err(ValidationError::InvalidAmount(_))));
    }

    #[test]
    fn test_invalid_asset() {
        let req = PaymentRequest {
            sender: "alice".to_string(),
            receiver: "bob".to_string(),
            amount: 10.0,
            asset: "  ".to_string(),
            metadata: None,
        };
        let result = validate_request(&req);
        assert_eq!(result, Err(ValidationError::EmptyAsset));
    }
}
