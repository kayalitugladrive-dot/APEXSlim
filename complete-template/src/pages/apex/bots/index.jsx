import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Typography from '@mui/material/Typography';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

import PageHeader from '@/components/pageHeader';
import CardHeader from '@/components/cardHeader';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

function BotsPage() {
	const { notify } = useAuth();
	const [bots, setBots] = useState([]);
	const [engine, setEngine] = useState(null);
	const [logs, setLogs] = useState([]);
	const [form, setForm] = useState({
		name: 'RSI BTC',
		symbol: 'BTCUSDT',
		leverage: 5,
		side: 'BOTH',
		takeProfitPct: 1.5,
		stopLossPct: 1,
		indicator: 'RSI',
		riskModel: { type: 'collective_amortization', triggerPct: 1, stepPct: 0.25, hedgeRatio: 1 },
	});

	const load = async () => {
		try {
			const data = await api('/bots');
			setBots(data.bots || []);
			setEngine(data.engine);
			const l = await api('/bots/logs/recent');
			setLogs(l.logs || []);
		} catch (err) {
			notify('Bots', err.message);
		}
	};

	useEffect(() => {
		load();
		const id = setInterval(load, 8000);
		return () => clearInterval(id);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const create = async (e) => {
		e.preventDefault();
		try {
			await api('/bots', { method: 'POST', body: form });
			notify('Bots', 'Config saved for the engine', 'success');
			load();
		} catch (err) {
			notify('Bots', err.message);
		}
	};

	const act = async (id, action) => {
		try {
			await api(`/bots/${id}/${action}`, { method: 'POST' });
			notify('Engine', `Command ${action} queued`, 'success');
			load();
		} catch (err) {
			notify('Engine', err.message);
		}
	};

	return (
		<>
			<PageHeader title="Bot dashboard">
				<Breadcrumbs aria-label="breadcrumb" sx={{ textTransform: 'uppercase' }}>
					<Link underline="hover" component={RouterLink} to="/apex/dashboard">
						APEX
					</Link>
					<Typography color="text.tertiary">Bots</Typography>
				</Breadcrumbs>
			</PageHeader>

			<Alert severity="info" sx={{ mb: 3, boxShadow: 26 }}>
				Engine heartbeat: {engine?.ts || 'offline'} · WS {engine?.ws || 'n/a'} · active {engine?.activeBots ?? 0}.
				Start with server/scripts/start-engine.bat on a VDS.
			</Alert>

			<Grid container spacing={3}>
				<Grid item xs={12} md={4}>
					<Card>
						<CardContent>
							<CardHeader title="New bot" subtitle="Symbol, leverage, TP/SL, indicator" size="small" />
							<Stack component="form" spacing={2} onSubmit={create}>
								<TextField
									label="Name"
									value={form.name}
									onChange={(e) => setForm({ ...form, name: e.target.value })}
								/>
								<TextField
									label="Symbol"
									value={form.symbol}
									onChange={(e) => setForm({ ...form, symbol: e.target.value })}
								/>
								<TextField
									label="Leverage"
									type="number"
									value={form.leverage}
									onChange={(e) => setForm({ ...form, leverage: Number(e.target.value) })}
								/>
								<TextField
									select
									label="Side"
									value={form.side}
									onChange={(e) => setForm({ ...form, side: e.target.value })}
								>
									<MenuItem value="LONG">Long</MenuItem>
									<MenuItem value="SHORT">Short</MenuItem>
									<MenuItem value="BOTH">Both</MenuItem>
								</TextField>
								<TextField
									select
									label="Indicator"
									value={form.indicator}
									onChange={(e) => setForm({ ...form, indicator: e.target.value })}
								>
									<MenuItem value="RSI">RSI</MenuItem>
									<MenuItem value="MACD">MACD</MenuItem>
									<MenuItem value="SMART_MONEY">Smart Money</MenuItem>
								</TextField>
								<TextField
									label="TP %"
									type="number"
									value={form.takeProfitPct}
									onChange={(e) => setForm({ ...form, takeProfitPct: Number(e.target.value) })}
								/>
								<TextField
									label="SL %"
									type="number"
									value={form.stopLossPct}
									onChange={(e) => setForm({ ...form, stopLossPct: Number(e.target.value) })}
								/>
								<Button type="submit" variant="contained" sx={{ textTransform: 'uppercase' }}>
									Save config
								</Button>
							</Stack>
						</CardContent>
					</Card>
				</Grid>
				<Grid item xs={12} md={8}>
					<Card>
						<CardContent>
							<CardHeader title="Configs" subtitle="Start/stop signals the decoupled engine" size="small" />
							<Table size="small">
								<TableHead>
									<TableRow>
										<TableCell>Name</TableCell>
										<TableCell>Symbol</TableCell>
										<TableCell>Lev</TableCell>
										<TableCell>Status</TableCell>
										<TableCell align="right">Actions</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{bots.map((b) => (
										<TableRow key={b.id} hover>
											<TableCell>{b.name}</TableCell>
											<TableCell>
												{b.symbol} · {b.indicator}
											</TableCell>
											<TableCell>{b.leverage}x</TableCell>
											<TableCell>
												<Chip
													size="small"
													label={b.status}
													color={b.status === 'RUNNING' ? 'success' : 'default'}
												/>
											</TableCell>
											<TableCell align="right">
												<Button size="small" onClick={() => act(b.id, 'start')}>
													Start
												</Button>
												<Button size="small" color="warning" onClick={() => act(b.id, 'stop')}>
													Stop
												</Button>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
					<Card sx={{ mt: 3 }}>
						<CardContent>
							<CardHeader title="Engine trade logs" size="small" />
							<Table size="small">
								<TableHead>
									<TableRow>
										<TableCell>Time</TableCell>
										<TableCell>Symbol</TableCell>
										<TableCell>Note</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{logs.map((l) => (
										<TableRow key={l.id}>
											<TableCell>{l.timestamp}</TableCell>
											<TableCell>{l.symbol}</TableCell>
											<TableCell>{l.note || l.side}</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				</Grid>
			</Grid>
		</>
	);
}

export default BotsPage;
