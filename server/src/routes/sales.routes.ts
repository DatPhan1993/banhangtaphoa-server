import { Router } from 'express';
import { SalesController } from '../controllers/sales.controller';
import { authenticateToken, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Create sales order (staff and admin)
router.post('/orders', authorize(['staff', 'admin']), SalesController.createOrder);

// Get sales orders (admin can see all, staff can see own)
router.get('/orders', SalesController.getOrders);

// Get specific sales order
router.get('/orders/:id', SalesController.getOrderById);

// Update sales order status (admin only)
router.put('/orders/:id/status', authorize(['admin']), SalesController.updateOrderStatus);

// Get daily sales report (admin only)
router.get('/reports/daily', authorize(['admin']), SalesController.getDailyReport);

// Get sales statistics (admin only)
router.get('/statistics', authorize(['admin']), SalesController.getSalesStatistics);

// Get top products (admin only)
router.get('/top-products', authorize(['admin']), SalesController.getTopProducts);

export default router; 