require('dotenv').config();
const express = require('express');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint to get all stores
app.get('/api/stores', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        place_id,
        name,
        address,
        zip,
        city,
        rating,
        user_ratings_total,
        business_status,
        lat,
        lng,
        types
      FROM stores
      ORDER BY name
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching stores:', err);
    res.status(500).json({ error: 'Failed to fetch stores' });
  }
});

// API endpoint to get store count
app.get('/api/stores/count', async (req, res) => {
  try {
    const result = await pool.query('SELECT COUNT(*) FROM stores');
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (err) {
    console.error('Error counting stores:', err);
    res.status(500).json({ error: 'Failed to count stores' });
  }
});

// Health check endpoint for Heroku
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'healthy', database: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'unhealthy', database: 'disconnected' });
  }
});

// Serve index.html for root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
