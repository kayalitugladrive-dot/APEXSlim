/** In-process fan-out used by Socket.io and the engine ingest route. */
const listeners = new Set();
let last = { ticker: null, kline: null, orderbook: null, source: 'idle' };

export function subscribe(fn) {
	listeners.add(fn);
	return () => listeners.delete(fn);
}

export function publish(event, payload) {
	last[event] = payload;
	last.source = payload?.source || last.source;
	listeners.forEach((fn) => {
		try {
			fn(event, payload);
		} catch {
			/* ignore */
		}
	});
}

export function snapshot() {
	return last;
}
