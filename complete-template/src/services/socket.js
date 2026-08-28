import { io } from 'socket.io-client';

let socket;

export function getMarketSocket() {
	if (!socket) {
		socket = io({
			path: '/socket.io',
			transports: ['websocket', 'polling'],
			reconnection: true,
			reconnectionDelay: 1000,
			reconnectionDelayMax: 15000,
		});
	}
	return socket;
}
