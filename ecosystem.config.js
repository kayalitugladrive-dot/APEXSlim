/**
 * PM2 process file for Windows VDS 24/7.
 * Usage:  pm2 start ecosystem.config.js
 *
 * Apps:
 *  - apexslim-api     Express + Socket.io (HTTP API; Vite SPA is reverse-proxied or served from dist)
 *  - apexslim-engine  Decoupled trading engine (CCXT watches + bot/risk loop)
 */
const path = require('path');

const ROOT = __dirname;
const LOGS = path.join(ROOT, 'logs');

module.exports = {
	apps: [
		{
			name: 'apexslim-api',
			cwd: path.join(ROOT, 'server'),
			script: 'src/index.js',
			interpreter: 'node',
			instances: 1,
			exec_mode: 'fork',
			watch: false,
			autorestart: true,
			max_restarts: 50,
			min_uptime: '10s',
			restart_delay: 4000,
			exp_backoff_restart_delay: 1000,
			max_memory_restart: '512M',
			kill_timeout: 5000,
			listen_timeout: 10000,
			error_file: path.join(LOGS, 'api-error.log'),
			out_file: path.join(LOGS, 'api-out.log'),
			log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
			merge_logs: true,
			env: {
				NODE_ENV: 'production',
				PORT: 4000,
				API_MARKET_FEED: '1',
			},
		},
		{
			name: 'apexslim-engine',
			cwd: path.join(ROOT, 'server'),
			script: 'src/engine/index.js',
			interpreter: 'node',
			instances: 1,
			exec_mode: 'fork',
			watch: false,
			autorestart: true,
			max_restarts: 80,
			min_uptime: '5s',
			restart_delay: 5000,
			exp_backoff_restart_delay: 2000,
			max_memory_restart: '768M',
			kill_timeout: 8000,
			error_file: path.join(LOGS, 'engine-error.log'),
			out_file: path.join(LOGS, 'engine-out.log'),
			log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
			merge_logs: true,
			env: {
				NODE_ENV: 'production',
				API_INTERNAL: 'http://127.0.0.1:4000',
				INTERNAL_SECRET: 'apex-internal',
			},
		},
	],
};
