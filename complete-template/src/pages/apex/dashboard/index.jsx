import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Chart from 'react-apexcharts';
import getDefaultChartsColors from '@helpers/getDefaultChartsColors';

import Typography from '@mui/material/Typography';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import LinearProgress from '@mui/material/LinearProgress';
import Alert from '@mui/material/Alert';

import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import TrendingDownOutlinedIcon from '@mui/icons-material/TrendingDownOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import KeyOutlinedIcon from '@mui/icons-material/KeyOutlined';

import PageHeader from '@/components/pageHeader';
import CardHeader from '@/components/cardHeader';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

const STAT_ICONS = [
	{ color: 'secondary.main', Icon: AccountBalanceWalletOutlinedIcon, name: 'Equity (USD)' },
	{ color: 'success.main', Icon: TrendingUpOutlinedIcon, name: 'Unrealized PNL' },
	{ color: 'cuaternary.main', Icon: TrendingDownOutlinedIcon, name: 'Realized PNL' },
	{ color: 'tertiary.400', Icon: ShieldOutlinedIcon, name: 'Hedge ratio' },
];

function formatUsd(n) {
	return Number(n || 0).toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}

function ApexDashboardPage() {
	const { user, notify } = useAuth();
	const [data, setData] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;
		async function load() {
			try {
				const payload = await api('/portfolio');
				if (!cancelled) setData(payload);
			} catch (err) {
				notify('Portfolio', err.message, err.code === 'NETWORK' ? 'error' : 'warning');
			} finally {
				if (!cancelled) setLoading(false);
			}
		}
		load();
		return () => {
			cancelled = true;
		};
	}, [notify]);

	const stats = data
		? [data.equityUsd, data.unrealizedPnl, data.realizedPnl, `${Math.round((data.hedgeRatio || 0) * 100)}%`]
		: ['—', '—', '—', '—'];

	return (
		<>
			<PageHeader title="APEX Portfolio">
				<Breadcrumbs aria-label="breadcrumb" sx={{ textTransform: 'uppercase' }}>
					<Link underline="hover" component={RouterLink} to="/apex/dashboard">
						APEX
					</Link>
					<Typography color="text.tertiary">Dashboard</Typography>
				</Breadcrumbs>
			</PageHeader>

			{loading && <LinearProgress sx={{ mb: 2 }} />}

			<Alert severity="info" sx={{ mb: 3, boxShadow: 26 }}>
				Signed in as {user?.email}. Demo credentials: demo@apexslim.dev / demo1234. Live exchange fills require a
				verified API key.
			</Alert>

			<Stack spacing={3}>
				<Grid
					container
					sx={{
						borderRadius: 1,
						overflow: 'hidden',
						bgcolor: 'background.paper',
						boxShadow: 26,
						'--Grid-borderWidth': '1px',
						borderTop: 'var(--Grid-borderWidth) solid',
						borderLeft: 'var(--Grid-borderWidth) solid',
						borderColor: 'border',
						'& > div': {
							borderRight: 'var(--Grid-borderWidth) solid',
							borderBottom: 'var(--Grid-borderWidth) solid',
							borderColor: 'border',
						},
					}}
				>
					{STAT_ICONS.map((stat, i) => (
						<Grid item xs={12} sm={6} md={3} key={stat.name}>
							<Stack p={3} direction="row" spacing={3} alignItems="center">
								<stat.Icon sx={{ fontSize: 60, color: stat.color }} color="disabled" />
								<span>
									<Typography color={stat.color} variant="h5" textTransform="uppercase">
										{stat.name}
									</Typography>
									<Typography fontSize={26}>{stats[i]}</Typography>
								</span>
							</Stack>
						</Grid>
					))}
				</Grid>

				<Grid container spacing={3}>
					<Grid item xs={12} md={8}>
						<Card>
							<CardContent>
								<CardHeader title="Equity curve" subtitle="14-day paper / synced wallet equity" size="small" />
								{data?.equityHistory && (
									<Chart
										type="area"
										height={280}
										options={{
											colors: getDefaultChartsColors(1),
											chart: { toolbar: { show: false }, parentHeightOffset: 0 },
											stroke: { width: 2 },
											dataLabels: { enabled: false },
											xaxis: { categories: data.equityHistory.map((p) => p.t) },
											yaxis: { labels: { formatter: (v) => `$${v}` } },
											grid: { borderColor: 'transparent' },
										}}
										series={[{ name: 'Equity', data: data.equityHistory.map((p) => p.v) }]}
									/>
								)}
							</CardContent>
						</Card>
					</Grid>
					<Grid item xs={12} md={4}>
						<Card sx={{ height: '100%' }}>
							<CardContent>
								<CardHeader title="Connection" subtitle="Exchange & WebSocket" size="small" />
								<Stack spacing={2}>
									<Chip
										label={`WS ${data?.connection?.ws || 'unknown'}`}
										color={data?.connection?.ws === 'connected' ? 'success' : 'warning'}
										variant="outlined"
									/>
									<Typography variant="body2" color="text.secondary">
										{data?.connection?.note}
									</Typography>
									<Typography variant="body2">
										Linked keys: <strong>{data?.apiKeysLinked ?? 0}</strong>
									</Typography>
									<Button
										component={RouterLink}
										to="/apex/api-keys"
										variant="outlined"
										startIcon={<KeyOutlinedIcon />}
										sx={{ width: 'fit-content', textTransform: 'uppercase' }}
									>
										Manage API keys
									</Button>
								</Stack>
							</CardContent>
						</Card>
					</Grid>
				</Grid>

				<Card>
					<CardContent>
						<CardHeader title="Open positions" subtitle="Unrealized PNL, leverage, TP/SL" size="small" />
						<Table size="small">
							<TableHead>
								<TableRow>
									<TableCell>Symbol</TableCell>
									<TableCell>Side</TableCell>
									<TableCell align="right">Lev</TableCell>
									<TableCell align="right">Entry</TableCell>
									<TableCell align="right">Mark</TableCell>
									<TableCell align="right">Qty</TableCell>
									<TableCell align="right">uPNL</TableCell>
									<TableCell align="right">Hedge</TableCell>
									<TableCell>TP / SL</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{(data?.openPositions || []).map((p) => (
									<TableRow key={p.id} hover>
										<TableCell>{p.symbol}</TableCell>
										<TableCell>
											<Chip
												size="small"
												label={p.side}
												color={p.side === 'LONG' || p.side === 'BUY' ? 'success' : 'error'}
											/>
										</TableCell>
										<TableCell align="right">{p.leverage}x</TableCell>
										<TableCell align="right">{p.entryPrice}</TableCell>
										<TableCell align="right">{p.markPrice}</TableCell>
										<TableCell align="right">{p.quantity}</TableCell>
										<TableCell align="right">{formatUsd(p.unrealizedPnl)}</TableCell>
										<TableCell align="right">{Math.round((p.hedgeRatio || 0) * 100)}%</TableCell>
										<TableCell>
											{p.takeProfit} / {p.stopLoss}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</CardContent>
				</Card>

				<Card>
					<CardContent>
						<CardHeader title="Wallet balances" subtitle="Free / locked / USD equity" size="small" />
						<Table size="small">
							<TableHead>
								<TableRow>
									<TableCell>Asset</TableCell>
									<TableCell align="right">Free</TableCell>
									<TableCell align="right">Locked</TableCell>
									<TableCell align="right">Equity USD</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{(data?.wallets || []).map((w) => (
									<TableRow key={w.asset} hover>
										<TableCell>{w.asset}</TableCell>
										<TableCell align="right">{w.free}</TableCell>
										<TableCell align="right">{w.locked}</TableCell>
										<TableCell align="right">{formatUsd(w.equityUsd)}</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			</Stack>
		</>
	);
}

export default ApexDashboardPage;
