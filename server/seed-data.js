const mysql = require('mysql2/promise');

// MySQL connection config
const config = {
  host: 'localhost',
  user: 'root',
  password: 'dat12345',
  database: 'pos_system'
};

// Sample data removed - use import/export features instead
const products = [];

// Run seeding
async function seedData() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection(config);
    console.log('Connected to MySQL database');

    // Clear existing data
    await connection.execute('DELETE FROM products WHERE sku LIKE "SP%"');
    console.log('Cleared existing sample products');

    // Insert new products
    const insertQuery = `
      INSERT INTO products (
        sku, name, description, category_id, unit, purchase_price, 
        sale_price, wholesale_price, stock_quantity, min_stock_level, 
        max_stock_level, is_active, image_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    for (const product of products) {
      await connection.execute(insertQuery, product);
    }

    console.log(`Inserted ${products.length} sample products successfully!`);
    console.log('Data seeding completed successfully!');

  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

seedData(); 