import { Request, Response } from 'express';
import Database from '../database/connection';
import { Customer, CreateCustomerRequest } from '../types';
import * as XLSX from 'xlsx';
import multer from 'multer';

export class CustomersController {
  // Get all customers
  async getCustomers(req: Request, res: Response) {
    try {
      const { 
        page = 1, 
        limit = 50, 
        search = '', 
        loai_khach_hang = '',
        trang_thai = ''
      } = req.query;

      const offset = (Number(page) - 1) * Number(limit);
      
      // Simple approach - get all customers first, then filter and paginate
      let baseQuery = 'SELECT * FROM customers';
      let whereConditions: string[] = [];
      const params: any[] = [];

      // Handle search with word-based logic
      if (search && String(search).trim()) {
        const searchWords = String(search).trim().split(/\s+/).filter(word => word.length > 0);
        
        if (searchWords.length > 0) {
          const searchConditions = searchWords.map(() => `(
            ten_khach_hang LIKE ? OR 
            ma_khach_hang LIKE ? OR 
            so_dien_thoai LIKE ? OR 
            email LIKE ?
          )`).join(' AND ');
          
          whereConditions.push(`(${searchConditions})`);
          
          // Add parameters for each word
          searchWords.forEach(word => {
            const searchTerm = `%${word}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
          });
        }
      }

      // Handle category filter
      if (loai_khach_hang && String(loai_khach_hang).trim()) {
        whereConditions.push('loai_khach_hang = ?');
        params.push(loai_khach_hang);
      }

      // Handle status filter
      if (trang_thai && String(trang_thai).trim()) {
        whereConditions.push('trang_thai = ?');
        params.push(trang_thai);
      }

      // Build final query
      if (whereConditions.length > 0) {
        baseQuery += ' WHERE ' + whereConditions.join(' AND ');
      }

      // Add ORDER BY
      baseQuery += ' ORDER BY ngay_tao DESC';

      // Get all matching records first
      const allCustomers = await Database.getInstance().all(baseQuery, params);
      const total = allCustomers.length;

      // Manual pagination
      const customers = allCustomers.slice(offset, offset + Number(limit));

      res.json({
        success: true,
        data: {
          customers,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit))
          }
        }
      });
    } catch (error) {
      console.error('Get customers error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Get customer by ID
  async getCustomer(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const customer = await Database.getInstance().get(
        'SELECT * FROM customers WHERE id = ?',
        [id]
      );

      if (!customer) {
        return res.status(404).json({
          success: false,
          error: 'Customer not found'
        });
      }

      res.json({
        success: true,
        data: customer
      });
    } catch (error) {
      console.error('Get customer error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Create new customer
  async createCustomer(req: Request, res: Response) {
    try {
      const customerData: CreateCustomerRequest = req.body;

      // Validate required fields
      if (!customerData.ma_khach_hang || !customerData.ten_khach_hang) {
        return res.status(400).json({
          success: false,
          error: 'Mã khách hàng và tên khách hàng là bắt buộc'
        });
      }

      // Check if customer code already exists
      const existingCustomer = await Database.getInstance().get(
        'SELECT id FROM customers WHERE ma_khach_hang = ?',
        [customerData.ma_khach_hang]
      );

      if (existingCustomer) {
        return res.status(400).json({
          success: false,
          error: 'Mã khách hàng đã tồn tại'
        });
      }

      const db = Database.getInstance();
      const result = await db.run(
        `INSERT INTO customers (
          ma_khach_hang, ten_khach_hang, so_dien_thoai, dia_chi, email,
          ngay_sinh, gioi_tinh, loai_khach_hang, han_muc_tin_dung,
          so_du_hien_tai, diem_tich_luy, ghi_chu, trang_thai
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          customerData.ma_khach_hang,
          customerData.ten_khach_hang,
          customerData.so_dien_thoai || null,
          customerData.dia_chi || null,
          customerData.email || null,
          customerData.ngay_sinh || null,
          customerData.gioi_tinh || null,
          customerData.loai_khach_hang || 'Bán lẻ',
          customerData.han_muc_tin_dung || 0,
          customerData.so_du_hien_tai || 0,
          customerData.diem_tich_luy || 0,
          customerData.ghi_chu || null,
          customerData.trang_thai || 'Hoạt động'
        ]
      );

      const newCustomer = await db.get(
        'SELECT * FROM customers WHERE id = ?',
        [result.lastID]
      );

      res.status(201).json({
        success: true,
        data: newCustomer,
        message: 'Khách hàng đã được tạo thành công'
      });
    } catch (error) {
      console.error('Create customer error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Update customer
  async updateCustomer(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const customerData: Partial<CreateCustomerRequest> = req.body;

      // Check if customer exists
      const existingCustomer = await Database.getInstance().get(
        'SELECT * FROM customers WHERE id = ?',
        [id]
      );

      if (!existingCustomer) {
        return res.status(404).json({
          success: false,
          error: 'Customer not found'
        });
      }

      // Check if customer code is being changed and already exists
      if (customerData.ma_khach_hang && customerData.ma_khach_hang !== existingCustomer.ma_khach_hang) {
        const duplicateCustomer = await Database.getInstance().get(
          'SELECT id FROM customers WHERE ma_khach_hang = ? AND id != ?',
          [customerData.ma_khach_hang, id]
        );

        if (duplicateCustomer) {
          return res.status(400).json({
            success: false,
            error: 'Mã khách hàng đã tồn tại'
          });
        }
      }

      const db = Database.getInstance();
      await db.run(
        `UPDATE customers SET 
          ma_khach_hang = COALESCE(?, ma_khach_hang),
          ten_khach_hang = COALESCE(?, ten_khach_hang),
          so_dien_thoai = ?,
          dia_chi = ?,
          email = ?,
          ngay_sinh = ?,
          gioi_tinh = ?,
          loai_khach_hang = COALESCE(?, loai_khach_hang),
          han_muc_tin_dung = COALESCE(?, han_muc_tin_dung),
          so_du_hien_tai = COALESCE(?, so_du_hien_tai),
          diem_tich_luy = COALESCE(?, diem_tich_luy),
          ghi_chu = ?,
          trang_thai = COALESCE(?, trang_thai),
          ngay_cap_nhat = CURRENT_TIMESTAMP
        WHERE id = ?`,
        [
          customerData.ma_khach_hang,
          customerData.ten_khach_hang,
          customerData.so_dien_thoai,
          customerData.dia_chi,
          customerData.email,
          customerData.ngay_sinh,
          customerData.gioi_tinh,
          customerData.loai_khach_hang,
          customerData.han_muc_tin_dung,
          customerData.so_du_hien_tai,
          customerData.diem_tich_luy,
          customerData.ghi_chu,
          customerData.trang_thai,
          id
        ]
      );

      const updatedCustomer = await db.get(
        'SELECT * FROM customers WHERE id = ?',
        [id]
      );

      res.json({
        success: true,
        data: updatedCustomer,
        message: 'Khách hàng đã được cập nhật thành công'
      });
    } catch (error) {
      console.error('Update customer error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Delete customer (hard delete)
  async deleteCustomer(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const customer = await Database.getInstance().get(
        'SELECT * FROM customers WHERE id = ?',
        [id]
      );

      if (!customer) {
        return res.status(404).json({
          success: false,
          error: 'Customer not found'
        });
      }

      const db = Database.getInstance();
      await db.run(
        'DELETE FROM customers WHERE id = ?',
        [id]
      );

      res.json({
        success: true,
        message: 'Khách hàng đã được xóa thành công'
      });
    } catch (error) {
      console.error('Delete customer error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Generate next customer code
  async generateCustomerCode(req: Request, res: Response) {
    try {
      const lastCustomer = await Database.getInstance().get(
        `SELECT ma_khach_hang FROM customers 
         WHERE ma_khach_hang LIKE 'KH%' 
         ORDER BY CAST(SUBSTRING(ma_khach_hang, 3) AS UNSIGNED) DESC 
         LIMIT 1`
      );

      let nextCode = 'KH001';
      if (lastCustomer && lastCustomer.ma_khach_hang) {
        const lastNumber = parseInt(lastCustomer.ma_khach_hang.substring(2));
        const nextNumber = lastNumber + 1;
        nextCode = `KH${nextNumber.toString().padStart(3, '0')}`;
      }

      res.json({
        success: true,
        data: { ma_khach_hang: nextCode }
      });
    } catch (error) {
      console.error('Generate customer code error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Export customers to Excel
  async exportCustomers(req: Request, res: Response) {
    try {
      const customers = await Database.getInstance().all(
        `SELECT 
          ma_khach_hang as 'Mã khách hàng',
          ten_khach_hang as 'Tên khách hàng',
          so_dien_thoai as 'Số điện thoại',
          email as 'Email',
          dia_chi as 'Địa chỉ',
          ngay_sinh as 'Ngày sinh',
          gioi_tinh as 'Giới tính',
          loai_khach_hang as 'Loại khách hàng',
          han_muc_tin_dung as 'Hạn mức tín dụng',
          so_du_hien_tai as 'Số dư hiện tại',
          diem_tich_luy as 'Điểm tích lũy',
          ghi_chu as 'Ghi chú',
          trang_thai as 'Trạng thái',
          ngay_tao as 'Ngày tạo'
        FROM customers 
        WHERE trang_thai = 'Hoạt động'
        ORDER BY ngay_tao DESC`
      );

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(customers);

      // Set column widths
      const columnWidths = [
        { wch: 15 }, // Mã khách hàng
        { wch: 25 }, // Tên khách hàng
        { wch: 15 }, // Số điện thoại
        { wch: 25 }, // Email
        { wch: 30 }, // Địa chỉ
        { wch: 12 }, // Ngày sinh
        { wch: 10 }, // Giới tính
        { wch: 15 }, // Loại khách hàng
        { wch: 18 }, // Hạn mức tín dụng
        { wch: 15 }, // Số dư hiện tại
        { wch: 12 }, // Điểm tích lũy
        { wch: 20 }, // Ghi chú
        { wch: 15 }, // Trạng thái
        { wch: 20 }  // Ngày tạo
      ];
      worksheet['!cols'] = columnWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Khách hàng');

      // Generate Excel file buffer
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      // Set response headers
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=khach-hang-${new Date().toISOString().split('T')[0]}.xlsx`);

      res.send(excelBuffer);
    } catch (error) {
      console.error('Export customers error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  // Import customers from Excel
  async importCustomers(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'Không có file được tải lên'
        });
      }

      // Read Excel file
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      if (data.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'File Excel không có dữ liệu'
        });
      }

      const db = Database.getInstance();
      let imported = 0;
      const errors: any[] = [];

      // Helper function to convert Excel date serial number to MySQL date format
      const convertExcelDate = (value: any): string | null => {
        if (!value) return null;
        
        // If it's already a string in YYYY-MM-DD format, return as is
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
          return value;
        }
        
        // If it's a number (Excel serial date), convert it
        if (typeof value === 'number') {
          try {
            // Excel serial date starts from 1900-01-01 (but Excel incorrectly treats 1900 as leap year)
            const excelEpoch = new Date(1899, 11, 30); // December 30, 1899
            const date = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
            
            // Format as YYYY-MM-DD
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            
            return `${year}-${month}-${day}`;
          } catch (error) {
            console.error('Error converting Excel date:', value, error);
            return null;
          }
        }
        
        // Try to parse other date formats
        if (typeof value === 'string') {
          try {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              return `${year}-${month}-${day}`;
            }
          } catch (error) {
            console.error('Error parsing date string:', value, error);
          }
        }
        
        return null;
      };

      for (let i = 0; i < data.length; i++) {
        const row: any = data[i];
        
        try {
          // Convert Excel date to proper format
          const ngaySinh = convertExcelDate(row['Ngày sinh'] || row['ngay_sinh']);
          
          // Map Excel columns to database fields
          const customerData = {
            ma_khach_hang: row['Mã khách hàng'] || row['ma_khach_hang'],
            ten_khach_hang: row['Tên khách hàng'] || row['ten_khach_hang'],
            so_dien_thoai: row['Số điện thoại'] || row['so_dien_thoai'],
            email: row['Email'] || row['email'],
            dia_chi: row['Địa chỉ'] || row['dia_chi'],
            ngay_sinh: ngaySinh,
            gioi_tinh: row['Giới tính'] || row['gioi_tinh'],
            loai_khach_hang: row['Loại khách hàng'] || row['loai_khach_hang'] || 'Bán lẻ',
            han_muc_tin_dung: Number(row['Hạn mức tín dụng'] || row['han_muc_tin_dung']) || 0,
            so_du_hien_tai: Number(row['Số dư hiện tại'] || row['so_du_hien_tai']) || 0,
            diem_tich_luy: Number(row['Điểm tích lũy'] || row['diem_tich_luy']) || 0,
            ghi_chu: row['Ghi chú'] || row['ghi_chu'],
            trang_thai: row['Trạng thái'] || row['trang_thai'] || 'Hoạt động'
          };

          // Validate required fields
          if (!customerData.ma_khach_hang || !customerData.ten_khach_hang) {
            errors.push({
              row: i + 2,
              error: 'Mã khách hàng và tên khách hàng là bắt buộc',
              data: { ma_khach_hang: customerData.ma_khach_hang, ten_khach_hang: customerData.ten_khach_hang }
            });
            continue;
          }

          // Check if customer already exists
          const existingCustomer = await db.get(
            'SELECT id FROM customers WHERE ma_khach_hang = ?',
            [customerData.ma_khach_hang]
          );

          if (existingCustomer) {
            // Update existing customer
            await db.run(
              `UPDATE customers SET 
                ten_khach_hang = ?, so_dien_thoai = ?, email = ?, dia_chi = ?,
                ngay_sinh = ?, gioi_tinh = ?, loai_khach_hang = ?,
                han_muc_tin_dung = ?, so_du_hien_tai = ?, diem_tich_luy = ?,
                ghi_chu = ?, trang_thai = ?, ngay_cap_nhat = CURRENT_TIMESTAMP
              WHERE ma_khach_hang = ?`,
              [
                customerData.ten_khach_hang,
                customerData.so_dien_thoai,
                customerData.email,
                customerData.dia_chi,
                customerData.ngay_sinh,
                customerData.gioi_tinh,
                customerData.loai_khach_hang,
                customerData.han_muc_tin_dung,
                customerData.so_du_hien_tai,
                customerData.diem_tich_luy,
                customerData.ghi_chu,
                customerData.trang_thai,
                customerData.ma_khach_hang
              ]
            );
          } else {
            // Create new customer
            await db.run(
              `INSERT INTO customers (
                ma_khach_hang, ten_khach_hang, so_dien_thoai, dia_chi, email,
                ngay_sinh, gioi_tinh, loai_khach_hang, han_muc_tin_dung,
                so_du_hien_tai, diem_tich_luy, ghi_chu, trang_thai
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                customerData.ma_khach_hang,
                customerData.ten_khach_hang,
                customerData.so_dien_thoai,
                customerData.dia_chi,
                customerData.email,
                customerData.ngay_sinh,
                customerData.gioi_tinh,
                customerData.loai_khach_hang,
                customerData.han_muc_tin_dung,
                customerData.so_du_hien_tai,
                customerData.diem_tich_luy,
                customerData.ghi_chu,
                customerData.trang_thai
              ]
            );
          }

          imported++;
        } catch (error) {
          console.error(`Error processing row ${i + 2}:`, error);
          errors.push({
            row: i + 2,
            error: error instanceof Error ? error.message : 'Unknown error',
            data: {
              ma_khach_hang: row['Mã khách hàng'] || row['ma_khach_hang'],
              ten_khach_hang: row['Tên khách hàng'] || row['ten_khach_hang']
            }
          });
        }
      }

      res.json({
        success: true,
        data: {
          imported,
          errors,
          total_rows: data.length
        },
        message: `Import thành công ${imported}/${data.length} khách hàng${errors.length > 0 ? `, ${errors.length} lỗi` : ''}`
      });
    } catch (error) {
      console.error('Import customers error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
} 