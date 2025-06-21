import mysql from 'mysql2/promise';
import { config } from '../config';

class Database {
  private static instance: Database;
  private pool: mysql.Pool;

  private constructor() {
    // Check if using PlanetScale (SSL required)
    const isPlanetScale = config.DB_HOST?.includes('planetscale') || 
                         config.DB_HOST?.includes('psdb') ||
                         process.env.DATABASE_URL?.includes('planetscale');

    this.pool = mysql.createPool({
      host: config.DB_HOST,
      port: Number(config.DB_PORT) || 3306,
      user: config.DB_USER,
      password: config.DB_PASSWORD,
      database: config.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      ...(isPlanetScale && {
        ssl: {
          rejectUnauthorized: true
        }
      })
    });

    this.testConnection();
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  private async testConnection(): Promise<void> {
    try {
      const connection = await this.pool.getConnection();
      console.log('Connected to MySQL database');
      connection.release();
    } catch (error) {
      console.error('Error connecting to MySQL database:', error);
    }
  }

  public async run(sql: string, params: any[] = []): Promise<any> {
    try {
      const [result] = await this.pool.execute(sql, params);
      return result;
    } catch (error) {
      console.error('SQL Run Error:', error);
      throw error;
    }
  }

  public async query(sql: string): Promise<any> {
    try {
      const [result] = await this.pool.query(sql);
      return result;
    } catch (error) {
      console.error('SQL Query Error:', error);
      throw error;
    }
  }

  public async get(sql: string, params: any[] = []): Promise<any> {
    try {
      const [rows] = await this.pool.execute(sql, params);
      const rowsArray = rows as any[];
      return rowsArray.length > 0 ? rowsArray[0] : null;
    } catch (error) {
      console.error('SQL Get Error:', error);
      throw error;
    }
  }

  public async all(sql: string, params: any[] = []): Promise<any[]> {
    try {
      const [rows] = await this.pool.execute(sql, params);
      return rows as any[];
    } catch (error) {
      console.error('SQL All Error:', error);
      throw error;
    }
  }

  public async close(): Promise<void> {
    try {
      await this.pool.end();
      console.log('Database connection pool closed');
    } catch (error) {
      console.error('Error closing database connection pool:', error);
      throw error;
    }
  }

  public async beginTransaction(): Promise<mysql.PoolConnection> {
    const connection = await this.pool.getConnection();
    await connection.beginTransaction();
    return connection;
  }

  public async commitTransaction(connection: mysql.PoolConnection): Promise<void> {
    await connection.commit();
    connection.release();
  }

  public async rollbackTransaction(connection: mysql.PoolConnection): Promise<void> {
    await connection.rollback();
    connection.release();
  }
}

export default Database; 