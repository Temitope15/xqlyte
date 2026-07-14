/// Scores the fee-to-amount ratio between 0 and 10.
/// - Ratio <= 0.1% = 10
/// - Ratio <= 1% = 8
/// - Ratio <= 5% = 5
/// - Ratio <= 10% = 2
/// - Ratio > 10% = 0
pub fn analyze_fee(amount: f64, total_fee: f64) -> u8 {
    if amount <= 0.0 {
        return 0;
    }

    let ratio = total_fee / amount;
    if ratio <= 0.001 {
        10
    } else if ratio <= 0.01 {
        8
    } else if ratio <= 0.05 {
        5
    } else if ratio <= 0.10 {
        2
    } else {
        0
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_low_fee() {
        assert_eq!(analyze_fee(1000.0, 0.5), 10);
    }

    #[test]
    fn test_medium_fee() {
        assert_eq!(analyze_fee(1000.0, 5.0), 8);
    }

    #[test]
    fn test_high_fee() {
        assert_eq!(analyze_fee(1000.0, 30.0), 5);
    }

    #[test]
    fn test_excessive_fee() {
        assert_eq!(analyze_fee(1000.0, 150.0), 0);
    }
}
