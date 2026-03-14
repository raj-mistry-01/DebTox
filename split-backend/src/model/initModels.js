import 'dotenv/config';
import { sequelize } from './index.js';

import dns from "node:dns/promises";
dns.setServers(["8.8.8.8", "8.8.4.4"]);

async function initializeModels(options = { alter: false }) {
  try {
    console.log('🔐 Authenticating database...');
    await sequelize.authenticate();
    console.log('✅ Database authenticated');

    console.log('📋 Syncing models...');
    console.log('  Options:', { alter: options.alter, force: options.force || false });
    
    const result = await sequelize.sync(options);
    
    console.log('✅ Models synced successfully');
    console.log('📊 Tables created/updated');
    
    return result;
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    console.error('Full error:', error);
    throw error;
  }
}

export default initializeModels;
