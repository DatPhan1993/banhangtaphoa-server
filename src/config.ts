export const config = {
  PORT: process.env.PORT || 3001,
  port: process.env.PORT || 3001,
  NODE_ENV: process.env.NODE_ENV || 'development',
  environment: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  // MySQL Configuration
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: process.env.DB_PORT || 3306,
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || 'dat12345',
  DB_NAME: process.env.DB_NAME || 'pos_system',
  UPLOAD_PATH: process.env.UPLOAD_PATH || './uploads',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  allowedOrigins: process.env.CORS_ORIGIN || 'http://localhost:3000'
}; 