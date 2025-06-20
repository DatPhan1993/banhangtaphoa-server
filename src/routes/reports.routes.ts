import { Router } from 'express';
import { ReportsController } from '../controllers/reports.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Business reports
router.get('/business-overview', ReportsController.getBusinessOverview);

// Product reports
router.get('/product-overview', ReportsController.getProductOverview);

export default router; 