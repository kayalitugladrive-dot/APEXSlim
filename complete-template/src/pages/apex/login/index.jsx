import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { useAuth } from '@/context/AuthContext';

function ApexLoginPage() {
	const { login, register } = useAuth();
	const navigate = useNavigate();
	const [mode, setMode] = useState('login');
	const [email, setEmail] = useState('demo@apexslim.dev');
	const [password, setPassword] = useState('demo1234');
	const [displayName, setDisplayName] = useState('');
	const [busy, setBusy] = useState(false);

	const submit = async (e) => {
		e.preventDefault();
		setBusy(true);
		try {
			if (mode === 'login') await login(email, password);
			else await register({ email, password, displayName });
			navigate('/apex/dashboard');
		} catch {
			/* snackbar via AuthContext */
		} finally {
			setBusy(false);
		}
	};

	return (
		<Box minHeight="70vh" display="flex" alignItems="center" justifyContent="center">
			<Card sx={{ width: 420, boxShadow: 26 }}>
				<CardContent>
					<Typography variant="h4" textTransform="uppercase" mb={1}>
						APEXSlim
					</Typography>
					<Typography color="text.secondary" mb={3}>
						Crypto desk — JWT session
					</Typography>
					<Stack component="form" spacing={2} onSubmit={submit}>
						{mode === 'register' && (
							<TextField label="Display name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
						)}
						<TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
						<TextField
							label="Password"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
						/>
						<Button type="submit" variant="contained" disabled={busy} sx={{ textTransform: 'uppercase' }}>
							{mode === 'login' ? 'Sign in' : 'Create account'}
						</Button>
						<Button
							type="button"
							onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
							sx={{ textTransform: 'uppercase' }}
						>
							{mode === 'login' ? 'Need an account?' : 'Have an account?'}
						</Button>
					</Stack>
				</CardContent>
			</Card>
		</Box>
	);
}

export default ApexLoginPage;
