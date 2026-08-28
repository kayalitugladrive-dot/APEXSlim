import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { db } from '../lib/store.js';

const SECRET = process.env.JWT_SECRET || 'apexslim-dev-secret';
const ACCESS_TTL = process.env.JWT_ACCESS_TTL || '15m';
const REFRESH_TTL_DAYS = Number(process.env.JWT_REFRESH_DAYS || 14);

export function signAccessToken(user) {
	return jwt.sign({ sub: user.id, email: user.email, typ: 'access', role: user.role }, SECRET, {
		expiresIn: ACCESS_TTL,
	});
}

export function issueRefreshToken(user, meta = {}) {
	const token = crypto.randomBytes(48).toString('hex');
	const hash = crypto.createHash('sha256').update(token).digest('hex');
	const expiresAt = new Date(Date.now() + REFRESH_TTL_DAYS * 86400000).toISOString();
	db.get().refreshTokens.push({
		id: db.uuid(),
		userId: user.id,
		tokenHash: hash,
		expiresAt,
		revokedAt: null,
		ip: meta.ip,
		userAgent: meta.userAgent,
		createdAt: new Date().toISOString(),
	});
	db.persist();
	return token;
}

export function tokenPair(user, meta) {
	return {
		accessToken: signAccessToken(user),
		refreshToken: issueRefreshToken(user, meta),
		tokenType: 'Bearer',
		expiresIn: ACCESS_TTL,
	};
}

export function publicUser(user) {
	return {
		id: user.id,
		email: user.email,
		displayName: user.displayName,
		role: user.role,
		twoFaEnabled: Boolean(user.twoFaSecret),
		subscriptionTier: user.subscriptionTier || 'FREE',
		licenseExpiry: user.licenseExpiry || null,
	};
}

export function requireAuth(req, res, next) {
	const header = req.headers.authorization || '';
	const token = header.startsWith('Bearer ') ? header.slice(7) : null;
	if (!token) {
		return res.status(401).json({ error: 'Unauthorized', code: 'NO_TOKEN' });
	}
	try {
		const payload = jwt.verify(token, SECRET);
		if (payload.typ && payload.typ !== 'access') {
			return res.status(401).json({ error: 'Access token required', code: 'WRONG_TOKEN_TYPE' });
		}
		const user = db.get().users.find((u) => u.id === payload.sub);
		if (!user || !user.isActive) {
			return res.status(401).json({ error: 'Unauthorized', code: 'INVALID_USER' });
		}
		req.user = publicUser(user);
		return next();
	} catch {
		return res.status(401).json({ error: 'Access token expired', code: 'TOKEN_INVALID' });
	}
}

export function errorHandler(err, req, res, next) {
	console.error(err);
	if (res.headersSent) return next(err);
	const status = err.status || 500;
	res.status(status).json({
		error: err.message || 'Internal server error',
		code: err.code || 'INTERNAL',
	});
}
