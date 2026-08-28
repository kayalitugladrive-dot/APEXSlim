import { db } from '../lib/store.js';
import { hasTier } from '../lib/plans.js';

export function requireTier(min = 'PRO') {
	return (req, res, next) => {
		const user = db.get().users.find((u) => u.id === req.user.id);
		if (!hasTier(user, min)) {
			return res.status(402).json({
				error: `This feature requires an active ${min} license`,
				code: 'LICENSE_REQUIRED',
				min,
			});
		}
		return next();
	};
}
