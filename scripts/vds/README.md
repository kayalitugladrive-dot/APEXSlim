# Windows VDS — PM2 7/24

Repo is Vite + Express (not Next.js). PM2 runs:

| App | Script | Memory cap | Logs |
|---|---|---|---|
| `apexslim-api` | `server/src/index.js` | 512M | `logs/api-*.log` |
| `apexslim-engine` | `server/src/engine/index.js` | 768M | `logs/engine-*.log` |

Both have `autorestart`, restart delay, and exponential backoff.

## One-time (Administrator CMD)

```bat
npm install -g pm2
npm install -g pm2-windows-startup
cd server && npm install --omit=dev
cd ..\complete-template && npm install && npm run build
cd ..
mkdir logs
pm2 start ecosystem.config.js
pm2 save
pm2-startup install
```

Or double-click:

1. `scripts\vds\install-pm2.bat`
2. `scripts\vds\start-pm2.bat`
3. `scripts\vds\enable-startup.bat` (as Admin)

## Daily

```bat
pm2 status
pm2 logs apexslim-engine
pm2 restart all
```
