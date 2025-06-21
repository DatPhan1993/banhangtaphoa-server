import express from 'express';
import { QRPaymentsController } from '../controllers/qrPayments.controller';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Register QR payment provider
router.post('/register', QRPaymentsController.registerProvider);

// Get all registered accounts
router.get('/accounts', QRPaymentsController.getRegisteredAccounts);

// Deactivate/Cancel a registered account
router.patch('/accounts/:id/deactivate', QRPaymentsController.deactivateAccount);

export default router; 