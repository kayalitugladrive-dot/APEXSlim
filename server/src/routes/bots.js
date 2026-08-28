import { Router } from 'express';
import { db } from '../lib/store.js';
import { requireAuth } from '../middleware/auth.js';
import { requireTier } from '../middleware/subscription.js';

const router = Router();
router.use(requireAuth);

function enqueue(cmd) {
	db.get().engineCommands.push({
		id: db.uuid(),
		...cmd,
		createdAt: new Date().toISOString(),
		consumedAt: null,
	});
}

router.get('/', (req, res) => {
	const bots = db.get().botConfigs.filter((b) => b.userId === req.user.id);
	res.json({ bots, engine: db.get().engineHeartbeat });
});

router.post('/', requireTier('PRO'), (req, res) => {
	const { name, symbol, leverage, side, takeProfitPct, stopLossPct, indicator, params, apiKeyId, riskModel } =
		req.body || {};
	if (!name || !symbol) {
		return res.status(400).json({ error: 'name and symbol required', code: 'VALIDATION' });
	}
	const bot = {
		id: db.uuid(),
		userId: req.user.id,
		apiKeyId: apiKeyId || null,
		name,
		symbol: String(symbol).toUpperCase(),
		leverage: Number(leverage || 3),
		side: side || 'BOTH',
		takeProfitPct: Number(takeProfitPct || 1.5),
		stopLossPct: Number(stopLossPct || 1),
		indicator: indicator || 'RSI',
		params: params || { rsiPeriod: 14, rsiBuy: 30, rsiSell: 70 },
		riskModel: riskModel || { type: 'none' },
		status: 'STOPPED',
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	};
	db.get().botConfigs.push(bot);
	db.persist();
	res.status(201).json({ bot });
});

router.post('/:id/start', requireTier('PRO'), (req, res) => {
	const bot = db.get().botConfigs.find((b) => b.id === req.params.id && b.userId === req.user.id);
	if (!bot) return res.status(404).json({ error: 'Bot not found', code: 'NOT_FOUND' });
	bot.status = 'RUNNING';
	bot.updatedAt = new Date().toISOString();
	enqueue({ type: 'START_BOT', botId: bot.id, userId: req.user.id });
	db.persist();
	res.json({ bot });
});

router.post('/:id/stop', (req, res) => {
	const bot = db.get().botConfigs.find((b) => b.id === req.params.id && b.userId === req.user.id);
	if (!bot) return res.status(404).json({ error: 'Bot not found', code: 'NOT_FOUND' });
	bot.status = 'STOPPED';
	bot.updatedAt = new Date().toISOString();
	enqueue({ type: 'STOP_BOT', botId: bot.id, userId: req.user.id });
	db.persist();
	res.json({ bot });
});

router.get('/logs/recent', (req, res) => {
	const logs = db
		.get()
		.tradeLogs.filter((l) => l.userId === req.user.id)
		.slice(-50)
		.reverse();
	res.json({ logs });
});

export default router;
