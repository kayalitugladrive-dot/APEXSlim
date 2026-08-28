import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import eslint from 'vite-plugin-eslint';
import * as path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
	base: '/',
	server: {
		host: '0.0.0.0',
		port: 5173,
		proxy: {
			'/api': {
				target: 'http://127.0.0.1:4000',
				changeOrigin: true,
			},
			'/socket.io': {
				target: 'http://127.0.0.1:4000',
				changeOrigin: true,
				ws: true,
			},
		},
	},
	plugins: [react()],
	resolve: {
		alias: [
			{
				find: '@',
				replacement: path.resolve(__dirname, 'src'),
			},
			{
				find: '@helpers',
				replacement: path.resolve(__dirname, 'src/utils/helpers'),
			},
			{
				find: '@hooks',
				replacement: path.resolve(__dirname, 'src/utils/hooks'),
			},
			{
				find: '@hocs',
				replacement: path.resolve(__dirname, 'src/utils/hocs'),
			},
		],
	},
});
