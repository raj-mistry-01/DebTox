import 'dotenv/config';

import app from './app.js';
import { PORT } from './constant.js';
import initializeModels from './model/initModels.js';

import dns from "node:dns/promises";
dns.setServers(["8.8.8.8", "8.8.4.4"]);

async function startServer() {
	try {
		// Initialize database tables on startup with timeout
		// alter: true will add missing columns to existing tables
		const dbInitPromise = initializeModels({ alter: true });
		const timeoutPromise = new Promise((_, reject) => 
			setTimeout(() => reject(new Error('Database initialization timeout')), 15000)
		);

		await Promise.race([dbInitPromise, timeoutPromise]);
		console.log('Database synchronized');

		app.listen(PORT, () => {
			console.log(`Server running on port ${PORT}`);
		});
	} catch (error) {
		console.error('Failed to start server:', error.message || error);
		// Continue anyway - server can still accept requests even if DB init fails
		console.warn('⚠️  Starting server without database. Database operations will fail.');
		app.listen(PORT, () => {
			console.log(`Server running on port ${PORT} (database offline)`);
		});
	}
}

startServer();
