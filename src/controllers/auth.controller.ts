import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Database from '../database/connection';
import { User, CreateUserRequest, LoginRequest } from '../types';
import { AuthRequest } from '../middleware/auth';
import { config } from '../config';

const JWT_SECRET = config.JWT_SECRET;

export class AuthController {
  // Instance methods for binding
  async login(req: Request<{}, {}, LoginRequest>, res: Response) {
    return AuthController.login(req, res);
  }

  async getProfile(req: AuthRequest, res: Response) {
    return AuthController.getCurrentUser(req, res);
  }

  async createUser(req: Request<{}, {}, CreateUserRequest>, res: Response) {
    return AuthController.createUser(req, res);
  }

  async getUsers(req: Request, res: Response) {
    return AuthController.getUsers(req, res);
  }

  async updateUser(req: Request, res: Response) {
    return AuthController.updateUser(req, res);
  }

  // Static methods
  static async login(req: Request<{}, {}, LoginRequest>, res: Response) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          error: 'Username và password là bắt buộc'
        });
      }

      const db = Database.getInstance();
      const user = await db.get(
        'SELECT * FROM users WHERE username = ? AND is_active = 1',
        [username]
      ) as User;

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Tên đăng nhập hoặc mật khẩu không đúng'
        });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          error: 'Tên đăng nhập hoặc mật khẩu không đúng'
        });
      }

      // Update last login
      await db.run(
        'UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [user.id]
      );

      const token = jwt.sign(
        { 
          id: user.id,
          userId: user.id, 
          username: user.username, 
          role: user.role 
        },
        JWT_SECRET,
        { expiresIn: '8h' }
      );

      const userResponse = {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        is_active: user.is_active
      };

      res.json({
        success: true,
        data: {
          user: userResponse,
          token
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: 'Lỗi server'
      });
    }
  }

  static async getCurrentUser(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId || (req as any).user.id;
      const db = Database.getInstance();
      
      const user = await db.get(
        'SELECT id, username, full_name, email, role, is_active, created_at FROM users WHERE id = ?',
        [userId]
      ) as User;

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Người dùng không tồn tại'
        });
      }

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json({
        success: false,
        error: 'Lỗi server'
      });
    }
  }

  static async createUser(req: Request<{}, {}, CreateUserRequest>, res: Response) {
    try {
      const { username, password, full_name, email, role } = req.body;
      const currentUser = (req as any).user;

      // Only admin can create users
      if (currentUser.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Không có quyền thực hiện thao tác này'
        });
      }

      if (!username || !password || !full_name || !role) {
        return res.status(400).json({
          success: false,
          error: 'Username, password, full_name và role là bắt buộc'
        });
      }

      const db = Database.getInstance();

      // Check if username already exists
      const existingUser = await db.get(
        'SELECT id FROM users WHERE username = ?',
        [username]
      ) as User;

      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'Tên đăng nhập đã tồn tại'
        });
      }

      const saltRounds = 10;
      const password_hash = await bcrypt.hash(password, saltRounds);

      const result = await db.run(
        `INSERT INTO users (username, password_hash, full_name, email, role, is_active) 
         VALUES (?, ?, ?, ?, ?, 1)`,
        [username, password_hash, full_name, email || null, role]
      );

      res.status(201).json({
        success: true,
        data: {
          id: result.lastID,
          username,
          full_name,
          email,
          role,
          is_active: true
        }
      });
    } catch (error) {
      console.error('Create user error:', error);
      res.status(500).json({
        success: false,
        error: 'Lỗi server'
      });
    }
  }

  static async getUsers(req: Request, res: Response) {
    try {
      const currentUser = (req as any).user;

      // Only admin can view all users
      if (currentUser.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Không có quyền thực hiện thao tác này'
        });
      }

      const db = Database.getInstance();
      const users = await db.all(
        'SELECT id, username, full_name, email, role, is_active, created_at, updated_at FROM users ORDER BY created_at DESC'
      ) as User[];

      res.json({
        success: true,
        data: users
      });
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({
        success: false,
        error: 'Lỗi server'
      });
    }
  }

  static async updateUser(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.id);
      const { full_name, email, role, is_active } = req.body;
      const currentUser = (req as any).user;

      // Only admin can update users, or users can update themselves (limited fields)
      if (currentUser.role !== 'admin' && currentUser.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Không có quyền thực hiện thao tác này'
        });
      }

      const db = Database.getInstance();

      // If not admin, only allow updating own profile (limited fields)
      if (currentUser.role !== 'admin') {
        await db.run(
          'UPDATE users SET full_name = ?, email = ? WHERE id = ?',
          [full_name, email, userId]
        );
      } else {
        await db.run(
          'UPDATE users SET full_name = ?, email = ?, role = ?, is_active = ? WHERE id = ?',
          [full_name, email, role, is_active, userId]
        );
      }

      res.json({
        success: true,
        message: 'Cập nhật thông tin thành công'
      });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({
        success: false,
        error: 'Lỗi server'
      });
    }
  }

  static async changePassword(req: Request, res: Response) {
    try {
      const { current_password, new_password } = req.body;
      const userId = (req as any).user.userId;

      if (!current_password || !new_password) {
        return res.status(400).json({
          success: false,
          error: 'Mật khẩu hiện tại và mật khẩu mới là bắt buộc'
        });
      }

      const db = Database.getInstance();
      const users = await db.get(
        'SELECT password_hash FROM users WHERE id = ?',
        [userId]
      ) as User;

      if (!users) {
        return res.status(404).json({
          success: false,
          error: 'Người dùng không tồn tại'
        });
      }

      const isCurrentPasswordValid = await bcrypt.compare(current_password, users.password_hash);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          error: 'Mật khẩu hiện tại không đúng'
        });
      }

      const saltRounds = 10;
      const new_password_hash = await bcrypt.hash(new_password, saltRounds);

      await db.run(
        'UPDATE users SET password_hash = ? WHERE id = ?',
        [new_password_hash, userId]
      );

      res.json({
        success: true,
        message: 'Đổi mật khẩu thành công'
      });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        error: 'Lỗi server'
      });
    }
  }
} 