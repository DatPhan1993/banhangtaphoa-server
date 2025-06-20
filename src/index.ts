import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config';
import Database from './database/connection';

// Import routes
import authRoutes from './routes/auth.routes';
import productsRoutes from './routes/products.routes';
import salesRoutes from './routes/sales.routes';
import customersRoutes from './routes/customers.routes';
import storeSettingsRoutes from './routes/storeSettings';
import printRoutes from './routes/printRoutes';
import orderExportRoutes from './routes/orderExport.routes';
import qrPaymentsRoutes from './routes/qrPayments.routes';
import reportsRoutes from './routes/reports.routes';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.allowedOrigins,
  credentials: true
}));

// Logging middleware
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: config.environment
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/store-settings', storeSettingsRoutes);
app.use('/api/print', printRoutes);
app.use('/api/orders', orderExportRoutes);
app.use('/api/qr-payments', qrPaymentsRoutes);
app.use('/api/reports', reportsRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found'
  });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error handler:', err);
  
  // Don't expose internal errors in production
  const message = config.environment === 'production' 
    ? 'Internal server error' 
    : err.message;

  res.status(err.status || 500).json({
    success: false,
    error: message,
    ...(config.environment !== 'production' && { stack: err.stack })
  });
});

const PORT = config.port || 3001;

// Initialize database and start server
async function startServer() {
  try {
    console.log('🚀 Starting POS System Server...');
    
    // Initialize database
    const db = Database.getInstance();
    console.log('✅ Database initialized');
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🌟 Server running on port ${PORT}`);
      console.log(`📱 Environment: ${config.environment}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`📊 API Base URL: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('⏹️  SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('⏹️  SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

startServer(); 