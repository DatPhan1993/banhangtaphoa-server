import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import ProductsSimpleController from '../controllers/products-simple.controller';

const router = Router();

// Test route for simple update
router.put('/:id', authenticateToken, ProductsSimpleController.updateProduct);

export default router; 