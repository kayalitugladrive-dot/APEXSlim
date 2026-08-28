const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export function getToken() {
	return localStorage.getItem('apex_token');
}

export function getRefreshToken() {
	return localStorage.getItem('apex_refresh');
}

export function setToken(token) {
	if (token) localStorage.setItem('apex_token', token);
	else localStorage.removeItem('apex_token');
}

export function setRefreshToken(token) {
	if (token) localStorage.setItem('apex_refresh', token);
	else localStorage.removeItem('apex_refresh');
}

export function setSession({ accessToken, refreshToken, token }) {
	setToken(accessToken || token);
	if (refreshToken) setRefreshToken(refreshToken);
}

export function clearSession() {
	setToken(null);
	setRefreshToken(null);
}

async function refreshAccess() {
	const refreshToken = getRefreshToken();
	if (!refreshToken) return null;
	const res = await fetch(`${API_BASE}/auth/refresh`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ refreshToken }),
	});
	if (!res.ok) {
		clearSession();
		return null;
	}
	const data = await res.json();
	setSession(data);
	return data.accessToken || data.token;
}

export async function api(path, { method = 'GET', body, auth = true } = {}) {
	const headers = { 'Content-Type': 'application/json' };
	if (auth && getToken()) headers.Authorization = `Bearer ${getToken()}`;
	let res;
	try {
		res = await fetch(`${API_BASE}${path}`, {
			method,
			headers,
			body: body ? JSON.stringify(body) : undefined,
		});
	} catch {
		const error = new Error('Network or WebSocket gateway unreachable');
		error.code = 'NETWORK';
		throw error;
	}
	if (res.status === 401 && auth) {
		const next = await refreshAccess();
		if (next) {
			headers.Authorization = `Bearer ${next}`;
			res = await fetch(`${API_BASE}${path}`, {
				method,
				headers,
				body: body ? JSON.stringify(body) : undefined,
			});
		}
	}
	const data = await res.json().catch(() => ({}));
	if (!res.ok) {
		const error = new Error(data.error || `Request failed (${res.status})`);
		error.code = data.code || `HTTP_${res.status}`;
		error.status = res.status;
		throw error;
	}
	return data;
}
