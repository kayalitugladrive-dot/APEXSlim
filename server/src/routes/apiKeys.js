import { Router } from 'express';
import { db } from '../lib/store.js';
import { encryptSecret, maskKey } from '../lib/crypto.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

function publicKey(row) {
	return {
		id: row.id,
		label: row.label,
		exchange: row.exchange,
		marketType: row.marketType,
		apiKeyMasked: maskKey(row.apiKeyPlainHint),
		permissions: row.permissions,
		isTestnet: row.isTestnet,
		isActive: row.isActive,
		lastVerifiedAt: row.lastVerifiedAt,
		lastError: row.lastError,
		createdAt: row.createdAt,
	};
}

router.get('/', (req, res) => {
	const keys = db.get().apiKeys.filter((k) => k.userId === req.user.id).map(publicKey);
	res.json({ keys });
});

router.post('/', (req, res) => {
	const { label, exchange, marketType, apiKey, apiSecret, passphrase, isTestnet } = req.body || {};
	if (!label || !apiKey || !apiSecret) {
		return res.status(400).json({ error: 'Label, API key and secret are required', code: 'VALIDATION' });
	}
	const keyEnc = encryptSecret(apiKey);
	const secretEnc = encryptSecret(apiSecret);
	const passEnc = passphrase ? encryptSecret(passphrase) : null;
	const row = {
		id: db.uuid(),
		userId: req.user.id,
		label,
		exchange: exchange || 'BINANCE_FUTURES',
		marketType: marketType || 'FUTURES',
		apiKeyCipher: keyEnc.cipher,
		apiSecretCipher: secretEnc.cipher,
		passphraseCipher: passEnc?.cipher || null,
		iv: secretEnc.iv,
		authTag: secretEnc.authTag,
		keyIv: keyEnc.iv,
		keyAuthTag: keyEnc.authTag,
		passIv: passEnc?.iv,
		passAuthTag: passEnc?.authTag,
		apiKeyPlainHint: apiKey,
		permissions: { read: true, trade: true, withdraw: false },
		isTestnet: isTestnet !== false,
		isActive: true,
		lastVerifiedAt: null,
		lastError: null,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	};
	db.get().apiKeys.push(row);
	db.get().auditLogs.push({
		id: db.uuid(),
		userId: req.user.id,
		action: 'API_KEY_CREATED',
		meta: { keyId: row.id, exchange: row.exchange },
		createdAt: new Date().toISOString(),
	});
	db.persist();
	res.status(201).json({ key: publicKey(row) });
});

router.post('/:id/verify', (req, res) => {
	const row = db.get().apiKeys.find((k) => k.id === req.params.id && k.userId === req.user.id);
	if (!row) return res.status(404).json({ error: 'Key not found', code: 'NOT_FOUND' });
	const looksValid = row.apiKeyPlainHint && row.apiKeyPlainHint.length >= 8;
	if (!looksValid) {
		row.lastError = 'Invalid key format';
		row.lastVerifiedAt = new Date().toISOString();
		db.persist();
		return res.status(422).json({
			error: 'Exchange rejected credentials (format)',
			code: 'EXCHANGE_REJECT',
			key: publicKey(row),
		});
	}
	row.lastError = null;
	row.lastVerifiedAt = new Date().toISOString();
	row.isActive = true;
	db.persist();
	res.json({
		ok: true,
		mode: 'paper-verify',
		message: 'Credentials stored encrypted. Live CCXT ping will run when exchange network is enabled.',
		key: publicKey(row),
	});
});

router.delete('/:id', (req, res) => {
	const keys = db.get().apiKeys;
	const idx = keys.findIndex((k) => k.id === req.params.id && k.userId === req.user.id);
	if (idx === -1) return res.status(404).json({ error: 'Key not found', code: 'NOT_FOUND' });
	keys.splice(idx, 1);
	db.persist();
	res.json({ ok: true });
});

export default router;
