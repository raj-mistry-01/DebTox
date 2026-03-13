import express from 'express';
import apiRouter from './router/index.js';

const app = express();

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/v1', apiRouter);

app.use((err, _req, res, _next) => {
	return res.status(500).json({
		message: 'Unexpected server error',
		error: err.message,
	});
});

export default app;
