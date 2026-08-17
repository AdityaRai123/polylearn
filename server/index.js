const express = require('express');
const cors = require('cors');
const path = require('path');
const mysql = require('mysql2/promise');
const { sequelize } = require('./models');
const { autoSeedIfEmpty } = require('./seed/seed');

// Import routes
const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes');
const userRoutes = require('./routes/userRoutes');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS (Allow configured CLIENT_URL or all origins)
const corsOptions = {
  origin: process.env.CLIENT_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api', courseRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'PolyLearn API is running smoothly.' });
});

// Root endpoint for Render deployment verification
app.get('/', (req, res) => {
  res.status(200).send('PolyLearn API Server is Live!');
});

// Database Synchronization and server start
const startServer = async () => {
  try {
    if (process.env.DB_DIALECT !== 'sqlite') {
      // Ensure database exists before connecting via Sequelize
      const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
      });
      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'polylearn'}\`;`);
      await connection.end();
    }

    // Sync database (creates tables if they don't exist)
    await sequelize.authenticate();
    const dialect = process.env.DB_DIALECT || 'mysql';
    console.log(`Database connection established successfully (${dialect}).`);

    await sequelize.sync({ alter: false }); 
    console.log('Database models synced.');

    // Auto-seed initial content if database is fresh/empty
    await autoSeedIfEmpty();

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Unable to connect to the database:', err);
    console.log('Make sure database configuration in .env is correct.');
    // Start server anyway so the service remains active on Render
    app.listen(PORT, () => {
      console.log(`Server started on port ${PORT} (Database offline)`);
    });
  }
};

startServer();

