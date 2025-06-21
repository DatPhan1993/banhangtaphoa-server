import { Request, Response } from 'express';
import Database from '../database/connection';

interface AuthRequest extends Request {
  user?: any;
}

export class ProductsFixedController {
  async updateProduct(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      console.log('Updating product with ID:', id);
      console.log('Update data:', updates);

      // Dynamic query building - only update fields that are provided
      const updateFields: string[] = [];
      const updateValues: any[] = [];

      // Define all possible updateable fields
      const allowedFields = [
        'sku', 'barcode', 'name', 'description', 'category_id', 'unit',
        'purchase_price', 'sale_price', 'wholesale_price', 'promo_price',
        'stock_quantity', 'min_stock_level', 'max_stock_level', 'expiry_date',
        'image_url', 'has_variants', 'track_inventory', 'is_active'
      ];

      // Build dynamic update query - only include fields that have values
      for (const field of allowedFields) {
        if (updates[field] !== undefined && updates[field] !== null) {
          // Special handling for empty strings - only allow for certain fields
          if (updates[field] === '' && !['description', 'image_url', 'barcode'].includes(field)) {
            continue; // Skip empty strings for most fields
          }
          updateFields.push(`${field} = ?`);
          updateValues.push(updates[field]);
        }
      }

      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No valid fields to update'
        });
      }

      // Always update the updated_at timestamp
      updateFields.push('updated_at = NOW()');
      
      // Add id for WHERE clause
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

      // Get updated product to return
      const updatedProduct = await Database.getInstance().get(
        `SELECT p.*, c.name as category_name 
         FROM products p 
         LEFT JOIN categories c ON p.category_id = c.id 
         WHERE p.id = ?`,
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

export default new ProductsFixedController(); 