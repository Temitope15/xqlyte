import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  init,
  canPay,
  diagnoseFailure,
  confidenceScore,
  bestAsset,
  bestRoute,
  analyzeRoute,
  analyzeAsset,
} from "./index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  try {
    console.log("Starting JS SDK/WASM tests...");

    // Read wasm file buffer to run in Node.js environment
    const wasmPath = path.resolve(__dirname, "../../crates/sdk-wasm/pkg/sdk_wasm_bg.wasm");
    const wasmBuffer = fs.readFileSync(wasmPath);
    await init(wasmBuffer);

    const req = {
      sender: "alice",
      receiver: "bob",
      amount: 100.0,
      asset: "USDT",
      metadata: null,
    };

    const resCanPay = await canPay(req, "happy-path");
    console.log("canPay result:", resCanPay);
    if (resCanPay.status !== "CanPay") throw new Error("canPay failed");

    const resDiag = await diagnoseFailure(req, "capacity-fail");
    console.log("diagnoseFailure result:", resDiag);
    if (resDiag.failure_category !== "Capacity") throw new Error("diagnoseFailure failed");

    const resConf = await confidenceScore(req, "happy-path");
    console.log("confidenceScore result:", resConf);

    const resAsset = await bestAsset(req, "happy-path");
    console.log("bestAsset result:", resAsset);

    const resRoute = await bestRoute(req, "happy-path");
    console.log("bestRoute result:", resRoute);

    const resRouteAnalysis = await analyzeRoute(req, "happy-path");
    console.log("analyzeRoute result:", resRouteAnalysis);

    const resAssetAnalysis = await analyzeAsset("USDT", "happy-path");
    console.log("analyzeAsset result:", resAssetAnalysis);

    console.log("✓ All JS SDK tests passed!");
  } catch (err) {
    console.error("Test failed:", err);
    process.exit(1);
  }
}

run();
