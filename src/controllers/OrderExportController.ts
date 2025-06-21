import { Request, Response } from 'express';
import Database from '../database/connection';
import * as XLSX from 'xlsx';

export class OrderExportController {
  // Export orders to Excel
  static async exportOrders(req: Request, res: Response) {
    try {
      console.log('=== Export Orders Started ===');
      const db = Database.getInstance();
      const { start_date, end_date, payment_status } = req.body;

      console.log('Export request received with filters:', { start_date, end_date, payment_status });

      // Build query with filters - JOIN with customers table to get customer info
      let query = `
        SELECT 
          so.id,
          so.order_number,
          c.ma_khach_hang,
          c.ten_khach_hang as customer_name,
          c.so_dien_thoai as customer_phone,
          so.subtotal,
          so.discount_amount,
          so.total_amount,
          so.payment_method,
          so.status as payment_status,
          so.notes,
          so.created_at,
          GROUP_CONCAT(
            CONCAT(p.name, ' (SL: ', soi.quantity, ', Giá: ', soi.unit_price, ')')
            SEPARATOR '; '
          ) as items
        FROM sales_orders so
        LEFT JOIN customers c ON so.customer_id = c.id
        LEFT JOIN sales_order_items soi ON so.id = soi.sales_order_id
        LEFT JOIN products p ON soi.product_id = p.id
        WHERE 1=1
      `;

      const params: any[] = [];

      if (start_date) {
        query += ' AND DATE(so.created_at) >= ?';
        params.push(start_date);
      }

      if (end_date) {
        query += ' AND DATE(so.created_at) <= ?';
        params.push(end_date);
      }

      if (payment_status) {
        query += ' AND so.status = ?';
        params.push(payment_status);
      }

      query += ' GROUP BY so.id ORDER BY so.created_at DESC';

      console.log('Executing query:', query);
      console.log('With params:', params);

      let orders;
      try {
        orders = await db.all(query, params);
        console.log(`Found ${orders.length} orders to export`);
      } catch (dbError) {
        console.error('Database query error:', dbError);
        // If there's a database error, create empty Excel
        orders = [];
      }

      // If no orders found, create empty Excel with headers
      const excelData = orders.length > 0 ? orders.map((order: any) => ({
        'Mã đơn hàng': order.order_number,
        'Mã khách hàng': order.ma_khach_hang || '',
        'Khách hàng': order.customer_name || 'Khách lẻ',
        'Số điện thoại': order.customer_phone || '',
        'Tổng tiền hàng': order.subtotal,
        'Giảm giá': order.discount_amount,
        'Khách cần trả': order.total_amount,
        'Phương thức thanh toán': order.payment_method,
        'Trạng thái thanh toán': order.payment_status,
        'Ghi chú': order.notes || '',
        'Thời gian tạo': new Date(order.created_at).toLocaleString('vi-VN'),
        'Sản phẩm': order.items || ''
      })) : [{
        'Mã đơn hàng': '',
        'Mã khách hàng': '',
        'Khách hàng': '',
        'Số điện thoại': '',
        'Tổng tiền hàng': '',
        'Giảm giá': '',
        'Khách cần trả': '',
        'Phương thức thanh toán': '',
        'Trạng thái thanh toán': '',
        'Ghi chú': '',
        'Thời gian tạo': '',
        'Sản phẩm': ''
      }];

      console.log('Creating Excel workbook...');

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);

      // Set column widths - Updated to include Mã khách hàng column
      const columnWidths = [
        { wch: 15 }, // Mã đơn hàng
        { wch: 15 }, // Mã khách hàng
        { wch: 20 }, // Khách hàng
        { wch: 15 }, // Số điện thoại
        { wch: 15 }, // Tổng tiền hàng
        { wch: 12 }, // Giảm giá
        { wch: 15 }, // Khách cần trả
        { wch: 18 }, // Phương thức thanh toán
        { wch: 18 }, // Trạng thái thanh toán
        { wch: 20 }, // Ghi chú
        { wch: 20 }, // Thời gian tạo
        { wch: 50 }  // Sản phẩm
      ];
      worksheet['!cols'] = columnWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Đơn hàng');

      console.log('Generating Excel buffer...');

      // Generate Excel file buffer
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      // Generate filename with current date
      const filename = `orders_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      console.log(`Sending Excel file: ${filename}, size: ${excelBuffer.length} bytes`);

      // Set response headers for file download
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', excelBuffer.length.toString());
      res.setHeader('Cache-Control', 'no-cache');

      // Send file buffer
      res.end(excelBuffer);

      console.log('=== Export Orders Completed Successfully ===');

    } catch (error: any) {
      console.error('=== Export Orders Failed ===');
      console.error('Export error:', error);
      console.error('Stack trace:', error.stack);
      
      res.status(500).json({
        success: false,
        error: 'Không thể xuất file Excel',
        details: error.message
      });
    }
  }

  // Import orders from Excel
  static async importOrders(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'Không tìm thấy file'
        });
      }

      const db = Database.getInstance();
      
      // Read Excel file
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      let importedCount = 0;
      const errors: string[] = [];

      for (let i = 0; i < data.length; i++) {
        const row: any = data[i];
        
        try {
          // Validate required fields
          if (!row['Mã đơn hàng'] || !row['Khách cần trả']) {
            errors.push(`Dòng ${i + 2}: Thiếu thông tin bắt buộc`);
            continue;
          }

          // Check if order already exists
          const existingOrder = await db.get(
            'SELECT id FROM sales_orders WHERE order_number = ?',
            [row['Mã đơn hàng']]
          );

          if (existingOrder) {
            errors.push(`Dòng ${i + 2}: Đơn hàng ${row['Mã đơn hàng']} đã tồn tại`);
            continue;
          }

          // Insert order
          const orderData = {
            order_number: row['Mã đơn hàng'],
            customer_name: row['Khách hàng'] || 'Khách lẻ',
            customer_phone: row['Số điện thoại'] || null,
            subtotal: parseFloat(row['Tổng tiền hàng']) || 0,
            discount_amount: parseFloat(row['Giảm giá']) || 0,
            total_amount: parseFloat(row['Khách cần trả']) || 0,
            payment_method: row['Phương thức thanh toán'] || 'cash',
            payment_status: row['Trạng thái thanh toán'] || 'paid',
            notes: row['Ghi chú'] || null,
            created_at: new Date().toISOString()
          };

          await db.run(`
            INSERT INTO sales_orders (
              order_number, customer_name, customer_phone, subtotal, 
              discount_amount, total_amount, payment_method, payment_status, 
              notes, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            orderData.order_number,
            orderData.customer_name,
            orderData.customer_phone,
            orderData.subtotal,
            orderData.discount_amount,
            orderData.total_amount,
            orderData.payment_method,
            orderData.payment_status,
            orderData.notes,
            orderData.created_at
          ]);

          importedCount++;

        } catch (error) {
          console.error(`Error importing row ${i + 2}:`, error);
          errors.push(`Dòng ${i + 2}: Lỗi khi nhập dữ liệu`);
        }
      }

      res.json({
        success: true,
        imported: importedCount,
        errors: errors,
        message: `Đã nhập thành công ${importedCount} đơn hàng${errors.length > 0 ? `, ${errors.length} lỗi` : ''}`
      });

    } catch (error) {
      console.error('Import error:', error);
      res.status(500).json({
        success: false,
        error: 'Không thể nhập file Excel'
      });
    }
  }
} 