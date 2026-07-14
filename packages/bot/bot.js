import fetch from "node-fetch";

const API_SERVER = process.env.API_SERVER_URL || "http://localhost:3000";

// Helper to parse key=value style arguments
export function parseArgs(text) {
  const args = {};
  if (!text) return args;
  const parts = text.trim().split(/\s+/);
  for (const part of parts) {
    const eqIdx = part.indexOf("=");
    if (eqIdx !== -1) {
      const key = part.slice(0, eqIdx).trim().toLowerCase();
      const val = part.slice(eqIdx + 1).trim();
      args[key] = val;
    }
  }
  return args;
}

// Handler functions for slash commands
export async function handleCanPay(argsText) {
  const args = parseArgs(argsText);
  if (!args.sender || !args.receiver || !args.amount || !args.asset) {
    return "Usage: /canpay sender=alice receiver=bob amount=10 asset=USDT";
  }

  try {
    const res = await fetch(`${API_SERVER}/can-pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sender: args.sender,
        receiver: args.receiver,
        amount: parseFloat(args.amount),
        asset: args.asset,
        metadata: null,
      }),
    });

    if (!res.ok) {
      return "❌ Error: API server returned failure status.";
    }

    const data = await res.json();
    if (data.status === "CanPay") {
      const hopsPath = data.best_route && data.best_route.hops
        ? [args.sender, ...data.best_route.hops].join(" → ")
        : args.sender + " → " + args.receiver;
      const fee = data.best_route ? data.best_route.total_fee : 0;
      return `✔ Payment likely to succeed.\nConfidence: ${data.confidence_score}%\nBest route: ${hopsPath}\nFee: ${fee} ${args.asset}`;
    } else {
      return `❌ Payment failed.\nReason: ${data.reason}\nSuggested fix: ${data.suggested_fix}`;
    }
  } catch (error) {
    return "❌ Error: Could not connect to the local API server.";
  }
}

export async function handleWhyFail(argsText) {
  const args = parseArgs(argsText);
  if (!args.payment_id) {
    return "Usage: /whyfail payment_id=capacity-fail";
  }

  try {
    const res = await fetch(`${API_SERVER}/diagnose/${args.payment_id}`);
    if (!res.ok) {
      return "❌ Error: API server returned failure status.";
    }

    const data = await res.json();
    return `❌ Payment failed.\nReason: ${data.human_reason}\nSuggested fix: ${data.suggested_fix}`;
  } catch (error) {
    return "❌ Error: Could not connect to the local API server.";
  }
}

export async function handleBestAsset(argsText) {
  const args = parseArgs(argsText);
  if (!args.receiver || !args.amount) {
    return "Usage: /bestasset receiver=bob amount=20";
  }

  try {
    const res = await fetch(`${API_SERVER}/best-asset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sender: "alice",
        receiver: args.receiver,
        amount: parseFloat(args.amount),
        asset: "USDT",
        metadata: null,
      }),
    });

    if (!res.ok) {
      return "❌ Error: API server returned failure status.";
    }

    const data = await res.json();
    return `Recommended asset: ${data.asset}\nConfidence: ${data.confidence}%\nReason: ${data.reason}`;
  } catch (error) {
    return "❌ Error: Could not connect to the local API server.";
  }
}

export async function handleBestRoute(argsText) {
  const args = parseArgs(argsText);
  if (!args.receiver || !args.asset) {
    return "Usage: /bestroute receiver=bob asset=USDT";
  }

  try {
    const res = await fetch(`${API_SERVER}/best-route`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sender: "alice",
        receiver: args.receiver,
        amount: 100.0,
        asset: args.asset,
        metadata: null,
      }),
    });

    if (!res.ok) {
      return "❌ Error: API server returned failure status.";
    }

    const data = await res.json();
    const hopsPath = ["alice", ...data.route.hops].join(" → ");
    return `Best route: ${hopsPath}\nScore: ${data.score}%\nReason: ${data.reason}`;
  } catch (error) {
    return "❌ Error: Could not connect to the local API server.";
  }
}

export async function handleLiquidity(argsText) {
  const args = parseArgs(argsText);
  if (!args.channel) {
    return "Usage: /liquidity channel=0x123";
  }

  // Simulating query results
  if (args.channel === "0x123" || args.channel === "chan_01") {
    return "Inbound: 12 USDT\nOutbound: 3 USDT\nStatus: Healthy";
  } else if (args.channel === "chan_03") {
    return "Inbound: 0 CKB\nOutbound: 10000 CKB\nStatus: Depleted";
  } else {
    return `Channel '${args.channel}' details:\nInbound: 50 USDT\nOutbound: 50 USDT\nStatus: Healthy`;
  }
}

// Start Telegram Bot listener if BOT_TOKEN is present
if (process.env.BOT_TOKEN) {
  import("grammy").then(({ Bot }) => {
    const bot = new Bot(process.env.BOT_TOKEN);

    bot.command("canpay", async (ctx) => {
      const response = await handleCanPay(ctx.match);
      ctx.reply(response);
    });

    bot.command("whyfail", async (ctx) => {
      const response = await handleWhyFail(ctx.match);
      ctx.reply(response);
    });

    bot.command("bestasset", async (ctx) => {
      const response = await handleBestAsset(ctx.match);
      ctx.reply(response);
    });

    bot.command("bestroute", async (ctx) => {
      const response = await handleBestRoute(ctx.match);
      ctx.reply(response);
    });

    bot.command("liquidity", async (ctx) => {
      const response = await handleLiquidity(ctx.match);
      ctx.reply(response);
    });

    bot.start();
    console.log("XQlyte Telegram Bot started...");
  }).catch((e) => {
    console.error("Failed to load grammy library", e);
  });
}
