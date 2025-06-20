"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.config = {
    PORT: process.env.PORT || 5000,
    port: process.env.PORT || 5000,
    NODE_ENV: process.env.NODE_ENV || 'development',
    environment: process.env.NODE_ENV || 'development',
    JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
    DB_PATH: process.env.DB_PATH || './database/pos.db',
    UPLOAD_PATH: process.env.UPLOAD_PATH || './uploads',
    CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
    allowedOrigins: process.env.CORS_ORIGIN || 'http://localhost:3000'
};
