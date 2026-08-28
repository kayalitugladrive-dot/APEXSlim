import { Router } from 'express';
import { db } from '../lib/store.js';
import { requireAuth } from '../middleware/auth.js';
import { PLANS, licenseActive } from '../lib/plans.js';
import { applyLicense, signShopier, verifyShopier } from '../lib/shopier.js';

const router = Router();

router.get('/plans', (req, res) => {
	res.json({ plans: Object.values(PLANS) });
});

router.get('/me', requireAuth, (req, res) => {
	const user = db.get().users.find((u) => u.id === req.user.id);
	const payments = db.get().payments.filter((p) => p.userId === req.user.id);
	res.json({
		subscriptionTier: user.subscriptionTier || 'FREE',
		licenseExpiry: user.licenseExpiry || null,
		active: licenseActive(user),
		payments,
	});
});

router.post('/checkout', requireAuth, (req, res) => {
	const plan = PLANS[req.body?.plan];
	if (!plan || plan.id === 'FREE') {
		return res.status(400).json({ error: 'Invalid plan', code: 'PLAN' });
	}
	const orderId = `APX-${Date.now()}`;
	const payment = {
		id: db.uuid(),
		userId: req.user.id,
		plan: plan.id,
		amountTry: plan.priceTry,
		status: 'PENDING',
		provider: 'shopier',
		platformOrderId: orderId,
		paymentId: null,
		raw: null,
		createdAt: new Date().toISOString(),
	};
	db.get().payments.push(payment);
	db.persist();
	const random_nr = Math.random().toString(36).slice(2);
	res.json({
		payment,
		shopier: {
			action: process.env.SHOPIER_CHECKOUT_URL || 'https://www.shopier.com/ShowProduct/api_pay4.php',
			fields: {
				API_user: process.env.SHOPIER_API_USER || 'demo-shopier',
				platform_order_id: orderId,
				product_name: `APEXSlim ${plan.name}`,
				product_type: 1,
				buyer_email: req.user.email,
				total_order_value: plan.priceTry,
				currency: 'TRY',
				random_nr,
				callback: `${process.env.PUBLIC_API_URL || 'http://localhost:4000'}/api/billing/shopier/webhook`,
			},
			sandboxNote: 'Use POST /api/billing/sandbox-complete in this environment.',
		},
	});
});

function completePayment(payment, fields) {
	const user = db.get().users.find((u) => u.id === payment.userId);
	const plan = PLANS[payment.plan];
	payment.status = 'SUCCESS';
	payment.paymentId = fields.payment_id;
	payment.raw = fields;
	payment.completedAt = new Date().toISOString();
	applyLicense(user, plan);
	db.persist();
	return { payment, user };
}

router.post('/shopier/webhook', (req, res) => {
	const fields = {
		platform_order_id: req.body.platform_order_id,
		status: String(req.body.status || req.body.res || ''),
		payment_id: req.body.payment_id,
		random_nr: req.body.random_nr,
		signature: req.body.signature || req.body.hash,
	};
	if (!verifyShopier(fields)) {
		return res.status(403).send('INVALID_SIGNATURE');
	}
	const payment = db.get().payments.find((p) => p.platformOrderId === fields.platform_order_id);
	if (!payment) return res.status(404).send('ORDER_NOT_FOUND');
	const ok = ['1', 'success', 'SUCCESS', 'OK'].includes(fields.status);
	if (!ok) {
		payment.status = 'FAILED';
		payment.raw = fields;
		db.persist();
		return res.send('OK');
	}
	completePayment(payment, fields);
	res.send('OK');
});

/** Dev-only: emulate Shopier success without leaving the app. */
router.post('/sandbox-complete', requireAuth, (req, res) => {
	const { platformOrderId } = req.body || {};
	const payment = db.get().payments.find((p) => p.platformOrderId === platformOrderId && p.userId === req.user.id);
	if (!payment) return res.status(404).json({ error: 'Order not found' });
	const fields = {
		platform_order_id: payment.platformOrderId,
		status: 'SUCCESS',
		payment_id: `sim-${Date.now()}`,
		random_nr: 'sandbox',
	};
	fields.signature = signShopier(fields);
	const result = completePayment(payment, fields);
	res.json({
		ok: true,
		subscriptionTier: result.user.subscriptionTier,
		licenseExpiry: result.user.licenseExpiry,
		payment: result.payment,
	});
});

export default router;
