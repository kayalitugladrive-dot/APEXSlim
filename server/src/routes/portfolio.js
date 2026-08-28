import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { demoPortfolio } from '../lib/portfolio.js';
import { db } from '../lib/store.js';

const router = Router();
router.use(requireAuth);

router.get('/', (req, res) => {
	const data = demoPortfolio(req.user.id);
	const keyCount = db.get().apiKeys.filter((k) => k.userId === req.user.id && k.isActive).length;
	data.apiKeysLinked = keyCount;
	if (keyCount === 0) {
		data.connection.ws = 'idle';
		data.connection.note = 'No API key linked. Showing paper portfolio.';
	}
	res.json(data);
});

export default router;
