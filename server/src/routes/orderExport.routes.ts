import { Router } from 'express';
import multer from 'multer';
import { OrderExportController } from '../controllers/OrderExportController';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.mimetype === 'application/vnd.ms-excel') {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files are allowed'));
    }
  }
});

// Export orders to Excel
router.post('/export', OrderExportController.exportOrders);

// Import orders from Excel
router.post('/import', upload.single('file'), OrderExportController.importOrders);

export default router; 