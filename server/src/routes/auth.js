import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { db } from '../lib/store.js';
import { issueRefreshToken, publicUser, requireAuth, signAccessToken, tokenPair } from '../middleware/auth.js';

const router = Router();

function meta(req) {
	return { ip: req.ip, userAgent: req.headers['user-agent'] };
}

router.post('/register', async (req, res) => {
	const { email, password, displayName } = req.body || {};
	if (!email || !password) {
		return res.status(400).json({ error: 'Email and password required', code: 'VALIDATION' });
	}
	const existing = db.get().users.find((u) => u.email.toLowerCase() === String(email).toLowerCase());
	if (existing) {
		return res.status(409).json({ error: 'Email already registered', code: 'EMAIL_TAKEN' });
	}
	const user = {
		id: db.uuid(),
		email: String(email).toLowerCase(),
		passwordHash: await bcrypt.hash(password, 10),
		displayName: displayName || email.split('@')[0],
		role: 'trader',
		twoFaSecret: null,
		subscriptionTier: 'FREE',
		licenseExpiry: null,
		isActive: true,
		createdAt: new Date().toISOString(),
	};
	db.get().users.push(user);
	db.persist();
	return res.status(201).json({
		...tokenPair(user, meta(req)),
		token: signAccessToken(user),
		user: publicUser(user),
	});
});

router.post('/login', async (req, res) => {
	const { email, password } = req.body || {};
	const user = db.get().users.find((u) => u.email.toLowerCase() === String(email || '').toLowerCase());
	if (!user) {
		return res.status(401).json({ error: 'Invalid credentials', code: 'BAD_CREDENTIALS' });
	}
	const ok = await bcrypt.compare(password || '', user.passwordHash);
	if (!ok) {
		return res.status(401).json({ error: 'Invalid credentials', code: 'BAD_CREDENTIALS' });
	}
	return res.json({
		...tokenPair(user, meta(req)),
		token: signAccessToken(user),
		user: publicUser(user),
	});
});

router.post('/refresh', (req, res) => {
	const { refreshToken } = req.body || {};
	if (!refreshToken) {
		return res.status(400).json({ error: 'refreshToken required', code: 'VALIDATION' });
	}
	const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
	const row = db.get().refreshTokens.find((t) => t.tokenHash === hash && !t.revokedAt);
	if (!row || new Date(row.expiresAt) < new Date()) {
		return res.status(401).json({ error: 'Refresh token invalid', code: 'REFRESH_INVALID' });
	}
	const user = db.get().users.find((u) => u.id === row.userId);
	if (!user) {
		return res.status(401).json({ error: 'User not found', code: 'INVALID_USER' });
	}
	row.revokedAt = new Date().toISOString();
	const accessToken = signAccessToken(user);
	const nextRefresh = issueRefreshToken(user, meta(req));
	return res.json({
		accessToken,
		refreshToken: nextRefresh,
		token: accessToken,
		tokenType: 'Bearer',
		user: publicUser(user),
	});
});

router.post('/logout', requireAuth, (req, res) => {
	db.get().refreshTokens.forEach((t) => {
		if (t.userId === req.user.id && !t.revokedAt) t.revokedAt = new Date().toISOString();
	});
	db.persist();
	res.json({ ok: true });
});

router.get('/me', requireAuth, (req, res) => {
	res.json({ user: req.user });
});

export default router;
