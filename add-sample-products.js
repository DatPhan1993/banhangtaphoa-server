const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const dbPath = path.join(__dirname, 'pos_system.db');

// Connect to database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err);
    return;
  }
  console.log('Connected to SQLite database');
});

// Sample products data
const sampleProducts = [
  {
    sku: 'SP001',
    barcode: '1234567890123',
    name: 'Nước ngọt Coca Cola 330ml',
    description: 'Nước ngọt có ga Coca Cola lon 330ml',
    category_id: 1,
    unit: 'Lon',
    purchase_price: 8000,
    sale_price: 12000,
    wholesale_price: 10000,
    stock_quantity: 100,
    min_stock_level: 20
  },
  {
    sku: 'SP002',
    barcode: '1234567890124',
    name: 'Bánh mì sandwich',
    description: 'Bánh mì sandwich thịt nguội',
    category_id: 1,
    unit: 'Cái',
    purchase_price: 15000,
    sale_price: 25000,
    wholesale_price: 20000,
    stock_quantity: 50,
    min_stock_level: 10
  },
  {
    sku: 'SP003',
    barcode: '1234567890125',
    name: 'Sữa tươi TH True Milk 1L',
    description: 'Sữa tươi tiệt trùng TH True Milk hộp 1L',
    category_id: 1,
    unit: 'Hộp',
    purchase_price: 25000,
    sale_price: 35000,
    wholesale_price: 30000,
    stock_quantity: 30,
    min_stock_level: 5
  },
  {
    sku: 'SP004',
    barcode: '1234567890126',
    name: 'Kem đánh răng P/S 200g',
    description: 'Kem đánh răng P/S bảo vệ nướu 200g',
    category_id: 2,
    unit: 'Tuýp',
    purchase_price: 35000,
    sale_price: 50000,
    wholesale_price: 42000,
    stock_quantity: 25,
    min_stock_level: 5
  },
  {
    sku: 'SP005',
    barcode: '1234567890127',
    name: 'Dầu gội Head & Shoulders 400ml',
    description: 'Dầu gội Head & Shoulders chống gàu 400ml',
    category_id: 2,
    unit: 'Chai',
    purchase_price: 85000,
    sale_price: 120000,
    wholesale_price: 100000,
    stock_quantity: 15,
    min_stock_level: 3
  }
];

// Insert sample products
async function insertSampleProducts() {
  try {
    // First, ensure we have categories
    await new Promise((resolve, reject) => {
      db.run(`INSERT OR IGNORE INTO categories (id, name, description, is_active) VALUES 
        (1, 'Thực phẩm & Đồ uống', 'Các sản phẩm thực phẩm và đồ uống', 1),
        (2, 'Mỹ phẩm & Chăm sóc cá nhân', 'Các sản phẩm mỹ phẩm và chăm sóc cá nhân', 1),
        (3, 'Gia dụng', 'Các sản phẩm gia dụng', 1)`, 
        function(err) {
          if (err) reject(err);
          else resolve(this);
        }
      );
    });

    console.log('Categories inserted/updated');

    // Clear existing products
    await new Promise((resolve, reject) => {
      db.run('DELETE FROM products', function(err) {
        if (err) reject(err);
        else {
          console.log(`Cleared ${this.changes} existing products`);
          resolve(this);
        }
      });
    });

    // Insert sample products
    const insertStmt = db.prepare(`
      INSERT INTO products (
        sku, barcode, name, description, category_id, unit,
        purchase_price, sale_price, wholesale_price, stock_quantity,
        min_stock_level, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
    `);

    for (const product of sampleProducts) {
      await new Promise((resolve, reject) => {
        insertStmt.run([
          product.sku,
          product.barcode,
          product.name,
          product.description,
          product.category_id,
          product.unit,
          product.purchase_price,
          product.sale_price,
          product.wholesale_price,
          product.stock_quantity,
          product.min_stock_level
        ], function(err) {
          if (err) reject(err);
          else {
            console.log(`Inserted product: ${product.name}`);
            resolve(this);
          }
        });
      });
    }

    insertStmt.finalize();
    console.log(`Successfully inserted ${sampleProducts.length} sample products!`);

  } catch (error) {
    console.error('Error inserting sample products:', error);
  } finally {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
      } else {
        console.log('Database connection closed');
      }
    });
  }
}

// Run the script
insertSampleProducts(); 