import { Router } from 'express';
import { publish } from '../lib/marketHub.js';

const router = Router();
const SECRET = process.env.INTERNAL_SECRET || 'apex-internal';

router.post('/market', (req, res) => {
	if (req.headers['x-internal-secret'] !== SECRET) {
		return res.status(403).json({ error: 'Forbidden', code: 'INTERNAL_AUTH' });
	}
	const { event, payload } = req.body || {};
	if (!event) return res.status(400).json({ error: 'event required' });
	publish(event, payload);
	res.json({ ok: true });
});

export default router;
