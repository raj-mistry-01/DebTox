import { Sequelize } from 'sequelize';
import { DB_NAME } from '../constant.js';

const baseConfig = {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  define: {
    underscored: true,
    freezeTableName: true,
    timestamps: true,
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
};

function buildConnectionStringFromEnv() {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  const url = new URL(process.env.DATABASE_URL);
  const hasDbInUrl = url.pathname && url.pathname !== '/';

  if (!hasDbInUrl && DB_NAME) {
    url.pathname = `/${DB_NAME}`;
  }

  return url.toString();
}

const supabaseConnectionString = buildConnectionStringFromEnv();

const sequelize = supabaseConnectionString
  ? new Sequelize(supabaseConnectionString, {
      ...baseConfig,
      dialectOptions: {
        ssl: { rejectUnauthorized: false },
      },
    })
  : new Sequelize(DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
      ...baseConfig,
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || 5432),
    });

export default sequelize;
