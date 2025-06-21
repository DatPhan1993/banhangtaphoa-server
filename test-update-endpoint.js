const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
app.use(express.json());

// Database connection
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'dat12345',
  database: 'pos_system'
};

// Simple update endpoint
app.put('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    console.log('Updating product with ID:', id);
    console.log('Update data:', updates);

    const connection = await mysql.createConnection(dbConfig);

    // Simple approach: only update fields that are provided
    const updateFields = [];
    const updateValues = [];

    // Check each field and add to update if provided
    if (updates.name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(updates.name);
    }
    if (updates.stock_quantity !== undefined) {
      updateFields.push('stock_quantity = ?');
      updateValues.push(updates.stock_quantity);
    }
    if (updates.is_active !== undefined) {
      updateFields.push('is_active = ?');
      updateValues.push(updates.is_active);
    }
    if (updates.sale_price !== undefined) {
      updateFields.push('sale_price = ?');
      updateValues.push(updates.sale_price);
    }

    if (updateFields.length === 0) {
      await connection.end();
      return res.status(400).json({
        success: false,
        error: 'No fields to update'
      });
    }

    // Always update the updated_at timestamp
    updateFields.push('updated_at = NOW()');
    updateValues.push(id);

    const sql = `UPDATE products SET ${updateFields.join(', ')} WHERE id = ?`;
    
    console.log('SQL Query:', sql);
    console.log('Values:', updateValues);

    const [result] = await connection.execute(sql, updateValues);
    
    console.log('Update result:', result);

    if (result.affectedRows === 0) {
      await connection.end();
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Get updated product
    const [rows] = await connection.execute(
      'SELECT * FROM products WHERE id = ?',
      [id]
    );

    await connection.end();

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: rows[0]
    });

  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
}); 