import { Server } from 'socket.io';
import { subscribe, snapshot } from './lib/marketHub.js';

export function attachRealtime(httpServer) {
	const io = new Server(httpServer, {
		cors: { origin: true, credentials: true },
		path: '/socket.io',
	});

	io.on('connection', (socket) => {
		socket.emit('market:snapshot', snapshot());
		socket.on('market:subscribe', (room) => {
			if (typeof room === 'string') socket.join(room);
		});
	});

	subscribe((event, payload) => {
		io.emit(`market:${event}`, payload);
	});

	return io;
}
