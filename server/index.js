const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const { prepareDatabase } = require('./config/bootstrap');
const { autoSeedIfEmpty } = require('./seed/seed');
const { errorHandler } = require('./utils/http');

const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes');
const userRoutes = require('./routes/userRoutes');
const testRoutes = require('./routes/testRoutes');
const teacherRoutes = require('./routes/teacherRoutes');

const app = express();
app.disable('x-powered-by');

// Allow the configured frontend origin(s), or any origin when CLIENT_URL is not set
app.use(cors({
  origin: env.clientUrls.length > 0 ? env.clientUrls : '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '1mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api', courseRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'PolyLearn API is running smoothly.' });
});

// Root endpoint for Render deployment verification
app.get('/', (req, res) => {
  res.status(200).send('PolyLearn API Server is Live!');
});

app.use('/api', (req, res) => {
  res.status(404).json({ message: 'API route not found.' });
});

app.use(errorHandler);

const startServer = async () => {
  try {
    await prepareDatabase();
    // Auto-seed initial content if database is fresh/empty
    await autoSeedIfEmpty();
  } catch (err) {
    console.error('Unable to connect to the database:', err);
    console.log('Make sure the database configuration in .env is correct.');
    // Start the server anyway so the service remains active on Render
  }

  app.listen(env.port, () => {
    console.log(`Server is running on port ${env.port}`);
  });
};

startServer();
