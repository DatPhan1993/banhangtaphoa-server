import { Router } from 'express';
import { StoreSettingsController } from '../controllers/StoreSettingsController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// GET /api/store-settings - Get all store settings
router.get('/', StoreSettingsController.getStoreSettings);

// PUT /api/store-settings - Update store settings
router.put('/', StoreSettingsController.updateStoreSettings);

export default router; 