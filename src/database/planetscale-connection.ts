import mysql from 'mysql2/promise';
import { config } from '../config';

export class PlanetScaleConnection {
  private static instance: PlanetScaleConnection;
  private pool: mysql.Pool;

  private constructor() {
    // PlanetScale connection configuration
    this.pool = mysql.createPool({
      host: config.DB_HOST,
      user: config.DB_USER,
      password: config.DB_PASSWORD,
      database: config.DB_NAME,
      ssl: {
        rejectUnauthorized: true
      },
      connectionLimit: 10,
      waitForConnections: true,
      queueLimit: 0
    });

    console.log('🌍 Connected to PlanetScale database');
  }

  public static getInstance(): PlanetScaleConnection {
    if (!PlanetScaleConnection.instance) {
      PlanetScaleConnection.instance = new PlanetScaleConnection();
    }
    return PlanetScaleConnection.instance;
  }

  // Execute query and return results
  public async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    try {
      const [rows] = await this.pool.execute(sql, params);
      return rows as T[];
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  // Get single row
  public async get<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    try {
      const [rows] = await this.pool.execute(sql, params);
      const result = rows as T[];
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Database get error:', error);
      throw error;
    }
  }

  // Execute insert/update/delete and return result
  public async run(sql: string, params: any[] = []): Promise<{ affectedRows: number; insertId: number }> {
    try {
      const [result] = await this.pool.execute(sql, params);
      const mysqlResult = result as mysql.ResultSetHeader;
      return {
        affectedRows: mysqlResult.affectedRows,
        insertId: mysqlResult.insertId
      };
    } catch (error) {
      console.error('Database run error:', error);
      throw error;
    }
  }

  // Get all rows (alias for query)
  public async all<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    return this.query<T>(sql, params);
  }

  // Close connection pool
  public async close(): Promise<void> {
    await this.pool.end();
  }

  // Test connection
  public async testConnection(): Promise<boolean> {
    try {
      await this.query('SELECT 1 as test');
      return true;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }
}

export default PlanetScaleConnection; 