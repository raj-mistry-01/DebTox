import 'dotenv/config';



import dns from "node:dns/promises";
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import app from './app.js';
import { PORT } from './constant.js';
import initializeModels from './model/initModels.js';

async function startServer() {
	try {
		// await initializeModels({ alter: false });

		app.listen(PORT, () => {
			console.log(`Server running on port ${PORT}`);
		});
	} catch (error) {
		console.error('Failed to start server:', error.message || error);
		process.exit(1);
	}
}

startServer();
