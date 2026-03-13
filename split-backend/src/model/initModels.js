import 'dotenv/config';
import { sequelize } from './index.js';

import dns from "node:dns/promises";
dns.setServers(["8.8.8.8", "8.8.4.4"]);

async function initializeModels(options = { alter: false }) {
  await sequelize.authenticate();
  await sequelize.sync(options);
}

export default initializeModels;
