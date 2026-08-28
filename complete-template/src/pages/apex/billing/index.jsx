import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Typography from '@mui/material/Typography';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
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

function BillingPage() {
	const { notify, user } = useAuth();
	const [plans, setPlans] = useState([]);
	const [me, setMe] = useState(null);

	const load = async () => {
		try {
			const p = await api('/billing/plans', { auth: false });
			setPlans(p.plans || []);
			const m = await api('/billing/me');
			setMe(m);
		} catch (err) {
			notify('Billing', err.message);
		}
	};

	useEffect(() => {
		load();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const buy = async (planId) => {
		try {
			const data = await api('/billing/checkout', { method: 'POST', body: { plan: planId } });
			notify('Shopier', `Order ${data.payment.platformOrderId} created`, 'success');
			const sim = await api('/billing/sandbox-complete', {
				method: 'POST',
				body: { platformOrderId: data.payment.platformOrderId },
			});
			notify('License', `${sim.subscriptionTier} until ${sim.licenseExpiry}`, 'success');
			load();
		} catch (err) {
			notify('Shopier', err.message);
		}
	};

	return (
		<>
			<PageHeader title="SaaS billing">
				<Breadcrumbs aria-label="breadcrumb" sx={{ textTransform: 'uppercase' }}>
					<Link underline="hover" component={RouterLink} to="/apex/dashboard">
						APEX
					</Link>
					<Typography color="text.tertiary">Billing</Typography>
				</Breadcrumbs>
			</PageHeader>

			<Alert severity={me?.active ? 'success' : 'warning'} sx={{ mb: 3, boxShadow: 26 }}>
				{user?.email} · tier {me?.subscriptionTier || 'FREE'} · expiry {me?.licenseExpiry || 'n/a'} ·{' '}
				{me?.active ? 'license active' : 'upgrade required for bots & AI'}
			</Alert>

			<Grid container spacing={3} mb={3}>
				{plans.map((plan) => (
					<Grid item xs={12} md={4} key={plan.id}>
						<Card sx={{ height: '100%' }}>
							<CardContent>
								<CardHeader title={plan.name} subtitle={`${plan.priceTry} TRY / ${plan.days || 0} days`} size="small" />
								<Stack spacing={1} mb={2}>
									{plan.features.map((f) => (
										<Typography key={f} variant="body2">
											• {f}
										</Typography>
									))}
								</Stack>
								{plan.id === 'FREE' ? (
									<Chip label="Current floor" />
								) : (
									<Button variant="contained" onClick={() => buy(plan.id)} sx={{ textTransform: 'uppercase' }}>
										Pay with Shopier
									</Button>
								)}
							</CardContent>
						</Card>
					</Grid>
				))}
			</Grid>

			<Card>
				<CardContent>
					<CardHeader title="Payment log" subtitle="Shopier webhook / sandbox" size="small" />
					<Table size="small">
						<TableHead>
							<TableRow>
								<TableCell>Order</TableCell>
								<TableCell>Plan</TableCell>
								<TableCell>Status</TableCell>
								<TableCell align="right">TRY</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{(me?.payments || []).map((p) => (
								<TableRow key={p.id}>
									<TableCell>{p.platformOrderId}</TableCell>
									<TableCell>{p.plan}</TableCell>
									<TableCell>
										<Chip size="small" label={p.status} color={p.status === 'SUCCESS' ? 'success' : 'default'} />
									</TableCell>
									<TableCell align="right">{p.amountTry}</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		</>
	);
}

export default BillingPage;
