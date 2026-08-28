import { useEffect, useMemo, useState } from 'react';
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
import Slider from '@mui/material/Slider';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

import PageHeader from '@/components/pageHeader';
import CardHeader from '@/components/cardHeader';
import { api } from '@/services/api';
import { getMarketSocket } from '@/services/socket';
import { useAuth } from '@/context/AuthContext';
import KlineChart from './KlineChart';

function TerminalPage() {
	const { notify } = useAuth();
	const [symbol, setSymbol] = useState('BTCUSDT');
	const [interval, setInterval] = useState('15m');
	const [marketType, setMarketType] = useState('FUTURES');
	const [candles, setCandles] = useState([]);
	const [live, setLive] = useState(null);
	const [wsState, setWsState] = useState('idle');
	const [feedSource, setFeedSource] = useState('—');
	const [ticker, setTicker] = useState(null);
	const [book, setBook] = useState({ bids: [], asks: [] });
	const [side, setSide] = useState('LONG');
	const [leverage, setLeverage] = useState(5);
	const [qty, setQty] = useState('0.01');
	const [tp, setTp] = useState('');
	const [sl, setSl] = useState('');
	const [metrics, setMetrics] = useState(null);
	const [advice, setAdvice] = useState('');

	useEffect(() => {
		let cancelled = false;
		api(`/market/klines?symbol=${symbol}&interval=${interval}`)
			.then((d) => {
				if (!cancelled) setCandles(d.candles || []);
			})
			.catch((err) => notify('Kline history', err.message, 'warning'));
		api(`/market/metrics?symbol=${symbol}`)
			.then((d) => {
				if (!cancelled) setMetrics(d);
			})
			.catch((err) => notify('Metrics', err.message, 'warning'));
		return () => {
			cancelled = true;
		};
	}, [symbol, interval, notify]);

	useEffect(() => {
		const socket = getMarketSocket();
		const onConnect = () => setWsState('connected');
		const onDisconnect = () => {
			setWsState('reconnecting');
			notify('Socket.io', 'Feed dropped — auto reconnect', 'warning');
		};
		const onKline = (payload) => {
			if (!payload?.candle) return;
			setFeedSource(payload.source || 'ccxt');
			setLive(payload.candle);
		};
		const onTicker = (payload) => {
			setTicker(payload);
			setFeedSource(payload.source || 'ccxt');
		};
		const onBook = (payload) => setBook({ bids: payload.bids || [], asks: payload.asks || [] });
		const onStatus = (payload) => {
			if (payload?.state === 'reconnecting') {
				setWsState('reconnecting');
				notify('CCXT', payload.error || 'watch_* reconnect', 'warning');
			}
		};

		socket.on('connect', onConnect);
		socket.on('disconnect', onDisconnect);
		socket.on('market:kline', onKline);
		socket.on('market:ticker', onTicker);
		socket.on('market:orderbook', onBook);
		socket.on('market:status', onStatus);
		if (socket.connected) setWsState('connected');
		else {
			setWsState('connecting');
			socket.connect();
		}

		return () => {
			socket.off('connect', onConnect);
			socket.off('disconnect', onDisconnect);
			socket.off('market:kline', onKline);
			socket.off('market:ticker', onTicker);
			socket.off('market:orderbook', onBook);
			socket.off('market:status', onStatus);
		};
	}, [notify]);

	const lastClose = useMemo(
		() => live?.close || ticker?.last || candles[candles.length - 1]?.close,
		[live, ticker, candles],
	);

	const submitOrder = async () => {
		try {
			const data = await api('/orders', {
				method: 'POST',
				body: {
					symbol,
					side,
					type: 'MARKET',
					quantity: Number(qty),
					leverage,
					takeProfit: tp ? Number(tp) : null,
					stopLoss: sl ? Number(sl) : null,
					marketType,
					price: lastClose,
				},
			});
			notify('Order', `${data.order.side} ${data.order.symbol} paper-filled`, 'success');
		} catch (err) {
			notify('Order', err.message);
		}
	};

	const askAi = async () => {
		try {
			const data = await api('/ai/advise', {
				method: 'POST',
				body: { symbol, interval, lastClose },
			});
			setAdvice(data.advice);
		} catch (err) {
			notify('AI', err.message);
		}
	};

	return (
		<>
			<PageHeader title="Trading Terminal">
				<Breadcrumbs aria-label="breadcrumb" sx={{ textTransform: 'uppercase' }}>
					<Link underline="hover" component={RouterLink} to="/apex/dashboard">
						APEX
					</Link>
					<Typography color="text.tertiary">Terminal</Typography>
				</Breadcrumbs>
			</PageHeader>

			<Stack direction="row" spacing={2} mb={2} flexWrap="wrap" alignItems="center">
				<TextField select size="small" label="Symbol" value={symbol} onChange={(e) => setSymbol(e.target.value)}>
					<MenuItem value="BTCUSDT">BTCUSDT</MenuItem>
					<MenuItem value="ETHUSDT">ETHUSDT</MenuItem>
					<MenuItem value="SOLUSDT">SOLUSDT</MenuItem>
				</TextField>
				<TextField select size="small" label="TF" value={interval} onChange={(e) => setInterval(e.target.value)}>
					<MenuItem value="1m">1m</MenuItem>
					<MenuItem value="5m">5m</MenuItem>
					<MenuItem value="15m">15m</MenuItem>
					<MenuItem value="1h">1h</MenuItem>
				</TextField>
				<Chip label={`Socket.io ${wsState}`} color={wsState === 'connected' ? 'success' : 'warning'} />
				<Chip label={feedSource} size="small" variant="outlined" />
				<Chip label={lastClose ? `Mark ${lastClose}` : '—'} />
			</Stack>

			<Grid container spacing={3}>
				<Grid item xs={12} lg={8}>
					<Card>
						<CardContent>
							<CardHeader
								title={`${symbol} ${interval}`}
								subtitle="History REST · live push via engine CCXT → Socket.io"
								size="small"
							/>
							<KlineChart candles={candles} live={live} />
						</CardContent>
					</Card>
				</Grid>
				<Grid item xs={12} lg={4}>
					<Card>
						<CardContent>
							<CardHeader title="Order ticket" subtitle="Spot / Futures · TP/SL" size="small" />
							<Stack spacing={2}>
								<ToggleButtonGroup
									exclusive
									fullWidth
									value={marketType}
									onChange={(_, v) => v && setMarketType(v)}
								>
									<ToggleButton value="SPOT">Spot</ToggleButton>
									<ToggleButton value="FUTURES">Futures</ToggleButton>
								</ToggleButtonGroup>
								<ToggleButtonGroup exclusive fullWidth value={side} onChange={(_, v) => v && setSide(v)}>
									<ToggleButton value="LONG" color="success">
										Long
									</ToggleButton>
									<ToggleButton value="SHORT" color="error">
										Short
									</ToggleButton>
								</ToggleButtonGroup>
								<Typography variant="caption">Leverage {leverage}x</Typography>
								<Slider min={1} max={50} value={leverage} onChange={(_, v) => setLeverage(v)} />
								<TextField label="Quantity" value={qty} onChange={(e) => setQty(e.target.value)} />
								<TextField label="Take profit" value={tp} onChange={(e) => setTp(e.target.value)} />
								<TextField label="Stop loss" value={sl} onChange={(e) => setSl(e.target.value)} />
								<Button variant="contained" onClick={submitOrder} sx={{ textTransform: 'uppercase' }}>
									Submit {side}
								</Button>
							</Stack>
						</CardContent>
					</Card>
				</Grid>
				<Grid item xs={12} md={4}>
					<Card>
						<CardContent>
							<CardHeader title="Order book" subtitle="watchOrderBook" size="small" />
							<Table size="small">
								<TableHead>
									<TableRow>
										<TableCell>Bid</TableCell>
										<TableCell align="right">Ask</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{Array.from({ length: 8 }).map((_, i) => (
										<TableRow key={i}>
											<TableCell sx={{ color: 'success.main' }}>
												{book.bids[i] ? `${book.bids[i][0]} × ${book.bids[i][1]}` : '—'}
											</TableCell>
											<TableCell align="right" sx={{ color: 'error.main' }}>
												{book.asks[i] ? `${book.asks[i][0]} × ${book.asks[i][1]}` : '—'}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				</Grid>
				<Grid item xs={12} md={4}>
					<Card>
						<CardContent>
							<CardHeader title="Long/Short & liquidations" subtitle="Smart money map" size="small" />
							<Typography mb={1}>LS ratio {metrics?.longShortRatio ?? '—'}</Typography>
							<Typography mb={2}>Funding {metrics?.fundingRate ?? '—'}</Typography>
							{(metrics?.liquidationMap || []).map((row) => (
								<Typography key={row.price} variant="body2">
									{row.side} liq {row.price} · ${row.usd.toLocaleString()}
								</Typography>
							))}
							<Stack mt={2} spacing={0.5}>
								{(metrics?.smartMoney || []).map((s) => (
									<Chip key={s.level} label={`${s.type} ${s.level}`} size="small" />
								))}
							</Stack>
						</CardContent>
					</Card>
				</Grid>
				<Grid item xs={12} md={4}>
					<Card>
						<CardContent>
							<CardHeader title="AI assistant" subtitle="Gemini when GEMINI_API_KEY is set" size="small" />
							<Button variant="outlined" onClick={askAi} sx={{ textTransform: 'uppercase', mb: 2 }}>
								Analyze chart
							</Button>
							{advice && <Alert severity="info">{advice}</Alert>}
						</CardContent>
					</Card>
				</Grid>
			</Grid>
		</>
	);
}

export default TerminalPage;
