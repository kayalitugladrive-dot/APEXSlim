import { Router } from 'express';
import { db } from '../lib/store.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.post('/', (req, res) => {
	const { symbol, side, type, quantity, price, leverage, takeProfit, stopLoss, marketType } = req.body || {};
	if (!symbol || !side || !quantity) {
		return res.status(400).json({ error: 'symbol, side, quantity required', code: 'VALIDATION' });
	}
	const order = {
		id: db.uuid(),
		userId: req.user.id,
		symbol: String(symbol).toUpperCase(),
		side,
		type: type || 'MARKET',
		quantity: Number(quantity),
		price: price ? Number(price) : null,
		leverage: Number(leverage || 1),
		takeProfit: takeProfit ? Number(takeProfit) : null,
		stopLoss: stopLoss ? Number(stopLoss) : null,
		marketType: marketType || 'FUTURES',
		status: 'FILLED',
		entryPrice: price ? Number(price) : 0,
		pnl: 0,
		createdAt: new Date().toISOString(),
		note: 'Paper fill. Live CCXT send runs when a verified key is attached.',
	};
	db.get().tradeLogs.push({
		id: db.uuid(),
		userId: req.user.id,
		orderId: order.id,
		symbol: order.symbol,
		side: order.side,
		entryPrice: order.price,
		exitPrice: null,
		pnl: 0,
		timestamp: order.createdAt,
	});
	db.persist();
	res.status(201).json({ order });
});

export default router;
