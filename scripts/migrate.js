require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function migrate() {
  console.log('Running database migrations...');
  
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS stores (
        id SERIAL PRIMARY KEY,
        place_id VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(500) NOT NULL,
        address TEXT,
        zip VARCHAR(20),
        city VARCHAR(255),
        rating DECIMAL(2,1),
        user_ratings_total INTEGER,
        business_status VARCHAR(50),
        lat DECIMAL(12,8) NOT NULL,
        lng DECIMAL(12,8) NOT NULL,
        types TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create index for geospatial queries
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_stores_lat_lng ON stores (lat, lng)
    `);
    
    // Create index for business status filtering
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_stores_status ON stores (business_status)
    `);
    
    console.log('Migration completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
