const express = require('express');
const cors = require('cors');
const path = require('path');
const mysql = require('mysql2/promise');
const { sequelize } = require('./models');

// Import routes
const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes');
const userRoutes = require('./routes/userRoutes');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS
app.use(cors());

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
    console.log('MySQL Database connection established successfully.');

    // sync({ alter: true }) updates schema elements without dropping data in development
    await sequelize.sync({ alter: false }); 
    console.log('Database models synced.');

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Unable to connect to the database:', err);
    console.log('Make sure MySQL is running and database configuration in .env is correct.');
    // Start server anyway so the user can see port binding or errors clearly
    app.listen(PORT, () => {
      console.log(`Server started on port ${PORT} (Database offline)`);
    });
  }
};

startServer();
