const { execSync } = require('child_process');

async function createQRPaymentsTable() {
  try {
    console.log('Creating QR payments table...');
    
    // First, compile TypeScript
    console.log('Compiling TypeScript...');
    execSync('npx tsc', { stdio: 'inherit' });
    
    // Now import the compiled JavaScript
    const Database = require('./dist/database/connection').default;
    
    const db = Database.getInstance();
    
    // Create QR payment accounts table (MySQL syntax)
    await db.query(`
      CREATE TABLE IF NOT EXISTS qr_payment_accounts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        provider_id VARCHAR(50) NOT NULL,
        provider_name VARCHAR(100) NOT NULL,
        provider_type ENUM('bank', 'ewallet') NOT NULL,
        account_number VARCHAR(50) NOT NULL,
        account_owner VARCHAR(255) NOT NULL,
        phone_number VARCHAR(20) NOT NULL,
        terms_agreed TINYINT(1) NOT NULL DEFAULT 0,
        status ENUM('active', 'inactive', 'deleted') NOT NULL DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_provider_account (provider_id, account_number)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    console.log('✅ QR payments table created successfully');
    
    // Insert some sample data for testing
    const sampleData = [
      {
        provider_id: 'vib',
        provider_name: 'VIB',
        provider_type: 'bank',
        account_number: '9969866687',
        account_owner: 'PHAN VAN DAT',
        phone_number: '0123456789',
        terms_agreed: 1
      },
      {
        provider_id: 'vib',
        provider_name: 'VIB',
        provider_type: 'bank',
        account_number: '9356877889',
        account_owner: 'PHAN VAN HUONG',
        phone_number: '0987654321',
        terms_agreed: 1
      },
      {
        provider_id: 'vietcombank',
        provider_name: 'Vietcombank',
        provider_type: 'bank',
        account_number: '1234567890',
        account_owner: 'NGUYEN VAN A',
        phone_number: '0555666777',
        terms_agreed: 1
      }
    ];
    
    for (const data of sampleData) {
      await db.run(`
        INSERT IGNORE INTO qr_payment_accounts (
          provider_id, provider_name, provider_type, account_number,
          account_owner, phone_number, terms_agreed, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
      `, [
        data.provider_id,
        data.provider_name,
        data.provider_type,
        data.account_number,
        data.account_owner,
        data.phone_number,
        data.terms_agreed
      ]);
    }
    
    console.log('✅ Sample QR payment data inserted');
    
    // Show current data
    const accounts = await db.all('SELECT * FROM qr_payment_accounts');
    console.log('\nCurrent QR payment accounts:');
    console.table(accounts);
    
  } catch (error) {
    console.error('❌ Error creating QR payments table:', error);
  }
}

createQRPaymentsTable(); 