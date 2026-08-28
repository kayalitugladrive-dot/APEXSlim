/**
 * Decoupled trading engine.
 *   node src/engine/index.js
 * CCXT Pro watchOHLCV / watchTicker / watchOrderBook → HTTP ingest → Socket.io clients.
 */
import { db, reloadFromDisk } from '../lib/store.js';
import { startCcxtWatches } from '../lib/ccxtStream.js';
import { subscribe } from '../lib/marketHub.js';
import { evaluateRisk } from '../lib/risk.js';

const API = process.env.API_INTERNAL || 'http://127.0.0.1:4000';
const SECRET = process.env.INTERNAL_SECRET || 'apex-internal';

subscribe(async (event, payload) => {
	try {
		await fetch(`${API}/internal/market`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', 'x-internal-secret': SECRET },
			body: JSON.stringify({ event, payload }),
		});
	} catch {
		/* API may be down; local hub still used if co-located */
	}
});

let lastClose = null;
subscribe((event, payload) => {
	if (event === 'kline' && payload?.candle) lastClose = payload.candle.close;
	if (event === 'ticker' && payload?.last) lastClose = payload.last;
});

function tickBots() {
	reloadFromDisk();
	const state = db.get();
	state.engineCommands.filter((c) => !c.consumedAt).forEach((c) => {
		c.consumedAt = new Date().toISOString();
		console.log('[engine] command', c.type, c.botId);
	});
	const active = state.botConfigs.filter((b) => b.status === 'RUNNING');
	active.forEach((bot) => {
		const pos = state.positions.find((p) => p.botId === bot.id && p.status === 'OPEN') || {
			side: bot.side === 'SHORT' ? 'SHORT' : 'LONG',
			entryPrice: lastClose ? lastClose * 1.01 : 0,
			quantity: 0.1,
		};
		const decision = evaluateRisk(bot, lastClose, pos);
		if (decision.action !== 'HOLD') {
			state.tradeLogs.push({
				id: db.uuid(),
				userId: bot.userId,
				botId: bot.id,
				symbol: bot.symbol,
				side: decision.hedgeSide || bot.side,
				entryPrice: lastClose,
				pnl: 0,
				timestamp: new Date().toISOString(),
				note: decision.note,
			});
		}
	});
	state.engineHeartbeat = {
		ts: new Date().toISOString(),
		ws: lastClose ? 'connected' : 'connecting',
		activeBots: active.length,
		lastClose,
		feed: 'ccxt-pro',
	};
	db.persist();
}

startCcxtWatches({ symbol: 'BTC/USDT:USDT', timeframe: '1m' }).then((mode) => {
	console.log('[engine] market watches started via', mode);
});
setInterval(tickBots, 5000);
console.log('[engine] APEXSlim trading engine started');
