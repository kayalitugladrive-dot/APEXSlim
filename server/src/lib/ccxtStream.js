/**
 * CCXT Pro watch_* loops with REST fallback.
 * Engine keeps a single Binance USDM connection and pushes ticks to the API hub.
 */
import { publish } from './marketHub.js';

function toCandle(row) {
	return {
		time: Math.floor(row[0] / 1000),
		open: Number(row[1]),
		high: Number(row[2]),
		low: Number(row[3]),
		close: Number(row[4]),
		volume: Number(row[5] || 0),
	};
}

function sleep(ms) {
	return new Promise((r) => setTimeout(r, ms));
}

export async function createBinanceUsdm() {
	try {
		const ccxt = await import('ccxt');
		const Pro = ccxt.pro || ccxt.default?.pro;
		if (Pro?.binanceusdm) {
			return new Pro.binanceusdm({ enableRateLimit: true, options: { defaultType: 'future' } });
		}
		if (ccxt.pro?.binanceusdm) {
			return new ccxt.pro.binanceusdm({ enableRateLimit: true });
		}
	} catch (err) {
		console.warn('[ccxt] not loaded', err.message);
	}
	return null;
}

async function watchLoop(name, fn) {
	let backoff = 1000;
	for (;;) {
		try {
			await fn();
			backoff = 1000;
		} catch (err) {
			console.warn(`[ccxt] ${name} error`, err.message);
			publish('status', { source: 'ccxt', state: 'reconnecting', error: err.message, channel: name });
			await sleep(backoff);
			backoff = Math.min(backoff * 2, 30000);
		}
	}
}

export async function startCcxtWatches({ symbol = 'BTC/USDT:USDT', timeframe = '15m' } = {}) {
	const exchange = await createBinanceUsdm();
	if (exchange?.watchOHLCV) {
		watchLoop('ohlcv', async () => {
			const rows = await exchange.watchOHLCV(symbol, timeframe);
			const last = rows[rows.length - 1];
			if (last) publish('kline', { symbol, timeframe, candle: toCandle(last), source: 'ccxt.watchOHLCV' });
		});
		watchLoop('ticker', async () => {
			const t = await exchange.watchTicker(symbol);
			publish('ticker', {
				symbol,
				last: t.last,
				bid: t.bid,
				ask: t.ask,
				percentage: t.percentage,
				source: 'ccxt.watchTicker',
			});
		});
		watchLoop('orderbook', async () => {
			const book = await exchange.watchOrderBook(symbol, 10);
			publish('orderbook', {
				symbol,
				bids: (book.bids || []).slice(0, 10),
				asks: (book.asks || []).slice(0, 10),
				source: 'ccxt.watchOrderBook',
			});
		});
		publish('status', { source: 'ccxt', state: 'watching', symbol, timeframe });
		return 'ccxt';
	}

	publish('status', { source: 'rest-fallback', state: 'watching', symbol, timeframe });
	const compact = symbol.replace('/', '').replace(':USDT', '');
	const poll = async () => {
		try {
			const kUrl = `https://fapi.binance.com/fapi/v1/klines?symbol=${compact}&interval=${timeframe}&limit=2`;
			const tUrl = `https://fapi.binance.com/fapi/v1/ticker/bookTicker?symbol=${compact}`;
			const dUrl = `https://fapi.binance.com/fapi/v1/depth?symbol=${compact}&limit=10`;
			const [kRes, tRes, dRes] = await Promise.all([fetch(kUrl), fetch(tUrl), fetch(dUrl)]);
			if (kRes.ok) {
				const k = await kRes.json();
				publish('kline', { symbol, timeframe, candle: toCandle(k[k.length - 1]), source: 'rest.klines' });
			}
			if (tRes.ok) {
				const t = await tRes.json();
				publish('ticker', {
					symbol,
					last: Number(t.bidPrice),
					bid: Number(t.bidPrice),
					ask: Number(t.askPrice),
					source: 'rest.ticker',
				});
			}
			if (dRes.ok) {
				const d = await dRes.json();
				publish('orderbook', {
					symbol,
					bids: d.bids,
					asks: d.asks,
					source: 'rest.depth',
				});
			}
		} catch (err) {
			publish('status', { source: 'rest-fallback', state: 'error', error: err.message });
		}
	};
	await poll();
	setInterval(poll, 2500);
	return 'rest-fallback';
}
