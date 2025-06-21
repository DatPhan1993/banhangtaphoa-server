import { Request, Response } from 'express';
import Database from '../database/connection';

interface PrintData {
  // Thông tin cửa hàng
  store: {
    logo?: string;
    name: string;
    address: string;
    phone: string;
    email?: string;
    qr_code?: string;
  };
  
  // Thông tin đơn hàng
  order: {
    order_number: string;
    order_date: string;
    status: string;
    subtotal: number;
    tax_amount: number;
    discount_amount: number;
    total_amount: number;
    payment_method: string;
    notes?: string;
  };
  
  // Thông tin khách hàng
  customer: {
    name: string;
    phone?: string;
    address?: string;
    email?: string;
  };
  
  // Danh sách sản phẩm
  items: Array<{
    product_name: string;
    quantity: number;
    unit_price: number;
    discount_amount: number;
    total_price: number;
    unit?: string;
  }>;
  
  // Thông tin thời gian
  datetime: {
    day: string;
    month: string;
    year: string;
    hour: string;
    minute: string;
    second: string;
    full_date: string;
    full_time: string;
  };
}

export class PrintController {
  // Lấy dữ liệu để in hóa đơn
  static async getPrintData(req: Request, res: Response) {
    try {
      const { orderId } = req.params;
      console.log('PrintController.getPrintData called with orderId:', orderId);
      
      if (!orderId) {
        console.log('No orderId provided');
        return res.status(400).json({
          success: false,
          error: 'Thiếu mã đơn hàng'
        });
      }

      const db = Database.getInstance();

      // Lấy thông tin cửa hàng từ store_settings
      const storeSettings = await db.all('SELECT setting_key, setting_value FROM store_settings');
      const storeData: any = {};
      storeSettings.forEach((setting: any) => {
        storeData[setting.setting_key] = setting.setting_value;
      });

      // Lấy thông tin đơn hàng
      const orderQuery = `
        SELECT so.*, c.ten_khach_hang, c.so_dien_thoai, c.dia_chi, c.email
        FROM sales_orders so
        LEFT JOIN customers c ON so.customer_id = c.id
        WHERE so.id = ?
      `;
      const orderResult = await db.get(orderQuery, [orderId]);
      console.log('Order query result:', orderResult);

      if (!orderResult) {
        console.log('Order not found for ID:', orderId);
        return res.status(404).json({
          success: false,
          error: 'Không tìm thấy đơn hàng'
        });
      }

      // Lấy chi tiết sản phẩm trong đơn hàng
      const itemsQuery = `
        SELECT soi.*, p.name as product_name, p.unit
        FROM sales_order_items soi
        JOIN products p ON soi.product_id = p.id
        WHERE soi.sales_order_id = ?
        ORDER BY soi.id
      `;
      const itemsResult = await db.all(itemsQuery, [orderId]);

      // Tạo thông tin thời gian hiện tại
      const now = new Date();
      const datetime = {
        day: now.getDate().toString().padStart(2, '0'),
        month: (now.getMonth() + 1).toString().padStart(2, '0'),
        year: now.getFullYear().toString(),
        hour: now.getHours().toString().padStart(2, '0'),
        minute: now.getMinutes().toString().padStart(2, '0'),
        second: now.getSeconds().toString().padStart(2, '0'),
        full_date: now.toLocaleDateString('vi-VN'),
        full_time: now.toLocaleTimeString('vi-VN')
      };

      // Chuẩn bị dữ liệu trả về
      const printData: PrintData = {
        store: {
          logo: storeData.store_logo || '',
          name: storeData.store_name || 'Cửa hàng',
          address: storeData.store_address || '',
          phone: storeData.store_phone || '',
          email: storeData.store_email || '',
          qr_code: storeData.qr_code || ''
        },
        order: {
          order_number: orderResult.order_number,
          order_date: new Date(orderResult.order_date).toLocaleDateString('vi-VN'),
          status: orderResult.status,
          subtotal: parseFloat(orderResult.subtotal || 0),
          tax_amount: parseFloat(orderResult.tax_amount || 0),
          discount_amount: parseFloat(orderResult.discount_amount || 0),
          total_amount: parseFloat(orderResult.total_amount || 0),
          payment_method: orderResult.payment_method,
          notes: orderResult.notes || ''
        },
        customer: {
          name: orderResult.ten_khach_hang || 'Khách Lẻ',
          phone: orderResult.so_dien_thoai || '',
          address: orderResult.dia_chi || '',
          email: orderResult.email || ''
        },
        items: itemsResult.map((item: any) => ({
          product_name: item.product_name,
          quantity: parseInt(item.quantity),
          unit_price: parseFloat(item.unit_price),
          discount_amount: parseFloat(item.discount_amount || 0),
          total_price: parseFloat(item.total_price),
          unit: item.unit || 'cái'
        })),
        datetime
      };

      res.json({
        success: true,
        data: printData
      });

    } catch (error) {
      console.error('Error getting print data:', error);
      res.status(500).json({
        success: false,
        error: 'Không thể lấy dữ liệu in'
      });
    }
  }

  // Lấy dữ liệu mẫu để test template
  static async getSamplePrintData(req: Request, res: Response) {
    try {
      const db = Database.getInstance();

      // Lấy thông tin cửa hàng từ store_settings
      const storeSettings = await db.all('SELECT setting_key, setting_value FROM store_settings');
      const storeData: any = {};
      storeSettings.forEach((setting: any) => {
        storeData[setting.setting_key] = setting.setting_value;
      });

      // Tạo thông tin thời gian hiện tại
      const now = new Date();
      const datetime = {
        day: now.getDate().toString().padStart(2, '0'),
        month: (now.getMonth() + 1).toString().padStart(2, '0'),
        year: now.getFullYear().toString(),
        hour: now.getHours().toString().padStart(2, '0'),
        minute: now.getMinutes().toString().padStart(2, '0'),
        second: now.getSeconds().toString().padStart(2, '0'),
        full_date: now.toLocaleDateString('vi-VN'),
        full_time: now.toLocaleTimeString('vi-VN')
      };

      // Dữ liệu mẫu
      const sampleData: PrintData = {
        store: {
          logo: storeData.store_logo || 'LOGO CỬA HÀNG',
          name: storeData.store_name || 'KIOTVIET',
          address: storeData.store_address || 'Thành phố Hà Tĩnh, Hà Tĩnh',
          phone: storeData.store_phone || '0969866687',
          email: storeData.store_email || '',
          qr_code: storeData.qr_code || '***QR CODE***'
        },
        order: {
          order_number: 'DH000021',
          order_date: now.toLocaleDateString('vi-VN'),
          status: 'pending',
          subtotal: 616000,
          tax_amount: 0,
          discount_amount: 6000,
          total_amount: 610000,
          payment_method: 'cash',
          notes: ''
        },
        customer: {
          name: 'Anh Hòa Q.1',
          phone: '0123456789',
          address: 'Hà Tĩnh',
          email: ''
        },
        items: [
          {
            product_name: 'Váy nữ Alcado (chỉ đo)',
            quantity: 5,
            unit_price: 10000,
            discount_amount: 0,
            total_price: 50000,
            unit: 'cái'
          },
          {
            product_name: 'Quần short nữ Blue Exchange',
            quantity: 1,
            unit_price: 6000,
            discount_amount: 0,
            total_price: 6000,
            unit: 'cái'
          },
          {
            product_name: 'Quần jeans nữ Pop',
            quantity: 1,
            unit_price: 20000,
            discount_amount: 0,
            total_price: 20000,
            unit: 'cái'
          },
          {
            product_name: 'Quần jeans nữ Blue Exchange',
            quantity: 6,
            unit_price: 90000,
            discount_amount: 0,
            total_price: 540000,
            unit: 'cái'
          }
        ],
        datetime
      };

      res.json({
        success: true,
        data: sampleData
      });

    } catch (error) {
      console.error('Error getting sample print data:', error);
      res.status(500).json({
        success: false,
        error: 'Không thể lấy dữ liệu mẫu'
      });
    }
  }
} 