import { Request, Response } from 'express';
import Database from '../database/connection';

export class ReportsController {
  // Báo cáo tổng quan kinh doanh
  static async getBusinessOverview(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'Start date and end date are required'
        });
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      
      // Tính toán khoảng thời gian trước đó để so sánh
      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      const prevStart = new Date(start.getTime() - daysDiff * 24 * 60 * 60 * 1000);
      const prevEnd = new Date(end.getTime() - daysDiff * 24 * 60 * 60 * 1000);

      const db = Database.getInstance();

      console.log('🔍 Querying data for date range:', startDate, 'to', endDate);

      // Truy vấn dữ liệu hiện tại
      const currentStats = await db.all(`
        SELECT 
          COUNT(*) as total_orders,
          COALESCE(SUM(total_amount), 0) as total_revenue,
          COALESCE(SUM(subtotal * 0.7), 0) as total_cost,
          COALESCE(SUM(total_amount - (subtotal * 0.7)), 0) as total_profit,
          COALESCE(AVG(total_amount), 0) as avg_order_value
        FROM sales_orders 
        WHERE DATE(created_at) BETWEEN ? AND ?
      `, [startDate, endDate]);

      console.log('📊 Current stats query result:', currentStats);

      // Truy vấn dữ liệu kỳ trước
      const prevStats = await db.all(`
        SELECT 
          COUNT(*) as total_orders,
          COALESCE(SUM(total_amount), 0) as total_revenue,
          COALESCE(SUM(subtotal * 0.7), 0) as total_cost,
          COALESCE(SUM(total_amount - (subtotal * 0.7)), 0) as total_profit,
          COALESCE(AVG(total_amount), 0) as avg_order_value
        FROM sales_orders 
        WHERE DATE(created_at) BETWEEN ? AND ?
      `, [prevStart.toISOString().split('T')[0], prevEnd.toISOString().split('T')[0]]);

      // Top sản phẩm theo doanh thu
      const topProductsData = await db.all(`
        SELECT 
          p.name,
          COALESCE(SUM(soi.total), 0) as revenue,
          COALESCE(AVG(soi.total), 0) as avg_revenue,
          COUNT(DISTINCT so.id) as order_count
        FROM products p
        LEFT JOIN sales_order_items soi ON p.id = soi.product_id
        LEFT JOIN sales_orders so ON soi.sales_order_id = so.id
        WHERE DATE(so.created_at) BETWEEN ? AND ?
        GROUP BY p.id, p.name
        HAVING revenue > 0
        ORDER BY revenue DESC
        LIMIT 10
      `, [startDate, endDate]);

      // Top danh mục theo doanh thu
      const topCategoriesData = await db.all(`
        SELECT 
          COALESCE(c.name, 'Không phân loại') as name,
          COALESCE(SUM(soi.total), 0) as revenue,
          COALESCE(AVG(soi.total), 0) as avg_revenue,
          COUNT(DISTINCT so.id) as order_count
        FROM categories c
        RIGHT JOIN products p ON c.id = p.category_id
        LEFT JOIN sales_order_items soi ON p.id = soi.product_id
        LEFT JOIN sales_orders so ON soi.sales_order_id = so.id
        WHERE DATE(so.created_at) BETWEEN ? AND ?
        GROUP BY c.id, c.name
        HAVING revenue > 0
        ORDER BY revenue DESC
        LIMIT 10
      `, [startDate, endDate]);

      // Top danh mục theo số hóa đơn
      const topCategoriesByOrdersData = await db.all(`
        SELECT 
          COALESCE(c.name, 'Không phân loại') as name,
          COUNT(DISTINCT so.id) as order_count
        FROM categories c
        RIGHT JOIN products p ON c.id = p.category_id
        LEFT JOIN sales_order_items soi ON p.id = soi.product_id
        LEFT JOIN sales_orders so ON soi.sales_order_id = so.id
        WHERE DATE(so.created_at) BETWEEN ? AND ?
        GROUP BY c.id, c.name
        HAVING order_count > 0
        ORDER BY order_count DESC
        LIMIT 10
      `, [startDate, endDate]);

      // Top sản phẩm theo số hóa đơn
      const topProductsByOrdersData = await db.all(`
        SELECT 
          p.name,
          COUNT(DISTINCT so.id) as order_count
        FROM products p
        LEFT JOIN sales_order_items soi ON p.id = soi.product_id
        LEFT JOIN sales_orders so ON soi.sales_order_id = so.id
        WHERE DATE(so.created_at) BETWEEN ? AND ?
        GROUP BY p.id, p.name
        HAVING order_count > 0
        ORDER BY order_count DESC
        LIMIT 10
      `, [startDate, endDate]);

      // Dữ liệu hàng ngày
      const dailyStatsData = await db.all(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as orders,
          COALESCE(SUM(total_amount), 0) as revenue,
          COALESCE(SUM(subtotal * 0.7), 0) as cost,
          COALESCE(SUM(total_amount - (subtotal * 0.7)), 0) as profit
        FROM sales_orders 
        WHERE DATE(created_at) BETWEEN ? AND ?
        GROUP BY DATE(created_at)
        ORDER BY date
      `, [startDate, endDate]);

      const current = currentStats[0] || { total_orders: 0, total_revenue: 0, total_cost: 0, total_profit: 0, avg_order_value: 0 };
      const previous = prevStats[0] || { total_orders: 0, total_revenue: 0, total_cost: 0, total_profit: 0, avg_order_value: 0 };

      // Tính toán tỷ lệ tăng trưởng
      const calculateGrowth = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
      };

      // Tính toán trung bình hàng ngày
      const avgDailyRevenue = current.total_revenue / (daysDiff || 1);
      const avgDailyCost = current.total_cost / (daysDiff || 1);
      const avgDailyProfit = current.total_profit / (daysDiff || 1);

      // Lấy dữ liệu kỳ trước cho sản phẩm theo doanh thu
      const prevTopProductsData = await db.all(`
        SELECT 
          p.name,
          COALESCE(SUM(soi.total), 0) as revenue,
          COALESCE(AVG(soi.total), 0) as avg_revenue,
          COUNT(DISTINCT so.id) as order_count
        FROM products p
        LEFT JOIN sales_order_items soi ON p.id = soi.product_id
        LEFT JOIN sales_orders so ON soi.sales_order_id = so.id
        WHERE DATE(so.created_at) BETWEEN ? AND ?
        GROUP BY p.id, p.name
        HAVING revenue > 0
        ORDER BY revenue DESC
      `, [prevStart.toISOString().split('T')[0], prevEnd.toISOString().split('T')[0]]);

      // Lấy dữ liệu kỳ trước cho danh mục theo doanh thu
      const prevTopCategoriesData = await db.all(`
        SELECT 
          COALESCE(c.name, 'Không phân loại') as name,
          COALESCE(SUM(soi.total), 0) as revenue,
          COALESCE(AVG(soi.total), 0) as avg_revenue,
          COUNT(DISTINCT so.id) as order_count
        FROM categories c
        RIGHT JOIN products p ON c.id = p.category_id
        LEFT JOIN sales_order_items soi ON p.id = soi.product_id
        LEFT JOIN sales_orders so ON soi.sales_order_id = so.id
        WHERE DATE(so.created_at) BETWEEN ? AND ?
        GROUP BY c.id, c.name
        HAVING revenue > 0
        ORDER BY revenue DESC
      `, [prevStart.toISOString().split('T')[0], prevEnd.toISOString().split('T')[0]]);

      // Tính toán tỷ lệ tăng trưởng cho sản phẩm theo doanh thu
      const topProducts = topProductsData.map((product: any) => {
        const prevProduct = prevTopProductsData.find((prev: any) => prev.name === product.name);
        const prevRevenue = prevProduct ? prevProduct.revenue : 0;
        const growth_rate = calculateGrowth(product.revenue, prevRevenue);
        return {
          ...product,
          growth_rate
        };
      });

      // Tính toán tỷ lệ tăng trưởng cho danh mục theo doanh thu
      const topCategories = topCategoriesData.map((category: any) => {
        const prevCategory = prevTopCategoriesData.find((prev: any) => prev.name === category.name);
        const prevRevenue = prevCategory ? prevCategory.revenue : 0;
        const growth_rate = calculateGrowth(category.revenue, prevRevenue);
        return {
          ...category,
          growth_rate
        };
      });

      // Lấy dữ liệu kỳ trước cho danh mục theo số hóa đơn
      const prevTopCategoriesByOrdersData = await db.all(`
        SELECT 
          COALESCE(c.name, 'Không phân loại') as name,
          COUNT(DISTINCT so.id) as order_count
        FROM categories c
        RIGHT JOIN products p ON c.id = p.category_id
        LEFT JOIN sales_order_items soi ON p.id = soi.product_id
        LEFT JOIN sales_orders so ON soi.sales_order_id = so.id
        WHERE DATE(so.created_at) BETWEEN ? AND ?
        GROUP BY c.id, c.name
        HAVING order_count > 0
        ORDER BY order_count DESC
      `, [prevStart.toISOString().split('T')[0], prevEnd.toISOString().split('T')[0]]);

      // Lấy dữ liệu kỳ trước cho sản phẩm theo số hóa đơn
      const prevTopProductsByOrdersData = await db.all(`
        SELECT 
          p.name,
          COUNT(DISTINCT so.id) as order_count
        FROM products p
        LEFT JOIN sales_order_items soi ON p.id = soi.product_id
        LEFT JOIN sales_orders so ON soi.sales_order_id = so.id
        WHERE DATE(so.created_at) BETWEEN ? AND ?
        GROUP BY p.id, p.name
        HAVING order_count > 0
        ORDER BY order_count DESC
      `, [prevStart.toISOString().split('T')[0], prevEnd.toISOString().split('T')[0]]);

      // Tính toán tỷ lệ tăng trưởng cho danh mục theo số hóa đơn
      const topCategoriesByOrders = topCategoriesByOrdersData.map((category: any) => {
        const prevCategory = prevTopCategoriesByOrdersData.find((prev: any) => prev.name === category.name);
        const prevOrderCount = prevCategory ? prevCategory.order_count : 0;
        const growth_rate = calculateGrowth(category.order_count, prevOrderCount);
        return {
          ...category,
          growth_rate
        };
      });

      // Tính toán tỷ lệ tăng trưởng cho sản phẩm theo số hóa đơn
      const topProductsByOrders = topProductsByOrdersData.map((product: any) => {
        const prevProduct = prevTopProductsByOrdersData.find((prev: any) => prev.name === product.name);
        const prevOrderCount = prevProduct ? prevProduct.order_count : 0;
        const growth_rate = calculateGrowth(product.order_count, prevOrderCount);
        return {
          ...product,
          growth_rate
        };
      });

      // Lấy dữ liệu sản phẩm bán chậm
      const slowSellingProductsData = await db.all(`
        SELECT 
          p.name,
          p.stock_quantity,
          COALESCE(SUM(soi.quantity), 0) as quantity_sold,
          COALESCE(SUM(soi.total), 0) as revenue,
          MAX(so.created_at) as last_sale_date
        FROM products p
        LEFT JOIN sales_order_items soi ON p.id = soi.product_id
        LEFT JOIN sales_orders so ON soi.sales_order_id = so.id AND DATE(so.created_at) BETWEEN ? AND ?
        WHERE p.is_active = 1
        GROUP BY p.id, p.name, p.stock_quantity
        HAVING quantity_sold <= 3 OR quantity_sold IS NULL
        ORDER BY quantity_sold ASC, p.stock_quantity DESC
        LIMIT 20
      `, [start.toISOString().split('T')[0], end.toISOString().split('T')[0]]);

      // Lấy dữ liệu nhóm hàng bán chậm
      const slowSellingCategoriesData = await db.all(`
        SELECT 
          COALESCE(c.name, 'Không phân loại') as name,
          COALESCE(SUM(p.stock_quantity), 0) as stock_quantity,
          COALESCE(SUM(soi.quantity), 0) as quantity_sold,
          COALESCE(SUM(soi.total), 0) as revenue,
          MAX(so.created_at) as last_sale_date
        FROM categories c
        RIGHT JOIN products p ON c.id = p.category_id
        LEFT JOIN sales_order_items soi ON p.id = soi.product_id
        LEFT JOIN sales_orders so ON soi.sales_order_id = so.id AND DATE(so.created_at) BETWEEN ? AND ?
        WHERE p.is_active = 1
        GROUP BY c.id, c.name
        HAVING quantity_sold <= 10 OR quantity_sold IS NULL
        ORDER BY quantity_sold ASC, stock_quantity DESC
        LIMIT 20
      `, [start.toISOString().split('T')[0], end.toISOString().split('T')[0]]);

      const businessStats = {
        totalOrders: current.total_orders,
        totalRevenue: current.total_revenue,
        totalCost: current.total_cost,
        totalProfit: current.total_profit,
        avgOrderValue: current.avg_order_value,
        avgDailyRevenue,
        avgDailyCost,
        avgDailyProfit,
        orderGrowth: calculateGrowth(current.total_orders, previous.total_orders),
        revenueGrowth: calculateGrowth(current.total_revenue, previous.total_revenue),
        costGrowth: calculateGrowth(current.total_cost, previous.total_cost),
        profitGrowth: calculateGrowth(current.total_profit, previous.total_profit),
        topProducts,
        topCategories,
        topCategoriesByOrders,
        topProductsByOrders,
        slowSellingProducts: slowSellingProductsData,
        slowSellingCategories: slowSellingCategoriesData,
        dailyStats: dailyStatsData
      };

      res.json({
        success: true,
        data: businessStats
      });

    } catch (error) {
      console.error('Error getting business overview:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  static async getProductOverview(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          error: 'startDate and endDate are required'
        });
      }

      console.log('📊 Getting product overview for date range:', startDate, 'to', endDate);

      // Get database connection
      const db = Database.getInstance();
      console.log('✅ Database connection established');

      // Calculate total products sold (distinct products)
      console.log('🔍 Calculating total products sold...');
      const totalProductsSoldQuery = `
        SELECT COUNT(DISTINCT p.id) as total_products_sold
        FROM products p
        INNER JOIN sales_order_items soi ON p.id = soi.product_id
        INNER JOIN sales_orders so ON soi.sales_order_id = so.id
        WHERE DATE(so.created_at) BETWEEN ? AND ?
      `;
      console.log('SQL Query:', totalProductsSoldQuery, 'Params:', [startDate, endDate]);
      const totalProductsSoldResult = await db.get(totalProductsSoldQuery, [startDate, endDate]);
      console.log('Total products sold result:', totalProductsSoldResult);
      const totalProductsSold = totalProductsSoldResult?.total_products_sold || 0;

      // Calculate total quantity sold
      console.log('🔍 Calculating total quantity sold...');
      const totalQuantitySoldQuery = `
        SELECT COALESCE(SUM(soi.quantity), 0) as total_quantity_sold
        FROM sales_order_items soi
        INNER JOIN sales_orders so ON soi.sales_order_id = so.id
        WHERE DATE(so.created_at) BETWEEN ? AND ?
      `;
      const totalQuantitySoldResult = await db.get(totalQuantitySoldQuery, [startDate, endDate]);
      console.log('Total quantity sold result:', totalQuantitySoldResult);
      const totalQuantitySold = totalQuantitySoldResult?.total_quantity_sold || 0;

      // Calculate net revenue (total revenue - returns)
      console.log('🔍 Calculating net revenue...');
      const netRevenueQuery = `
        SELECT COALESCE(SUM(soi.total), 0) as net_revenue
        FROM sales_order_items soi
        INNER JOIN sales_orders so ON soi.sales_order_id = so.id
        WHERE DATE(so.created_at) BETWEEN ? AND ?
      `;
      const netRevenueResult = await db.get(netRevenueQuery, [startDate, endDate]);
      console.log('Net revenue result:', netRevenueResult);
      const netRevenue = netRevenueResult?.net_revenue || 0;

      // Calculate gross profit (revenue - cost)
      console.log('🔍 Calculating gross profit...');
      const grossProfitQuery = `
        SELECT COALESCE(SUM(soi.total - (COALESCE(p.purchase_price, 0) * soi.quantity)), 0) as gross_profit
        FROM sales_order_items soi
        INNER JOIN sales_orders so ON soi.sales_order_id = so.id
        INNER JOIN products p ON soi.product_id = p.id
        WHERE DATE(so.created_at) BETWEEN ? AND ?
      `;
      const grossProfitResult = await db.get(grossProfitQuery, [startDate, endDate]);
      console.log('Gross profit result:', grossProfitResult);
      const grossProfit = grossProfitResult?.gross_profit || 0;

      // Get top categories by quantity sold
      console.log('🔍 Getting top categories...');
      const topCategoriesQuery = `
        SELECT 
          COALESCE(c.name, 'Không phân loại') as name,
          COALESCE(SUM(soi.quantity), 0) as quantity_sold,
          0 as quantity_returned,
          COALESCE(SUM(soi.total), 0) as net_revenue,
          COALESCE(SUM(soi.total - (COALESCE(p.purchase_price, 0) * soi.quantity)), 0) as gross_profit
        FROM sales_order_items soi
        INNER JOIN sales_orders so ON soi.sales_order_id = so.id
        INNER JOIN products p ON soi.product_id = p.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE DATE(so.created_at) BETWEEN ? AND ?
        GROUP BY c.id, c.name
        ORDER BY quantity_sold DESC
        LIMIT 10
      `;
      const topCategories = await db.all(topCategoriesQuery, [startDate, endDate]);
      console.log('Top categories result:', topCategories);

      // Get top products by quantity sold
      console.log('🔍 Getting top products...');
      const topProductsQuery = `
        SELECT 
          p.name,
          COALESCE(SUM(soi.quantity), 0) as quantity_sold,
          0 as quantity_returned,
          COALESCE(SUM(soi.total), 0) as net_revenue,
          COALESCE(SUM(soi.total - (COALESCE(p.purchase_price, 0) * soi.quantity)), 0) as gross_profit
        FROM sales_order_items soi
        INNER JOIN sales_orders so ON soi.sales_order_id = so.id
        INNER JOIN products p ON soi.product_id = p.id
        WHERE DATE(so.created_at) BETWEEN ? AND ?
        GROUP BY p.id, p.name
        ORDER BY quantity_sold DESC
        LIMIT 10
      `;
      const topProducts = await db.all(topProductsQuery, [startDate, endDate]);
      console.log('Top products result:', topProducts);

      // Get slow-selling products
      console.log('🔍 Getting slow-selling products...');
      const slowSellingProductsQuery = `
        SELECT 
          p.name,
          p.stock_quantity,
          COALESCE(SUM(soi.quantity), 0) as quantity_sold,
          COALESCE(SUM(soi.total), 0) as revenue,
          MAX(so.created_at) as last_sale_date
        FROM products p
        LEFT JOIN sales_order_items soi ON p.id = soi.product_id
        LEFT JOIN sales_orders so ON soi.sales_order_id = so.id AND DATE(so.created_at) BETWEEN ? AND ?
        WHERE p.is_active = 1
        GROUP BY p.id, p.name, p.stock_quantity
        HAVING quantity_sold <= 3 OR quantity_sold IS NULL
        ORDER BY quantity_sold ASC, p.stock_quantity DESC
        LIMIT 20
      `;
      const slowSellingProducts = await db.all(slowSellingProductsQuery, [startDate, endDate]);
      console.log('Slow selling products result:', slowSellingProducts);

      // Get slow-selling categories
      console.log('🔍 Getting slow-selling categories...');
      const slowSellingCategoriesQuery = `
        SELECT 
          COALESCE(c.name, 'Không phân loại') as name,
          COALESCE(SUM(p.stock_quantity), 0) as stock_quantity,
          COALESCE(SUM(soi.quantity), 0) as quantity_sold,
          COALESCE(SUM(soi.total), 0) as revenue,
          MAX(so.created_at) as last_sale_date
        FROM categories c
        RIGHT JOIN products p ON c.id = p.category_id
        LEFT JOIN sales_order_items soi ON p.id = soi.product_id
        LEFT JOIN sales_orders so ON soi.sales_order_id = so.id AND DATE(so.created_at) BETWEEN ? AND ?
        WHERE p.is_active = 1
        GROUP BY c.id, c.name
        HAVING quantity_sold <= 10 OR quantity_sold IS NULL
        ORDER BY quantity_sold ASC, stock_quantity DESC
        LIMIT 20
      `;
      const slowSellingCategories = await db.all(slowSellingCategoriesQuery, [startDate, endDate]);
      console.log('Slow selling categories result:', slowSellingCategories);

      const response = {
        totalProductsSold,
        totalQuantitySold,
        netRevenue,
        grossProfit,
        topCategories: topCategories || [],
        topProducts: topProducts || [],
        slowSellingProducts: slowSellingProducts || [],
        slowSellingCategories: slowSellingCategories || []
      };

      console.log('✅ Product overview calculated successfully:', response);

      res.json({
        success: true,
        data: response
      });

    } catch (error) {
      console.error('❌ Error getting product overview:', error);
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'Unknown error');
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
} 