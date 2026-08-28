import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requireTier } from '../middleware/subscription.js';

const router = Router();
router.use(requireAuth);

router.post('/advise', requireTier('PRO'), async (req, res) => {
	const { symbol, lastClose, interval } = req.body || {};
	const key = process.env.GEMINI_API_KEY;
	if (!key) {
		const bias = Number(lastClose) % 2 === 0 ? 'cautious long' : 'neutral-to-short';
		return res.json({
			provider: 'heuristic',
			symbol: symbol || 'BTCUSDT',
			interval: interval || '15m',
			advice: `Paper AI: last close ${lastClose ?? 'n/a'}. Bias is ${bias}. Wait for liquidity sweep confirmation before adding size. This is not financial advice.`,
		});
	}
	try {
		const r = await fetch(
			`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					contents: [
						{
							parts: [
								{
									text: `Give a short crypto futures market comment for ${symbol} ${interval} last close ${lastClose}. Not financial advice. 4 sentences max.`,
								},
							],
						},
					],
				}),
			},
		);
		const data = await r.json();
		const advice = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No model output';
		res.json({ provider: 'gemini', advice });
	} catch (err) {
		res.status(503).json({ error: err.message, code: 'AI_UNAVAILABLE' });
	}
});

export default router;
