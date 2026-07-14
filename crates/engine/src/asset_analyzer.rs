use crate::types::SwapData;

/// Scores the asset compatibility between 0 and 20.
/// - Native compatible = 20
/// - Swap required + compatible swap = 12
/// - Unsupported / Swap incompatible = 0
pub fn analyze_asset(asset_supported: bool, swap_data: Option<&SwapData>) -> u8 {
    if asset_supported {
        20
    } else if let Some(swap) = swap_data {
        if swap.is_compatible && swap.liquidity > 0 {
            12
        } else {
            0
        }
    } else {
        0
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_native_supported() {
        assert_eq!(analyze_asset(true, None), 20);
    }

    #[test]
    fn test_swap_compatible() {
        let swap = SwapData {
            provider: "MockSwap".to_string(),
            liquidity: 1000,
            fee: 5,
            is_compatible: true,
        };
        assert_eq!(analyze_asset(false, Some(&swap)), 12);
    }

    #[test]
    fn test_swap_incompatible() {
        let swap = SwapData {
            provider: "MockSwap".to_string(),
            liquidity: 1000,
            fee: 5,
            is_compatible: false,
        };
        assert_eq!(analyze_asset(false, Some(&swap)), 0);
    }

    #[test]
    fn test_unsupported_no_swap() {
        assert_eq!(analyze_asset(false, None), 0);
    }
}
