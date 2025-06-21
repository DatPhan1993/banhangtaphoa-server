import { Request, Response } from 'express';
import Database from '../database/connection';

interface StoreSetting {
  id: number;
  setting_key: string;
  setting_value: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export class StoreSettingsController {
  // Get all store settings
  static async getStoreSettings(req: Request, res: Response) {
    try {
      const db = Database.getInstance();
      const rows = await db.all('SELECT * FROM store_settings ORDER BY setting_key');

      res.json({
        success: true,
        data: rows
      });
    } catch (error) {
      console.error('Error fetching store settings:', error);
      res.status(500).json({
        success: false,
        error: 'Không thể lấy thông tin cài đặt cửa hàng'
      });
    }
  }

  // Update store settings
  static async updateStoreSettings(req: Request, res: Response) {
    try {
      const settings = req.body;
      
      // Validate required fields
      if (!settings || typeof settings !== 'object') {
        return res.status(400).json({
          success: false,
          error: 'Dữ liệu cài đặt không hợp lệ'
        });
      }

      const db = Database.getInstance();

      // Update each setting
      const updatePromises = Object.entries(settings).map(async ([key, value]) => {
        if (value !== undefined && value !== null) {
          await db.run(
            `INSERT INTO store_settings (setting_key, setting_value, updated_at) 
             VALUES (?, ?, NOW()) 
             ON DUPLICATE KEY UPDATE 
             setting_value = VALUES(setting_value), 
             updated_at = NOW()`,
            [key, String(value)]
          );
        }
      });

      await Promise.all(updatePromises);

      res.json({
        success: true,
        message: 'Cập nhật cài đặt cửa hàng thành công'
      });
    } catch (error) {
      console.error('Error updating store settings:', error);
      res.status(500).json({
        success: false,
        error: 'Không thể cập nhật cài đặt cửa hàng'
      });
    }
  }
} 