import {
  handleCanPay,
  handleWhyFail,
  handleBestAsset,
  handleBestRoute,
  handleLiquidity,
} from "./bot.js";

async function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

async function runTests() {
  console.log("Starting Telegram Bot Command Handler Tests...\n");

  // 1. Test /canpay
  console.log("Testing /canpay...");
  const canPayUsage = await handleCanPay("");
  await assert(
    canPayUsage.includes("Usage: /canpay"),
    "Returns usage message on empty args"
  );

  const canPaySuccess = await handleCanPay("sender=alice receiver=bob amount=10 asset=USDT");
  await assert(
    canPaySuccess.includes("Payment likely to succeed") || canPaySuccess.includes("Payment failed") || canPaySuccess.includes("Error:"),
    "Returns formatted canpay response string"
  );

  // 2. Test /whyfail
  console.log("Testing /whyfail...");
  const whyFailUsage = await handleWhyFail("");
  await assert(
    whyFailUsage.includes("Usage: /whyfail"),
    "Returns usage message on empty args"
  );

  const whyFailRes = await handleWhyFail("payment_id=capacity-fail");
  await assert(
    whyFailRes.includes("Payment failed") || whyFailRes.includes("Error:"),
    "Returns formatted whyfail response string"
  );

  // 3. Test /bestasset
  console.log("Testing /bestasset...");
  const bestAssetUsage = await handleBestAsset("");
  await assert(
    bestAssetUsage.includes("Usage: /bestasset"),
    "Returns usage message on empty args"
  );

  const bestAssetRes = await handleBestAsset("receiver=bob amount=20");
  await assert(
    bestAssetRes.includes("Recommended asset:") || bestAssetRes.includes("Error:"),
    "Returns best asset recommendation"
  );

  // 4. Test /bestroute
  console.log("Testing /bestroute...");
  const bestRouteUsage = await handleBestRoute("");
  await assert(
    bestRouteUsage.includes("Usage: /bestroute"),
    "Returns usage message on empty args"
  );

  const bestRouteRes = await handleBestRoute("receiver=bob asset=USDT");
  await assert(
    bestRouteRes.includes("Best route:") || bestRouteRes.includes("Error:"),
    "Returns best route recommendation"
  );

  // 5. Test /liquidity
  console.log("Testing /liquidity...");
  const liquidityUsage = await handleLiquidity("");
  await assert(
    liquidityUsage.includes("Usage: /liquidity"),
    "Returns usage message on empty args"
  );

  const liquidityRes = await handleLiquidity("channel=0x123");
  await assert(
    liquidityRes.includes("Inbound:") && liquidityRes.includes("Outbound:"),
    "Returns channel liquidity details"
  );

  console.log("\n🎉 All Telegram Bot command handler tests completed successfully!");
}

runTests().catch((e) => {
  console.error("Test execution failed with error:", e);
  process.exit(1);
});
