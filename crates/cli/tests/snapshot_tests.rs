use std::process::Command;

fn get_cli_bin() -> std::path::PathBuf {
    let mut path = std::env::current_exe().unwrap();
    path.pop(); // pop filename
    if path.ends_with("deps") {
        path.pop(); // pop deps
    }
    path.push("cli");
    path
}

#[test]
fn test_cli_can_pay_human() {
    let bin = get_cli_bin();
    let output = Command::new(&bin)
        .args(&["can-pay", "-f", "alice", "-t", "bob", "-n", "100.0", "-a", "USDT"])
        .output()
        .expect("failed to execute cli");

    assert!(output.status.success());
    let stdout = String::from_utf8(output.stdout).unwrap();
    assert!(stdout.contains("Status: CanPay"));
    assert!(stdout.contains("Confidence:"));
    assert!(stdout.contains("Best Route: nodeA -> bob"));
}

#[test]
fn test_cli_can_pay_json() {
    let bin = get_cli_bin();
    let output = Command::new(&bin)
        .args(&["can-pay", "-f", "alice", "-t", "bob", "-n", "100.0", "-a", "USDT", "--json"])
        .output()
        .expect("failed to execute cli");

    assert!(output.status.success());
    let stdout = String::from_utf8(output.stdout).unwrap();
    let val: serde_json::Value = serde_json::from_str(&stdout).unwrap();
    assert_eq!(val["status"], "CanPay");
    assert_eq!(val["best_asset"], "USDT");
}

#[test]
fn test_cli_diagnose_human() {
    let bin = get_cli_bin();
    let output = Command::new(&bin)
        .args(&["diagnose", "-p", "capacity-fail"])
        .output()
        .expect("failed to execute cli");

    assert!(output.status.success());
    let stdout = String::from_utf8(output.stdout).unwrap();
    assert!(stdout.contains("Failure Category: Capacity"));
    assert!(stdout.contains("Suggested Fix: add liquidity"));
}

#[test]
fn test_cli_diagnose_json() {
    let bin = get_cli_bin();
    let output = Command::new(&bin)
        .args(&["diagnose", "-p", "capacity-fail", "--json"])
        .output()
        .expect("failed to execute cli");

    assert!(output.status.success());
    let stdout = String::from_utf8(output.stdout).unwrap();
    let val: serde_json::Value = serde_json::from_str(&stdout).unwrap();
    assert_eq!(val["failure_category"], "Capacity");
}
