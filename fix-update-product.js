const fs = require('fs');

// Read the compiled JS file
const filePath = './dist/controllers/products.controller.js';
let content = fs.readFileSync(filePath, 'utf8');

// Replace the problematic error handling
const oldErrorHandling = `console.error('Error details:', {
        message: error.message,
        code: error.code,
        errno: error.errno,
        sqlState: error.sqlState,
        sqlMessage: error.sqlMessage
      });
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message
      });`;

const newErrorHandling = `res.status(500).json({
        success: false,
        error: 'Internal server error'
      });`;

content = content.replace(oldErrorHandling, newErrorHandling);

// Write back to file
fs.writeFileSync(filePath, content);
console.log('Fixed updateProduct error handling in compiled JS'); 