import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/klines', async (req, res) => {
	const symbol = String(req.query.symbol || 'BTCUSDT').toUpperCase();
	const interval = String(req.query.interval || '15m');
	const limit = Number(req.query.limit || 200);
	const url = `https://fapi.binance.com/fapi/v1/klines?symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(interval)}&limit=${limit}`;
	try {
		const r = await fetch(url);
		if (!r.ok) {
			return res.status(502).json({ error: 'Binance kline request failed', code: 'EXCHANGE_DOWN' });
		}
		const raw = await r.json();
		const candles = raw.map((k) => ({
			time: Math.floor(k[0] / 1000),
			open: Number(k[1]),
			high: Number(k[2]),
			low: Number(k[3]),
			close: Number(k[4]),
			volume: Number(k[5]),
		}));
		res.json({ symbol, interval, candles });
	} catch (err) {
		res.status(503).json({ error: err.message, code: 'RATE_LIMIT_OR_NETWORK' });
	}
});

router.get('/metrics', (req, res) => {
	const symbol = String(req.query.symbol || 'BTCUSDT').toUpperCase();
	res.json({
		symbol,
		longShortRatio: 1.18,
		fundingRate: 0.00012,
		openInterest: 482_000_000,
		liquidationMap: [
			{ price: 59800, usd: 12_400_000, side: 'long' },
			{ price: 60500, usd: 8_200_000, side: 'long' },
			{ price: 63200, usd: 9_100_000, side: 'short' },
			{ price: 64100, usd: 15_800_000, side: 'short' },
		],
		smartMoney: [
			{ level: 61880, type: 'equal-highs', note: 'Liquidity sweep zone' },
			{ level: 60420, type: 'equal-lows', note: 'Buy-side inducement' },
		],
	});
});

export default router;
