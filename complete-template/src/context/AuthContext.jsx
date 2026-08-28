import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, clearSession, getToken, setSession } from '@/services/api';
import enqueueSnackbar from '@/components/snackbar';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);

	const notify = (title, message, severity = 'error') => {
		enqueueSnackbar(message, {
			variant: 'muiSnackbar',
			severity,
			title,
		});
	};

	useEffect(() => {
		let cancelled = false;
		async function boot() {
			if (!getToken()) {
				setLoading(false);
				return;
			}
			try {
				const data = await api('/auth/me');
				if (!cancelled) setUser(data.user);
			} catch (err) {
				clearSession();
				if (!cancelled) {
					setUser(null);
					notify('Session', err.message, 'warning');
				}
			} finally {
				if (!cancelled) setLoading(false);
			}
		}
		boot();
		return () => {
			cancelled = true;
		};
	}, []);

	const login = useCallback(async (email, password) => {
		const data = await api('/auth/login', { method: 'POST', body: { email, password }, auth: false });
		setSession(data);
		setUser(data.user);
		notify('Welcome', `Signed in as ${data.user.email}`, 'success');
		return data.user;
	}, []);

	const register = useCallback(async (payload) => {
		const data = await api('/auth/register', { method: 'POST', body: payload, auth: false });
		setSession(data);
		setUser(data.user);
		notify('Account', 'Registration complete', 'success');
		return data.user;
	}, []);

	const logout = useCallback(() => {
		api('/auth/logout', { method: 'POST' }).catch(() => {});
		clearSession();
		setUser(null);
	}, []);

	const value = useMemo(
		() => ({ user, loading, login, register, logout, notify }),
		[user, loading, login, register, logout],
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error('useAuth must be used within AuthProvider');
	return ctx;
}
