import { Response } from 'express';
import Database from '../database/connection';
import { AuthRequest } from '../middleware/auth';

export class QRPaymentsController {
  // Register QR payment provider
  static async registerProvider(req: AuthRequest, res: Response) {
    console.log('=== QR Payment Registration Request ===');
    console.log('Body:', req.body);
    console.log('User:', req.user);
    
    try {
      const {
        provider_id,
        provider_name,
        provider_type,
        account_number,
        account_owner,
        phone_number,
        terms_agreed
      } = req.body;

      console.log('Extracted data:', {
        provider_id,
        provider_name,
        provider_type,
        account_number,
        account_owner,
        phone_number,
        terms_agreed
      });

      // Validate required fields
      if (!provider_id || !provider_name || !provider_type || !account_number || !account_owner || !phone_number) {
        console.log('Missing required fields');
        return res.status(400).json({
          success: false,
          error: 'Vui lòng điền đầy đủ thông tin bắt buộc'
        });
      }

      if (!terms_agreed) {
        console.log('Terms not agreed');
        return res.status(400).json({
          success: false,
          error: 'Vui lòng đồng ý với điều khoản sử dụng dịch vụ'
        });
      }

      // Validate provider_type
      if (!['bank', 'ewallet'].includes(provider_type)) {
        console.log('Invalid provider type:', provider_type);
        return res.status(400).json({
          success: false,
          error: 'Loại nhà cung cấp không hợp lệ'
        });
      }

      // Validate account number format (basic validation)
      if (account_number.length < 6 || account_number.length > 20) {
        console.log('Invalid account number length:', account_number.length);
        return res.status(400).json({
          success: false,
          error: 'Số tài khoản phải có từ 6-20 ký tự'
        });
      }

      // Validate phone number format (basic validation)
      const phoneRegex = /^[0-9]{10,11}$/;
      if (!phoneRegex.test(phone_number.replace(/\s+/g, ''))) {
        console.log('Invalid phone number:', phone_number);
        return res.status(400).json({
          success: false,
          error: 'Số điện thoại không hợp lệ (10-11 chữ số)'
        });
      }

      // Validate account owner name
      if (account_owner.trim().length < 2) {
        console.log('Invalid account owner name:', account_owner);
        return res.status(400).json({
          success: false,
          error: 'Tên chủ tài khoản phải có ít nhất 2 ký tự'
        });
      }

      console.log('All validations passed, getting database instance...');
      const db = Database.getInstance();

      console.log('Checking for existing account...');
      // Check if account already exists for this provider
      const existingAccount = await db.get(
        'SELECT id, account_owner, status FROM qr_payment_accounts WHERE provider_id = ? AND account_number = ?',
        [provider_id, account_number]
      );

      console.log('Existing account check result:', existingAccount);

      if (existingAccount) {
        if (existingAccount.status === 'active') {
          console.log('Account already exists and is active');
          return res.status(400).json({
            success: false,
            error: `Số tài khoản ${account_number} đã được đăng ký cho ${provider_name} bởi ${existingAccount.account_owner}`
          });
        } else if (existingAccount.status === 'inactive') {
          console.log('Account exists but is inactive');
          return res.status(400).json({
            success: false,
            error: `Số tài khoản ${account_number} đã bị vô hiệu hóa. Vui lòng liên hệ hỗ trợ để kích hoạt lại`
          });
        }
      }

      console.log('Checking for existing phone number...');
      // Check if phone number is already registered with different account for same provider
      const existingPhone = await db.get(
        'SELECT account_number FROM qr_payment_accounts WHERE provider_id = ? AND phone_number = ? AND account_number != ?',
        [provider_id, phone_number, account_number]
      );

      console.log('Existing phone check result:', existingPhone);

      if (existingPhone) {
        console.log('Phone number already registered with different account');
        return res.status(400).json({
          success: false,
          error: `Số điện thoại ${phone_number} đã được đăng ký với tài khoản ${existingPhone.account_number} tại ${provider_name}`
        });
      }

      // Clean and format data
      const cleanAccountNumber = account_number.trim();
      const cleanAccountOwner = account_owner.trim().toUpperCase();
      const cleanPhoneNumber = phone_number.replace(/\s+/g, '');

      console.log('Cleaned data:', {
        cleanAccountNumber,
        cleanAccountOwner,
        cleanPhoneNumber
      });

      console.log('Inserting new registration...');
      // Insert new registration using MySQL syntax
      const result = await db.run(
        `INSERT INTO qr_payment_accounts (
          provider_id, provider_name, provider_type, account_number, 
          account_owner, phone_number, terms_agreed, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          provider_id,
          provider_name,
          provider_type,
          cleanAccountNumber,
          cleanAccountOwner,
          cleanPhoneNumber,
          terms_agreed ? 1 : 0,
          'active'
        ]
      );

      console.log('Insert result:', result);

      // Return success response with detailed info
      const responseData = {
        success: true,
        data: {
          id: result.insertId,
          provider_name,
          account_number: cleanAccountNumber,
          account_owner: cleanAccountOwner,
          phone_number: cleanPhoneNumber,
          message: 'Đăng ký dịch vụ thông báo thanh toán QR thành công!'
        }
      };

      console.log('Sending success response:', responseData);
      res.json(responseData);

    } catch (error: any) {
      console.error('=== QR Payment Registration Error ===');
      console.error('Error details:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      // Handle MySQL specific errors
      if (error.code === 'ER_DUP_ENTRY') {
        console.log('Duplicate entry error');
        return res.status(400).json({
          success: false,
          error: 'Tài khoản này đã được đăng ký trước đó'
        });
      }

      if (error.code === 'ER_NO_SUCH_TABLE') {
        console.log('Table does not exist error');
        return res.status(500).json({
          success: false,
          error: 'Lỗi cơ sở dữ liệu. Vui lòng liên hệ quản trị viên'
        });
      }

      console.log('Sending generic error response');
      res.status(500).json({
        success: false,
        error: 'Lỗi hệ thống. Vui lòng thử lại sau.'
      });
    }
  }

  // Get all registered accounts for a user
  static async getRegisteredAccounts(req: AuthRequest, res: Response) {
    try {
      const db = Database.getInstance();
      
      const accounts = await db.all(
        `SELECT 
          id, provider_id, provider_name, provider_type, 
          account_number, account_owner, phone_number, 
          status, created_at, updated_at
        FROM qr_payment_accounts 
        WHERE status = 'active'
        ORDER BY provider_name, created_at DESC`
      );

      // Map provider_id to bank BIN codes for frontend compatibility
      const bankBinMapping: { [key: string]: string } = {
        'vietcombank': '970436',
        'vib': '970441',
        'techcombank': '970407',
        'acb': '970416',
        'sacombank': '970403',
        'mb': '970422',
        'tpbank': '970423',
        'agribank': '970405',
        'bidv': '970418',
        'vpbank': '970432'
      };

      // Transform accounts to include correct provider_id (bank BIN)
      const transformedAccounts = accounts.map((account: any) => ({
        ...account,
        provider_id: bankBinMapping[account.provider_id.toLowerCase()] || account.provider_id
      }));

      res.json({
        success: true,
        data: transformedAccounts
      });

    } catch (error) {
      console.error('Get registered accounts error:', error);
      res.status(500).json({
        success: false,
        error: 'Lỗi hệ thống. Vui lòng thử lại sau.'
      });
    }
  }

  // Deactivate/Cancel a registered account
  static async deactivateAccount(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'ID tài khoản không hợp lệ'
        });
      }

      const db = Database.getInstance();

      // Check if account exists
      const account = await db.get(
        'SELECT id, provider_name, account_number, account_owner FROM qr_payment_accounts WHERE id = ?',
        [id]
      );

      if (!account) {
        return res.status(404).json({
          success: false,
          error: 'Không tìm thấy tài khoản'
        });
      }

      // Update status to inactive
      await db.run(
        'UPDATE qr_payment_accounts SET status = ?, updated_at = NOW() WHERE id = ?',
        ['inactive', id]
      );

      res.json({
        success: true,
        data: {
          message: `Đã hủy đăng ký tài khoản ${account.account_number} tại ${account.provider_name}`
        }
      });

    } catch (error) {
      console.error('Deactivate account error:', error);
      res.status(500).json({
        success: false,
        error: 'Lỗi hệ thống. Vui lòng thử lại sau.'
      });
    }
  }
} 