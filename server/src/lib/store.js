import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { v4 as uuid } from 'uuid';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, '../../data/store.json');

function empty() {
	return {
		users: [],
		apiKeys: [],
		positions: [],
		wallets: [],
		auditLogs: [],
		refreshTokens: [],
		botConfigs: [],
		tradeLogs: [],
		engineCommands: [],
		engineHeartbeat: null,
		payments: [],
	};
}

function load() {
	try {
		return { ...empty(), ...JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) };
	} catch {
		return empty();
	}
}

function save(state) {
	fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
	fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2));
}

let state = load();

export function reloadFromDisk() {
	state = load();
	return state;
}

export const db = {
	get() {
		return state;
	},
	persist() {
		save(state);
	},
	reload: reloadFromDisk,
	uuid,
};
