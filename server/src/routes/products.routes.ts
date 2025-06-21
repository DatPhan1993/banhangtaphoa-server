import { Router } from 'express';
import multer from 'multer';
import { ProductsController } from '../controllers/products.controller';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();
const productsController = new ProductsController();

// Configure multer for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept Excel files
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel' ||
        file.originalname.endsWith('.xlsx') ||
        file.originalname.endsWith('.xls')) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file Excel (.xlsx, .xls)'));
    }
  }
});

// Test export without auth (temporary for debugging)
router.get('/export-test', productsController.testExportProducts.bind(productsController));

// Import products from Excel file (test without auth)
router.post('/import-test', upload.single('excel'), productsController.importProducts.bind(productsController));

// All authenticated users can view products
router.get('/', authenticateToken, productsController.getProducts.bind(productsController));
router.get('/dashboard-stats', authenticateToken, productsController.getDashboardStats.bind(productsController));
router.get('/export', authenticateToken, authorizeRoles(['admin', 'warehouse', 'sales']), productsController.exportProducts.bind(productsController));
router.post('/import', authenticateToken, authorizeRoles(['admin', 'warehouse']), upload.single('excel'), productsController.importProducts.bind(productsController));
router.get('/low-stock', authenticateToken, productsController.getLowStockProducts.bind(productsController));
router.get('/:id', authenticateToken, productsController.getProduct.bind(productsController));

// Admin and warehouse can manage products
router.post('/', authenticateToken, authorizeRoles(['admin', 'warehouse']), productsController.createProduct.bind(productsController));
router.post('/bulk/create', authenticateToken, authorizeRoles(['admin', 'warehouse']), productsController.bulkCreateProducts.bind(productsController));
router.put('/:id', authenticateToken, authorizeRoles(['admin', 'warehouse']), productsController.updateProduct.bind(productsController));
router.delete('/:id', authenticateToken, authorizeRoles(['admin']), productsController.deleteProduct.bind(productsController));
router.delete('/bulk/all', authenticateToken, authorizeRoles(['admin']), productsController.deleteAllProducts.bind(productsController));

// Stock adjustments (admin and warehouse only)
router.post('/:id/adjust-stock', authenticateToken, authorizeRoles(['admin', 'warehouse']), productsController.adjustStock.bind(productsController));

export default router; 