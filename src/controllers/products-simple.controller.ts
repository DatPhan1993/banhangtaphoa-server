import { Request, Response } from 'express';
import Database from '../database/sqlite-connection';

interface AuthRequest extends Request {
  user?: any;
}

export class ProductsSimpleController {
  async updateProduct(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      console.log('Updating product with ID:', id);
      console.log('Update data:', updates);

      // Simple approach: only update fields that are provided
      const updateFields: string[] = [];
      const updateValues: any[] = [];

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
      if (updates.description !== undefined) {
        updateFields.push('description = ?');
        updateValues.push(updates.description);
      }
      if (updates.category_id !== undefined) {
        updateFields.push('category_id = ?');
        updateValues.push(updates.category_id);
      }

      if (updateFields.length === 0) {
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

      const result = await Database.getInstance().run(sql, updateValues);
      
      console.log('Update result:', result);

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          error: 'Product not found'
        });
      }

      // Get updated product
      const updatedProduct = await Database.getInstance().get(
        'SELECT * FROM products WHERE id = ?',
        [id]
      );

      res.json({
        success: true,
        message: 'Product updated successfully',
        data: updatedProduct
      });

    } catch (error: any) {
      console.error('Update product error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}

export default new ProductsSimpleController(); 