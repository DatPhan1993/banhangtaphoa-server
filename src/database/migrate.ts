import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import { config } from '../config';

async function migrate() {
  let connection: mysql.Connection | null = null;
  
  try {
    // First connect without specifying database to create it if it doesn't exist
    const connectionWithoutDB = await mysql.createConnection({
      host: config.DB_HOST,
      port: Number(config.DB_PORT),
      user: config.DB_USER,
      password: config.DB_PASSWORD
    });

    // Create database if it doesn't exist
    await connectionWithoutDB.execute(`CREATE DATABASE IF NOT EXISTS \`${config.DB_NAME}\``);
    await connectionWithoutDB.end();

    // Now connect to the specific database
    connection = await mysql.createConnection({
      host: config.DB_HOST,
      port: Number(config.DB_PORT),
      user: config.DB_USER,
      password: config.DB_PASSWORD,
      database: config.DB_NAME
    });

    console.log('Connected to MySQL database for migration');

    // Read schema and split into individual statements
    const schemaPath = path.join(__dirname, 'schema.sql');
    console.log('Reading schema from:', schemaPath);
    
    const schema = fs.readFileSync(schemaPath, 'utf8');
    console.log('Schema file size:', schema.length, 'bytes');
    
    // Clean the schema - remove comment lines and empty lines, then split by semicolon
    const cleanedSchema = schema
      .split('\n')
      .filter(line => !line.trim().startsWith('--') && line.trim().length > 0)
      .join('\n');
    
    const statements = cleanedSchema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    console.log('Statements to execute:', statements.length);
    
    // Execute each statement individually
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      try {
        console.log(`Executing statement ${i + 1}/${statements.length}: ${statement.substring(0, 50)}...`);
        await connection.execute(statement);
        console.log(`✓ Statement ${i + 1} executed successfully`);
      } catch (error: any) {
        console.error(`✗ Failed to execute statement ${i + 1}:`, statement.substring(0, 100) + '...');
        console.error('Error:', error.message);
        throw error;
      }
    }
    
    console.log('Database migration completed successfully');

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

if (require.main === module) {
  migrate().catch(console.error);
}

export default migrate; 