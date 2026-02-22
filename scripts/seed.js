require('dotenv').config();
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function seed() {
  console.log('Seeding database from CSV...');
  
  const stores = [];
  const csvPath = path.join(__dirname, '..', 'source', 'dmv_merged.csv');
  
  // Read CSV file and dedupe by place_id
  const seenPlaceIds = new Set();
  
  await new Promise((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        const lat = parseFloat(row.lat);
        const lng = parseFloat(row.lng);
        
        // Skip rows with invalid coordinates
        if (isNaN(lat) || isNaN(lng)) return;
        
        // Skip duplicate place_ids
        if (seenPlaceIds.has(row.place_id)) return;
        seenPlaceIds.add(row.place_id);
        
        stores.push({
          place_id: row.place_id,
          name: row.name,
          address: row.address || null,
          zip: row.zip || null,
          city: row.city || null,
          rating: row.rating ? parseFloat(row.rating) : null,
          user_ratings_total: row.user_ratings_total ? parseInt(row.user_ratings_total) : null,
          business_status: row.business_status || null,
          lat,
          lng,
          types: row.types || null
        });
      })
      .on('end', resolve)
      .on('error', reject);
  });
  
  console.log(`Found ${stores.length} stores in CSV`);
  
  try {
    // Clear existing data
    await pool.query('TRUNCATE TABLE stores RESTART IDENTITY');
    
    // Insert stores in batches
    const batchSize = 100;
    let inserted = 0;
    
    for (let i = 0; i < stores.length; i += batchSize) {
      const batch = stores.slice(i, i + batchSize);
      
      const values = batch.map((store, idx) => {
        const offset = idx * 11;
        return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11})`;
      }).join(', ');
      
      const params = batch.flatMap(store => [
        store.place_id,
        store.name,
        store.address,
        store.zip,
        store.city,
        store.rating,
        store.user_ratings_total,
        store.business_status,
        store.lat,
        store.lng,
        store.types
      ]);
      
      await pool.query(`
        INSERT INTO stores (place_id, name, address, zip, city, rating, user_ratings_total, business_status, lat, lng, types)
        VALUES ${values}
        ON CONFLICT (place_id) DO UPDATE SET
          name = EXCLUDED.name,
          address = EXCLUDED.address,
          zip = EXCLUDED.zip,
          city = EXCLUDED.city,
          rating = EXCLUDED.rating,
          user_ratings_total = EXCLUDED.user_ratings_total,
          business_status = EXCLUDED.business_status,
          lat = EXCLUDED.lat,
          lng = EXCLUDED.lng,
          types = EXCLUDED.types,
          updated_at = CURRENT_TIMESTAMP
      `, params);
      
      inserted += batch.length;
      console.log(`Inserted ${inserted}/${stores.length} stores`);
    }
    
    console.log('Seeding completed successfully!');
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
