const mysql = require('mysql2/promise');

async function testUpdate() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'dat12345',
      database: 'pos_system'
    });

    console.log('Connected to MySQL');

    // Test simple update
    const [result] = await connection.execute(
      'UPDATE products SET name = ?, stock_quantity = ? WHERE id = ?',
      ['Test Node.js Update', 888, 1779]
    );

    console.log('Update result:', result);
    console.log('Affected rows:', result.affectedRows);

    // Get updated product
    const [rows] = await connection.execute(
      'SELECT id, name, stock_quantity FROM products WHERE id = ?',
      [1779]
    );

    console.log('Updated product:', rows[0]);

    await connection.end();
  } catch (error) {
    console.error('Error:', error);
  }
}

testUpdate(); 