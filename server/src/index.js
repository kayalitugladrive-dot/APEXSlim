import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { db } from './lib/store.js';
import authRoutes from './routes/auth.js';
import apiKeyRoutes from './routes/apiKeys.js';
import portfolioRoutes from './routes/portfolio.js';
import marketRoutes from './routes/market.js';
import botRoutes from './routes/bots.js';
import orderRoutes from './routes/orders.js';
import aiRoutes from './routes/ai.js';
import internalRoutes from './routes/internal.js';
import billingRoutes from './routes/billing.js';
import { errorHandler } from './middleware/auth.js';
import { attachRealtime } from './realtime.js';
import { startCcxtWatches } from './lib/ccxtStream.js';
import { snapshot } from './lib/marketHub.js';

const app = express();
const PORT = Number(process.env.PORT || 4000);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
	res.json({ ok: true, service: 'apexslim-api', ts: new Date().toISOString(), market: snapshot() });
});

app.use('/api/auth', authRoutes);
app.use('/api/keys', apiKeyRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/bots', botRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/billing', billingRoutes);
app.use('/internal', internalRoutes);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = [
	path.resolve(__dirname, '../public'),
	path.resolve(__dirname, '../../complete-template/dist'),
].find((dir) => fs.existsSync(path.join(dir, 'index.html')));

if (distDir) {
	app.use(express.static(distDir));
	app.get(/^(?!\/api|\/socket\.io|\/internal).*/, (req, res) => {
		res.sendFile(path.join(distDir, 'index.html'));
	});
	console.log('Serving UI from', distDir);
} else {
	app.get('/', (req, res) => {
		res.status(200).type('html').send(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>APEXSlim</title>
<style>body{font-family:sans-serif;max-width:640px;margin:48px auto;color:#123}</style>
</head><body>
<h1>APEXSlim API ayakta</h1>
<p>Arayüz derlemesi bulunamadı (<code>complete-template/dist</code>).</p>
<p>VDS CMD:</p>
<pre>cd complete-template
npm install
npm run build
cd ..
pm2 restart all</pre>
<p>Sonra bu sayfayı yenile: arayüz <strong>/</strong> adresinde açılır.</p>
<p>API kontrol: <a href="/api/health">/api/health</a></p>
</body></html>`);
	});
	console.warn('UI build missing:', distDir);
}

app.use(errorHandler);

async function seedDemo() {
	if (db.get().users.length) return;
	const passwordHash = await bcrypt.hash('demo1234', 10);
	db.get().users.push({
		id: 'demo-user',
		email: 'demo@apexslim.dev',
		passwordHash,
		displayName: 'APEX Demo',
		role: 'trader',
		twoFaSecret: null,
		subscriptionTier: 'FREE',
		licenseExpiry: null,
		isActive: true,
		createdAt: new Date().toISOString(),
	});
	db.persist();
	console.log('Seeded demo user demo@apexslim.dev / demo1234');
}

const server = http.createServer(app);
attachRealtime(server);

seedDemo().then(async () => {
	if (process.env.API_MARKET_FEED !== '0') {
		const mode = await startCcxtWatches({ symbol: 'BTC/USDT:USDT', timeframe: '1m' });
		console.log('API market feed:', mode);
	}
	server.listen(PORT, '0.0.0.0', () => {
		console.log(`APEXSlim API+Socket.io on http://0.0.0.0:${PORT}`);
	});
});
