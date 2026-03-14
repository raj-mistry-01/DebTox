import 'dotenv/config';

import app from './app.js';
import { PORT } from './constant.js';
import initializeModels from './model/initModels.js';
import createDatabaseIfNotExists from './db/createDatabase.js';

import dns from "node:dns/promises";
dns.setServers(["8.8.8.8", "8.8.4.4"]);

async function startServer() {
	try {
		// Step 1: Ensure database exists
		console.log('📋 Checking database...');
		const isNotUsingSupabase = !process.env.DATABASE_URL;
		if (isNotUsingSupabase) {
			await createDatabaseIfNotExists();
		}

		// Step 2: Initialize models and create tables (WITHOUT force - keeps existing data)
		console.log('🔄 Initializing database...');
		const dbInitPromise = initializeModels({ alter: true, force: false });
		const timeoutPromise = new Promise((_, reject) => 
			setTimeout(() => reject(new Error('Database initialization timeout (45s)')), 45000)
		);

		await Promise.race([dbInitPromise, timeoutPromise]);
		console.log('✅ Database synchronized successfully - data preserved');

		app.listen(PORT, () => {
			console.log(`✅ Server running on port ${PORT}`);
		});
	} catch (error) {
		console.error('❌ Failed to start server:', error.message || error);
		console.warn('⚠️  Starting server without database. Database operations will fail.');
		console.log('📝 Troubleshooting: Check your DATABASE_URL and PostgreSQL connection');
		app.listen(PORT, () => {
			console.log(`⚠️  Server running on port ${PORT} (database offline)`);
		});
	}
}

startServer();
