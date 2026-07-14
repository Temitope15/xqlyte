import * as wasm from "sdk-wasm";

let initialized = false;

export async function init(wasmInput) {
  if (!initialized) {
    await wasm.default(wasmInput);
    initialized = true;
  }
}

export async function canPay(request, scenario = "happy-path") {
  await init();
  return await wasm.can_pay(request, scenario);
}

export async function diagnoseFailure(request, paymentId) {
  await init();
  return await wasm.diagnose_failure(request, paymentId);
}

export async function confidenceScore(request, scenario = "happy-path") {
  await init();
  return await wasm.confidence_score(request, scenario);
}

export async function bestAsset(request, scenario = "happy-path") {
  await init();
  return await wasm.best_asset(request, scenario);
}

export async function bestRoute(request, scenario = "happy-path") {
  await init();
  return await wasm.best_route(request, scenario);
}

export async function analyzeRoute(request, scenario = "happy-path") {
  await init();
  return await wasm.analyze_route(request, scenario);
}

export async function analyzeAsset(asset, scenario = "happy-path") {
  await init();
  return await wasm.analyze_asset(asset, scenario);
}
