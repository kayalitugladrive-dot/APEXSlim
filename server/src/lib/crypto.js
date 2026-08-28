import crypto from 'node:crypto';

const ALGO = 'aes-256-gcm';

function getKey() {
	const raw = process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
	return Buffer.from(raw.slice(0, 64), 'hex');
}

export function encryptSecret(plain) {
	const iv = crypto.randomBytes(12);
	const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
	const encrypted = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
	const authTag = cipher.getAuthTag();
	return {
		cipher: encrypted.toString('base64'),
		iv: iv.toString('base64'),
		authTag: authTag.toString('base64'),
	};
}

export function decryptSecret({ cipher, iv, authTag }) {
	const decipher = crypto.createDecipheriv(ALGO, getKey(), Buffer.from(iv, 'base64'));
	decipher.setAuthTag(Buffer.from(authTag, 'base64'));
	const decrypted = Buffer.concat([decipher.update(Buffer.from(cipher, 'base64')), decipher.final()]);
	return decrypted.toString('utf8');
}

export function maskKey(value) {
	if (!value) return '';
	const s = String(value);
	if (s.length <= 8) return '••••••••';
	return `${s.slice(0, 4)}••••${s.slice(-4)}`;
}
