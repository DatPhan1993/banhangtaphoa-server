import { Router } from 'express';
import multer from 'multer';
import { CustomersController } from '../controllers/customers.controller';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();
const customersController = new CustomersController();

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

// Apply authentication middleware to all routes
router.use(authenticateToken);

// GET /api/customers - Get all customers with pagination and filters
router.get('/', customersController.getCustomers.bind(customersController));

// GET /api/customers/generate-code - Generate next customer code
router.get('/generate-code', customersController.generateCustomerCode.bind(customersController));

// POST /api/customers/import - Import customers from Excel
router.post('/import', authorizeRoles(['admin', 'sales']), upload.single('file'), customersController.importCustomers.bind(customersController));

// GET /api/customers/:id - Get customer by ID
router.get('/:id', customersController.getCustomer.bind(customersController));

// POST /api/customers - Create new customer
router.post('/', customersController.createCustomer.bind(customersController));

// PUT /api/customers/:id - Update customer
router.put('/:id', customersController.updateCustomer.bind(customersController));

// DELETE /api/customers/:id - Delete customer (soft delete)
router.delete('/:id', customersController.deleteCustomer.bind(customersController));

export default router; 