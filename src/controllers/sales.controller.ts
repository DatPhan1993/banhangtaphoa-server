import { Response } from 'express';
import Database from '../database/connection';
import { AuthRequest } from '../middleware/auth';
import { CreateSalesOrderRequest, SalesOrder, Product } from '../types';
import { removeVietnameseDiacritics } from '../utils/vietnamese';

export class SalesController {
  // Generate sequential order number in format DH00001, DH00002, etc.
  private static async generateOrderNumber(): Promise<string> {
    const db = Database.getInstance();
    
    // Get the latest order number with DH prefix
    const latestOrder = await db.get(
      `SELECT order_number FROM sales_orders 
       WHERE order_number LIKE 'DH%' 
       ORDER BY order_number DESC 
       LIMIT 1`
    ) as { order_number?: string };

    if (!latestOrder?.order_number) {
      // First order, start with DH00001
      return 'DH00001';
    }

    // Extract number from latest order (e.g., DH00001 -> 1)
    const latestNumber = parseInt(latestOrder.order_number.substring(2));
    const nextNumber = latestNumber + 1;
    
    // Format with leading zeros (5 digits)
    return `DH${nextNumber.toString().padStart(5, '0')}`;
  }

  // Static methods for direct route usage
  static async createOrder(req: AuthRequest, res: Response) {
    const instance = new SalesController();
    return instance.createSalesOrder(req, res);
  }

  static async getOrders(req: AuthRequest, res: Response) {
    const instance = new SalesController();
    return instance.getSalesOrders(req, res);
  }

  static async getOrderById(req: AuthRequest, res: Response) {
    const instance = new SalesController();
    return instance.getSalesOrder(req, res);
  }

  static async updateOrderStatus(req: AuthRequest, res: Response) {
    const instance = new SalesController();
    return instance.updateStatus(req, res);
  }

  static async getDailyReport(req: AuthRequest, res: Response) {
    const instance = new SalesController();
    return instance.getDailySalesReport(req, res);
  }

  static async getSalesStatistics(req: AuthRequest, res: Response) {
    const instance = new SalesController();
    return instance.getStatistics(req, res);
  }

  static async getTopProducts(req: AuthRequest, res: Response) {
    const instance = new SalesController();
    return instance.getTopSellingProducts(req, res);
  }

  async createSalesOrder(req: any, res: Response) {
    try {
      const orderData = req.body;
      console.log('Received order data:', JSON.stringify(orderData, null, 2));

      if (!orderData.items || orderData.items.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Order items are required'
        });
      }

      const db = Database.getInstance();

      // Generate sequential order number
      const orderNumber = await SalesController.generateOrderNumber();

      // Use totals from client (already calculated)
      const subtotal = orderData.subtotal || 0;
      const discountAmount = orderData.discount_amount || 0;
      const totalAmount = orderData.total_amount || subtotal - discountAmount;

      // Validate and prepare items
      const validatedItems = [];

      for (const item of orderData.items) {
        console.log(`Validating product ID: ${item.product_id}`);
        const product = await db.get(
          'SELECT * FROM products WHERE id = ? AND is_active = 1',
          [item.product_id]
        ) as Product;

        if (!product) {
          console.log(`Product not found: ${item.product_id}`);
          return res.status(400).json({
            success: false,
            error: `Product with ID ${item.product_id} not found`
          });
        }

        console.log(`Product found: ${product.name}, stock: ${product.stock_quantity}, track_inventory: ${product.track_inventory}`);
        
        if (product.track_inventory && product.stock_quantity < item.quantity) {
          console.log(`Insufficient stock for ${product.name}. Available: ${product.stock_quantity}, requested: ${item.quantity}`);
          return res.status(400).json({
            success: false,
            error: `Insufficient stock for ${product.name}. Available: ${product.stock_quantity}`
          });
        }

        // Calculate discount amount from percentage
        const itemDiscountAmount = (item.unit_price * item.quantity * (item.discount_percent || 0)) / 100;
        const itemTotal = item.total || ((item.unit_price * item.quantity) - itemDiscountAmount);

        validatedItems.push({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_amount: itemDiscountAmount,
          total_price: itemTotal
        });
      }

      // Create sales order - handle customer_id properly
      let insertSQL: string;
      let insertParams: any[];
      
      // Ensure all values are properly defined
      const safeOrderNumber = orderNumber;
      const safeUserId = (req.user?.id && !isNaN(req.user.id)) ? Number(req.user.id) : 1;
      const safeSubtotal = Number(subtotal) || 0;
      const safeDiscountAmount = Number(discountAmount) || 0;
      const safeTotalAmount = Number(totalAmount) || 0;
      const safePaymentMethod = String(orderData.payment_method || 'cash');
      const safeNotes = String(orderData.notes || '');
      
      if (orderData.customer_id && !isNaN(Number(orderData.customer_id))) {
        // Include customer_id if provided and valid
        insertSQL = `INSERT INTO sales_orders (
          order_number, customer_id, user_id, subtotal, tax_amount, discount_amount,
          total_amount, paid_amount, payment_method, notes, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        insertParams = [
          safeOrderNumber,
          Number(orderData.customer_id),
          safeUserId,
          safeSubtotal,
          0, // tax_amount
          safeDiscountAmount,
          safeTotalAmount,
          safeTotalAmount,
          safePaymentMethod,
          safeNotes,
          'delivered' // status - since payment is completed
        ];
      } else {
        // Skip customer_id if not provided or invalid
        insertSQL = `INSERT INTO sales_orders (
          order_number, user_id, subtotal, tax_amount, discount_amount,
          total_amount, paid_amount, payment_method, notes, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        insertParams = [
          safeOrderNumber,
          safeUserId,
          safeSubtotal,
          0, // tax_amount
          safeDiscountAmount,
          safeTotalAmount,
          safeTotalAmount,
          safePaymentMethod,
          safeNotes,
          'delivered' // status - since payment is completed
        ];
      }
      
      console.log('SQL Query:', insertSQL);
      console.log('SQL Insert parameters:', insertParams);
      console.log('Parameter types:', insertParams.map(p => typeof p));
      console.log('Parameter values:', insertParams.map(p => p === null ? 'NULL' : p === undefined ? 'UNDEFINED' : p));
      console.log('Any undefined?', insertParams.some(p => p === undefined));
      console.log('Any null?', insertParams.some(p => p === null));
      console.log('Parameter count:', insertParams.length);
      
      // Try using direct SQL execution instead of prepared statements
      let directSQL: string;
      if (orderData.customer_id && !isNaN(Number(orderData.customer_id))) {
        directSQL = `INSERT INTO sales_orders (
          order_number, customer_id, user_id, subtotal, tax_amount, discount_amount,
          total_amount, paid_amount, payment_method, notes, status
        ) VALUES (
          '${safeOrderNumber}', ${Number(orderData.customer_id)}, ${safeUserId}, 
          ${safeSubtotal}, 0, ${safeDiscountAmount}, ${safeTotalAmount}, 
          ${safeTotalAmount}, '${safePaymentMethod}', '${safeNotes}', 'delivered'
        )`;
      } else {
        directSQL = `INSERT INTO sales_orders (
          order_number, user_id, subtotal, tax_amount, discount_amount,
          total_amount, paid_amount, payment_method, notes, status
        ) VALUES (
          '${safeOrderNumber}', ${safeUserId}, ${safeSubtotal}, 0, 
          ${safeDiscountAmount}, ${safeTotalAmount}, ${safeTotalAmount}, 
          '${safePaymentMethod}', '${safeNotes}', 'delivered'
        )`;
      }
      
      console.log('Direct SQL:', directSQL);
      
      const orderResult = await db.query(directSQL);

      const orderId = orderResult.insertId;

      // Create order items and update stock
      for (const item of validatedItems) {
        // Insert order item
        await db.run(
          `INSERT INTO sales_order_items (
            sales_order_id, product_id, quantity, unit_price, 
            discount_amount, total_price
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            orderId,
            item.product_id,
            item.quantity,
            item.unit_price,
            item.discount_amount || 0,
            item.total_price
          ]
        );

        // Update product stock if tracking inventory
        const product = await db.get(
          'SELECT track_inventory FROM products WHERE id = ?',
          [item.product_id]
        ) as { track_inventory: boolean };

        if (product.track_inventory) {
          await db.run(
            'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
            [item.quantity, item.product_id]
          );

          // Create inventory transaction
          await db.run(
            `INSERT INTO inventory_transactions (
              product_id, transaction_type, reference_type, reference_id,
              quantity, unit_price, user_id
            ) VALUES (?, 'out', 'sale', ?, ?, ?, ?)`,
            [
              item.product_id,
              orderId,
              item.quantity,
              item.unit_price,
              req.user?.id || 1 // Default to user ID 1 if not authenticated
            ]
          );
        }
      }

      res.status(201).json({
        success: true,
        data: {
          id: orderId,
          order_number: orderNumber,
          total_amount: totalAmount
        },
        message: 'Sales order created successfully'
      });
    } catch (error) {
      console.error('Create sales order error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async getSalesOrders(req: any, res: Response) {
    try {
      const { 
        start_date, 
        end_date, 
        status, 
        customer_id, 
        search,
        limit = 50, 
        offset = 0 
      } = req.query;

      let query = `
        SELECT 
          so.*,
          c.ma_khach_hang,
          c.ten_khach_hang as customer_name,
          c.so_dien_thoai as customer_phone,
          u.full_name as staff_name
        FROM sales_orders so
        LEFT JOIN customers c ON so.customer_id = c.id
        LEFT JOIN users u ON so.user_id = u.id
        WHERE 1=1
      `;

      const params: any[] = [];

      if (start_date) {
        query += ' AND DATE(so.order_date) >= ?';
        params.push(start_date);
      }

      if (end_date) {
        query += ' AND DATE(so.order_date) <= ?';
        params.push(end_date);
      }

      if (status) {
        query += ' AND so.status = ?';
        params.push(status);
      }

      if (customer_id) {
        query += ' AND so.customer_id = ?';
        params.push(customer_id);
      }

      // Vietnamese search support
      if (search) {
        const normalizedSearch = removeVietnameseDiacritics(search.toLowerCase());
        query += ` AND (
          LOWER(so.order_number) LIKE ? OR
          LOWER(c.ten_khach_hang) LIKE ? OR
          c.so_dien_thoai LIKE ? OR
          LOWER(c.ma_khach_hang) LIKE ?
        )`;
        const searchPattern = `%${normalizedSearch}%`;
        params.push(searchPattern, searchPattern, `%${search}%`, searchPattern);
      }

      // Use string concatenation for LIMIT and OFFSET to avoid parameter issues
      const limitNum = parseInt(limit as string) || 50;
      const offsetNum = parseInt(offset as string) || 0;
      query += ` ORDER BY so.order_date DESC LIMIT ${limitNum} OFFSET ${offsetNum}`;

      console.log('getSalesOrders query:', query);
      console.log('getSalesOrders params:', params);
      console.log('Param types:', params.map(p => typeof p));

      const orders = await Database.getInstance().all(query, params);

      // If search is provided, also filter results on the backend for better Vietnamese support
      let filteredOrders = orders;
      if (search) {
        const normalizedSearch = removeVietnameseDiacritics(search.toLowerCase());
        filteredOrders = orders.filter((order: any) => {
          const orderNumber = removeVietnameseDiacritics((order.order_number || '').toLowerCase());
          const customerName = removeVietnameseDiacritics((order.customer_name || '').toLowerCase());
          const customerCode = removeVietnameseDiacritics((order.ma_khach_hang || '').toLowerCase());
          const customerPhone = order.customer_phone || '';
          
          return orderNumber.includes(normalizedSearch) ||
                 customerName.includes(normalizedSearch) ||
                 customerCode.includes(normalizedSearch) ||
                 customerPhone.includes(search);
        });
      }

      res.json({
        success: true,
        data: filteredOrders
      });
    } catch (error) {
      console.error('Get sales orders error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async getSalesOrder(req: any, res: Response) {
    try {
      const { id } = req.params;

      const order = await Database.getInstance().get(
        `SELECT 
          so.*,
          c.ma_khach_hang,
          c.ten_khach_hang as customer_name,
          c.so_dien_thoai as customer_phone,
          u.full_name as staff_name
        FROM sales_orders so
        LEFT JOIN customers c ON so.customer_id = c.id
        LEFT JOIN users u ON so.user_id = u.id
        WHERE so.id = ?`,
        [id]
      );

      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Sales order not found'
        });
      }

      // Get order items
      const items = await Database.getInstance().all(
        `SELECT 
          soi.*,
          p.name as product_name,
          p.sku as product_sku,
          p.unit as product_unit
        FROM sales_order_items soi
        JOIN products p ON soi.product_id = p.id
        WHERE soi.sales_order_id = ?`,
        [id]
      );

      res.json({
        success: true,
        data: {
          ...order,
          items
        }
      });
    } catch (error) {
      console.error('Get sales order error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async getDailySalesReport(req: any, res: Response) {
    try {
      const { date = new Date().toISOString().split('T')[0] } = req.query;

      // Sales summary
      const summary = await Database.getInstance().get(
        `SELECT 
          COUNT(*) as total_orders,
          SUM(total_amount) as total_revenue,
          SUM(subtotal) as total_subtotal,
          SUM(discount_amount) as total_discount,
          AVG(total_amount) as average_order_value
        FROM sales_orders 
        WHERE DATE(order_date) = ? AND status != 'cancelled'`,
        [date]
      );

      // Payment method breakdown
      const paymentMethods = await Database.getInstance().all(
        `SELECT 
          payment_method,
          COUNT(*) as count,
          SUM(total_amount) as total
        FROM sales_orders 
        WHERE DATE(order_date) = ? AND status != 'cancelled'
        GROUP BY payment_method`,
        [date]
      );

      // Top selling products
      const topProducts = await Database.getInstance().all(
        `SELECT 
          p.name,
          p.sku,
          SUM(soi.quantity) as total_quantity,
          SUM(soi.total_price) as total_revenue
        FROM sales_order_items soi
        JOIN products p ON soi.product_id = p.id
        JOIN sales_orders so ON soi.sales_order_id = so.id
        WHERE DATE(so.order_date) = ? AND so.status != 'cancelled'
        GROUP BY p.id, p.name, p.sku
        ORDER BY total_quantity DESC
        LIMIT 10`,
        [date]
      );

      // Hourly sales
      const hourlySales = await Database.getInstance().all(
        `SELECT 
          CAST(strftime('%H', order_date) AS INTEGER) as hour,
          COUNT(*) as orders,
          SUM(total_amount) as revenue
        FROM sales_orders 
        WHERE DATE(order_date) = ? AND status != 'cancelled'
        GROUP BY CAST(strftime('%H', order_date) AS INTEGER)
        ORDER BY hour`,
        [date]
      );

      res.json({
        success: true,
        data: {
          date,
          summary,
          payment_methods: paymentMethods,
          top_products: topProducts,
          hourly_sales: hourlySales
        }
      });
    } catch (error) {
      console.error('Get daily sales report error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async updateStatus(req: any, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid status'
        });
      }

      const db = Database.getInstance();
      const result = await db.run(
        'UPDATE sales_orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [status, id]
      );

      if (result.changes === 0) {
        return res.status(404).json({
          success: false,
          error: 'Sales order not found'
        });
      }

      res.json({
        success: true,
        message: 'Order status updated successfully'
      });
    } catch (error) {
      console.error('Update order status error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async getStatistics(req: any, res: Response) {
    try {
      const db = Database.getInstance();
      
      // Today's statistics
      const today = new Date().toISOString().split('T')[0];
      
      const todayStats = await db.get(
        `SELECT 
          COUNT(*) as total_orders,
          SUM(total_amount) as total_revenue,
          AVG(total_amount) as average_order_value
        FROM sales_orders 
        WHERE DATE(order_date) = ? AND status != 'cancelled'`,
        [today]
      );

      // This month's statistics
      const thisMonth = new Date().toISOString().substr(0, 7);
      
      const monthStats = await db.get(
        `SELECT 
          COUNT(*) as total_orders,
          SUM(total_amount) as total_revenue
        FROM sales_orders 
        WHERE strftime('%Y-%m', order_date) = ? AND status != 'cancelled'`,
        [thisMonth]
      );

      // Low stock products
      const lowStockProducts = await db.all(
        `SELECT name, stock_quantity, min_stock_level
        FROM products 
        WHERE track_inventory = 1 AND stock_quantity <= min_stock_level AND is_active = 1
        ORDER BY stock_quantity ASC`,
        []
      );

      res.json({
        success: true,
        data: {
          today: todayStats,
          month: monthStats,
          low_stock: lowStockProducts
        }
      });
    } catch (error) {
      console.error('Get statistics error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  async getTopSellingProducts(req: any, res: Response) {
    try {
      const { days = 30, limit = 10 } = req.query;
      
      const db = Database.getInstance();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - Number(days));

      const topProducts = await db.all(
        `SELECT 
          p.name,
          p.sku,
          p.unit,
          SUM(soi.quantity) as total_quantity,
          SUM(soi.total_price) as total_revenue,
          COUNT(DISTINCT soi.sales_order_id) as order_count
        FROM sales_order_items soi
        JOIN products p ON soi.product_id = p.id
        JOIN sales_orders so ON soi.sales_order_id = so.id
        WHERE so.order_date >= ? AND so.status != 'cancelled'
        GROUP BY p.id, p.name, p.sku, p.unit
        ORDER BY total_quantity DESC
        LIMIT ?`,
        [startDate.toISOString(), Number(limit)]
      );

      res.json({
        success: true,
        data: topProducts
      });
    } catch (error) {
      console.error('Get top products error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
} 