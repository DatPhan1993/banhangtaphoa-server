import { Router } from 'express';
import { PrintController } from '../controllers/PrintController';

const router = Router();

// Lấy dữ liệu để in hóa đơn theo ID đơn hàng
router.get('/data/:orderId', PrintController.getPrintData);

// Lấy dữ liệu mẫu để test template
router.get('/sample-data', PrintController.getSamplePrintData);

export default router; 