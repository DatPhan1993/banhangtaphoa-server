const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'pos_system.db');

// Categories for the real products
const categories = [
  { name: 'Đồ uống', description: 'Nước ngọt, nước suối, trà, sữa và các loại đồ uống khác' },
  { name: 'Đồ ăn vặt', description: 'Bánh kẹo, snack, đồ ăn vặt các loại' },
  { name: 'Thực phẩm tiện lợi', description: 'Mì gói, cháo tươi, thực phẩm chế biến sẵn' },
  { name: 'Chăm sóc cá nhân', description: 'Kem đánh răng, dầu gội, xà phòng, mỹ phẩm' },
  { name: 'Gia dụng', description: 'Nước rửa chén, giấy vệ sinh, đồ dùng gia đình' },
  { name: 'Gia vị nấu ăn', description: 'Dầu ăn, nước mắm, gạo, gia vị nấu ăn' },
  { name: 'Sản phẩm từ sữa', description: 'Sữa chua, phô mai, bơ và các sản phẩm từ sữa' }
];

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    return;
  }
  console.log('Connected to SQLite database');
});

async function addCategories() {
  try {
    console.log('🏷️  Adding product categories...');
    
    for (const category of categories) {
      // Check if category already exists
      const existing = await new Promise((resolve, reject) => {
        db.get('SELECT id FROM categories WHERE name = ?', [category.name], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      if (existing) {
        console.log(`⚠️  Category "${category.name}" already exists, skipping...`);
        continue;
      }

      // Insert new category
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO categories (name, description, created_at, updated_at) VALUES (?, ?, datetime("now"), datetime("now"))',
          [category.name, category.description],
          function(err) {
            if (err) reject(err);
            else {
              console.log(`✅ Added category: ${category.name} (ID: ${this.lastID})`);
              resolve(this.lastID);
            }
          }
        );
      });
    }

    // Show all categories
    console.log('\n📋 All categories in database:');
    const allCategories = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM categories ORDER BY id', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    allCategories.forEach(cat => {
      console.log(`   ${cat.id}. ${cat.name} - ${cat.description}`);
    });

    console.log('\n🎉 Categories setup completed!');
    console.log('💡 Now you can import the Excel file with real product data.');

  } catch (error) {
    console.error('Error adding categories:', error);
  } finally {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
      } else {
        console.log('Database connection closed.');
      }
    });
  }
}

addCategories(); 