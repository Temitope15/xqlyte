import fetch from "node-fetch";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";

// Load the repo-root .env (walking up) so BOT_TOKEN + API_SERVER_URL are available
(function loadRootEnv() {
  let dir = dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 6; i++) {
    const candidate = resolve(dir, ".env");
    if (existsSync(candidate)) {
      loadEnv({ path: candidate });
      return;
    }
    dir = dirname(dir);
  }
})();

const API_SERVER = process.env.API_SERVER_URL || "http://localhost:3000";

// Helper to parse key=value style arguments or positional arguments
export function parseArgs(text, expectedKeys = []) {
  const args = {};
  if (!text) return args;
  const parts = text.trim().split(/\s+/);
  
  // Try parsing as key=value pairs first
  let isKeyValue = true;
  for (const part of parts) {
    if (part.indexOf("=") === -1) {
      isKeyValue = false;
      break;
    }
  }

  if (isKeyValue) {
    for (const part of parts) {
      const eqIdx = part.indexOf("=");
      if (eqIdx !== -1) {
        const key = part.slice(0, eqIdx).trim().toLowerCase();
        const val = part.slice(eqIdx + 1).trim();
        args[key] = val;
      }
    }
  } else {
    // If not key=value, treat as positional arguments mapped to expectedKeys
    for (let i = 0; i < parts.length && i < expectedKeys.length; i++) {
      args[expectedKeys[i]] = parts[i];
    }
  }
  return args;
}

// Handler functions for slash commands
export async function handleCanPay(argsText) {
  const args = parseArgs(argsText, ["sender", "receiver", "amount", "asset"]);
  if (!args.sender || !args.receiver || !args.amount || !args.asset) {
    return "Usage: /canpay sender=alice receiver=bob amount=10 asset=USDT or /canpay alice bob 10 USDT";
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
      const errText = await res.text().catch(() => "");
      return `❌ Error: API server returned status ${res.status}. ${errText || ""}`;
    }

    const data = await res.json();
    if (data.status === "CanPay") {
      const hopsPath = data.best_route && data.best_route.hops
        ? [args.sender, ...data.best_route.hops].join(" → ")
        : args.sender + " → " + args.receiver;
      const fee = data.best_route ? data.best_route.total_fee : 0.01;
      return `✔ *Payment likely to succeed.*\nConfidence: *${data.confidence_score}%*\nBest route: ${hopsPath}\nFee: *${fee} ${args.asset}*`;
    } else {
      return `❌ *Payment failed.*\nReason: ${data.reason}\nSuggested fix: *${data.suggested_fix}*`;
    }
  } catch (error) {
    return "❌ Error: Could not connect to the local API server.";
  }
}

export async function handleWhyFail(argsText) {
  const args = parseArgs(argsText, ["payment_id"]);
  if (!args.payment_id) {
    return "Usage: /whyfail payment_id=capacity-fail or /whyfail capacity-fail";
  }

  try {
    const res = await fetch(`${API_SERVER}/diagnose/${args.payment_id}`);
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return `❌ Error: API server returned status ${res.status}. ${errText || ""}`;
    }

    const data = await res.json();
    return `❌ *Payment failed.*\nReason: ${data.human_reason}\nSuggested fix: *${data.suggested_fix}*`;
  } catch (error) {
    return "❌ Error: Could not connect to the local API server.";
  }
}

export async function handleBestAsset(argsText) {
  const args = parseArgs(argsText, ["receiver", "amount"]);
  if (!args.receiver || !args.amount) {
    return "Usage: /bestasset receiver=bob amount=20 or /bestasset bob 20";
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
      const errText = await res.text().catch(() => "");
      return `❌ Error: API server returned status ${res.status}. ${errText || ""}`;
    }

    const data = await res.json();
    return `Recommended asset: *${data.asset}*\nConfidence: *${data.confidence}%*\nReason: ${data.reason}`;
  } catch (error) {
    return "❌ Error: Could not connect to the local API server.";
  }
}

export async function handleBestRoute(argsText) {
  const args = parseArgs(argsText, ["receiver", "asset"]);
  if (!args.receiver || !args.asset) {
    return "Usage: /bestroute receiver=bob asset=USDT or /bestroute bob USDT";
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
      const errText = await res.text().catch(() => "");
      return `❌ Error: API server returned status ${res.status}. ${errText || ""}`;
    }

    const data = await res.json();
    const hopsPath = ["alice", ...data.route.hops].join(" → ");
    return `Best route:\n${hopsPath}\nScore: *${data.score}%*\nReason: ${data.reason}`;
  } catch (error) {
    return "❌ Error: Could not connect to the local API server.";
  }
}

export async function handleLiquidity(argsText) {
  const args = parseArgs(argsText, ["channel"]);
  if (!args.channel) {
    return "Usage: /liquidity channel=0x123 or /liquidity 0x123";
  }

  // Simulating query results
  if (args.channel === "0x123" || args.channel === "chan_01") {
    return "*Inbound:* 12 USDT\n*Outbound:* 3 USDT\nStatus: *Healthy*";
  } else if (args.channel === "chan_03") {
    return "*Inbound:* 0 CKB\n*Outbound:* 10000 CKB\nStatus: *Depleted*";
  } else {
    return `Channel '${args.channel}' details:\n*Inbound:* 50 USDT\n*Outbound:* 50 USDT\nStatus: *Healthy*`;
  }
}

// Start Telegram Bot listener if BOT_TOKEN or HIVE_TELEGRAM_TOKEN is present
const token = process.env.BOT_TOKEN || process.env.HIVE_TELEGRAM_TOKEN;
if (token) {
  import("grammy").then(({ Bot }) => {
    const bot = new Bot(token);

    // Help message
    const HELP_MESSAGE = `
⚡ *XQlyte Diagnostics Bot* — Nervos Fiber Network ⚡

Exposing the XQlyte diagnostics & confidence engine via chat. Check routing, channel health, and analyze failures instantly.

*Available Commands:*
• /canpay \`[sender] [receiver] [amount] [asset]\` — Pre-flight payment check
• /whyfail \`[payment_id]\` — Diagnose a transaction failure
• /bestasset \`[receiver] [amount]\` — Recommends the best asset for transfer
• /bestroute \`[receiver] [asset]\` — Find the optimal route path
• /liquidity \`[channel]\` — Inspect inbound/outbound channel health
• /help — Show this help message

_Examples:_
• \`/canpay alice bob 10 USDT\`
• \`/whyfail capacity-fail\`
• \`/bestasset bob 20\`
• \`/bestroute bob USDT\`
• \`/liquidity 0x123\`
    `.trim();

    // Start/Help commands
    bot.command(["start", "help"], (ctx) => {
      ctx.reply(HELP_MESSAGE, { parse_mode: "Markdown" });
    });

    // Helper to execute commands with status updates
    async function runBotCommand(ctx, handlerFn) {
      const thinking = await ctx.reply("⏳ working…");
      try {
        const responseText = await handlerFn(ctx.match);
        await ctx.api.editMessageText(ctx.chat.id, thinking.message_id, responseText, {
          parse_mode: "Markdown",
          disable_web_page_preview: true,
        });
      } catch (error) {
        console.error("Bot execution error:", error);
        await ctx.api.editMessageText(ctx.chat.id, thinking.message_id, `⚠️ Something went wrong: ${error.message}`);
      }
    }

    bot.command("canpay", (ctx) => runBotCommand(ctx, handleCanPay));
    bot.command("whyfail", (ctx) => runBotCommand(ctx, handleWhyFail));
    bot.command("bestasset", (ctx) => runBotCommand(ctx, handleBestAsset));
    bot.command("bestroute", (ctx) => runBotCommand(ctx, handleBestRoute));
    bot.command("liquidity", (ctx) => runBotCommand(ctx, handleLiquidity));

    bot.start();
    console.log("XQlyte Telegram Bot started...");

    // Start a dummy HTTP server so Render Web Service port check passes successfully
    const port = process.env.PORT || 10000;
    import("node:http").then(({ createServer }) => {
      createServer((req, res) => {
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("XQlyte Telegram Bot is running.");
      }).listen(port, () => {
        console.log(`Dummy HTTP server listening on port ${port} to satisfy Render port scanner.`);
      });
    }).catch((err) => {
      console.error("Failed to start dummy HTTP server:", err);
    });

  }).catch((e) => {
    console.error("Failed to load grammy library", e);
  });
} else {
  console.log("BOT_TOKEN or HIVE_TELEGRAM_TOKEN is not set. Bot will not start.");
}
