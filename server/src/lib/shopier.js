import crypto from 'node:crypto';

export function shopierPassword() {
	return process.env.SHOPIER_API_PASSWORD || 'apex-shopier-dev';
}

export function signShopier(fields) {
	const payload = [fields.platform_order_id, fields.status, fields.payment_id, fields.random_nr].join('|');
	return crypto.createHmac('sha256', shopierPassword()).update(payload).digest('hex');
}

export function verifyShopier(fields) {
	const expected = signShopier(fields);
	const got = String(fields.signature || fields.hash || '');
	try {
		return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(got));
	} catch {
		return false;
	}
}

export function applyLicense(user, plan) {
	const days = plan.days || 30;
	const base = user.licenseExpiry && new Date(user.licenseExpiry) > new Date() ? new Date(user.licenseExpiry) : new Date();
	base.setDate(base.getDate() + days);
	user.subscriptionTier = plan.id;
	user.licenseExpiry = base.toISOString();
	return user;
}
