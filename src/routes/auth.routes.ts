import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();
const authController = new AuthController();

// Public routes
router.post('/login', authController.login.bind(authController));

// Protected routes
router.get('/profile', authenticateToken, authController.getProfile.bind(authController));

// Admin only routes
router.post('/users', authenticateToken, authorizeRoles(['admin']), authController.createUser.bind(authController));
router.get('/users', authenticateToken, authorizeRoles(['admin']), authController.getUsers.bind(authController));
router.put('/users/:id', authenticateToken, authorizeRoles(['admin']), authController.updateUser.bind(authController));

export default router; 