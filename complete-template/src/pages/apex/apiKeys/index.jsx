import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useForm } from 'react-hook-form';

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
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';

import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined';

import PageHeader from '@/components/pageHeader';
import CardHeader from '@/components/cardHeader';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

function ApiKeysPage() {
	const { notify } = useAuth();
	const [keys, setKeys] = useState([]);
	const [loading, setLoading] = useState(true);
	const { register, handleSubmit, reset } = useForm({
		defaultValues: {
			label: 'Binance Futures (testnet)',
			exchange: 'BINANCE_FUTURES',
			marketType: 'FUTURES',
			apiKey: '',
			apiSecret: '',
			passphrase: '',
			isTestnet: true,
		},
	});

	async function loadKeys() {
		try {
			const data = await api('/keys');
			setKeys(data.keys || []);
		} catch (err) {
			notify('API keys', err.message);
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		loadKeys();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const onSubmit = async (values) => {
		try {
			await api('/keys', { method: 'POST', body: { ...values, isTestnet: Boolean(values.isTestnet) } });
			notify('API keys', 'Encrypted and stored. Secret is never returned to the browser.', 'success');
			reset({ ...values, apiKey: '', apiSecret: '', passphrase: '' });
			await loadKeys();
		} catch (err) {
			notify('API keys', err.message);
		}
	};

	const verify = async (id) => {
		try {
			const data = await api(`/keys/${id}/verify`, { method: 'POST' });
			notify('Verify', data.message || 'Verified', 'success');
			await loadKeys();
		} catch (err) {
			notify('Exchange / rate-limit', err.message, 'warning');
			await loadKeys();
		}
	};

	const remove = async (id) => {
		try {
			await api(`/keys/${id}`, { method: 'DELETE' });
			notify('API keys', 'Key removed', 'success');
			await loadKeys();
		} catch (err) {
			notify('API keys', err.message);
		}
	};

	return (
		<>
			<PageHeader title="Exchange API Keys">
				<Breadcrumbs aria-label="breadcrumb" sx={{ textTransform: 'uppercase' }}>
					<Link underline="hover" component={RouterLink} to="/apex/dashboard">
						APEX
					</Link>
					<Typography color="text.tertiary">API Keys</Typography>
				</Breadcrumbs>
			</PageHeader>

			<Alert severity="warning" sx={{ mb: 3, boxShadow: 26 }}>
				Keys are encrypted with AES-256-GCM on the server. Withdraw permission is always disabled. Prefer testnet
				until you are ready for live trading.
			</Alert>

			{loading && <LinearProgress sx={{ mb: 2 }} />}

			<Grid container spacing={3}>
				<Grid item xs={12} md={5}>
					<Card>
						<CardContent>
							<CardHeader title="Add key" subtitle="JWT session required. Secrets never leave ciphertext." size="small" />
							<Stack component="form" spacing={2} onSubmit={handleSubmit(onSubmit)}>
								<TextField label="Label" fullWidth {...register('label', { required: true })} />
								<TextField select label="Exchange" fullWidth defaultValue="BINANCE_FUTURES" {...register('exchange')}>
									<MenuItem value="BINANCE">Binance Spot</MenuItem>
									<MenuItem value="BINANCE_FUTURES">Binance Futures</MenuItem>
									<MenuItem value="BYBIT">Bybit</MenuItem>
									<MenuItem value="OKX">OKX</MenuItem>
								</TextField>
								<TextField select label="Market" fullWidth defaultValue="FUTURES" {...register('marketType')}>
									<MenuItem value="SPOT">Spot</MenuItem>
									<MenuItem value="FUTURES">Futures</MenuItem>
								</TextField>
								<TextField label="API Key" fullWidth autoComplete="off" {...register('apiKey', { required: true })} />
								<TextField
									label="API Secret"
									type="password"
									fullWidth
									autoComplete="new-password"
									{...register('apiSecret', { required: true })}
								/>
								<TextField label="Passphrase (optional)" fullWidth {...register('passphrase')} />
								<FormControlLabel control={<Switch defaultChecked {...register('isTestnet')} />} label="Testnet" />
								<Button type="submit" variant="contained" sx={{ textTransform: 'uppercase', width: 'fit-content' }}>
									Encrypt & save
								</Button>
							</Stack>
						</CardContent>
					</Card>
				</Grid>
				<Grid item xs={12} md={7}>
					<Card>
						<CardContent>
							<CardHeader title="Stored keys" subtitle="Masked public identifiers only" size="small" />
							<Table size="small">
								<TableHead>
									<TableRow>
										<TableCell>Label</TableCell>
										<TableCell>Exchange</TableCell>
										<TableCell>Key</TableCell>
										<TableCell>Status</TableCell>
										<TableCell align="right">Actions</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{keys.map((k) => (
										<TableRow key={k.id} hover>
											<TableCell>{k.label}</TableCell>
											<TableCell>
												{k.exchange} / {k.marketType}
											</TableCell>
											<TableCell>{k.apiKeyMasked}</TableCell>
											<TableCell>
												<Stack direction="row" spacing={1}>
													<Chip size="small" label={k.isTestnet ? 'testnet' : 'live'} color={k.isTestnet ? 'warning' : 'error'} />
													<Chip
														size="small"
														label={k.lastVerifiedAt ? 'verified' : 'unverified'}
														color={k.lastVerifiedAt && !k.lastError ? 'success' : 'default'}
													/>
												</Stack>
												{k.lastError && (
													<Typography variant="caption" color="error">
														{k.lastError}
													</Typography>
												)}
											</TableCell>
											<TableCell align="right">
												<IconButton color="primary" onClick={() => verify(k.id)} aria-label="verify">
													<VerifiedOutlinedIcon />
												</IconButton>
												<IconButton color="error" onClick={() => remove(k.id)} aria-label="delete">
													<DeleteOutlineIcon />
												</IconButton>
											</TableCell>
										</TableRow>
									))}
									{!keys.length && (
										<TableRow>
											<TableCell colSpan={5}>
												<Typography color="text.secondary">No keys yet.</Typography>
											</TableCell>
										</TableRow>
									)}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				</Grid>
			</Grid>
		</>
	);
}

export default ApiKeysPage;
