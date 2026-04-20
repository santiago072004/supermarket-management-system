import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

let dbPromise: Promise<Database<sqlite3.Database, sqlite3.Statement>> | null = null;

export async function getDB(): Promise<Database<sqlite3.Database, sqlite3.Statement>> {
  if (!dbPromise) {
    const dbPath = path.join(process.cwd(), 'data', 'supermercado.db');

    dbPromise = open({
      filename: dbPath,
      driver: sqlite3.Database,
    }).then(async (db) => {
      
      await db.exec('PRAGMA foreign_keys = ON');

      console.log('DB conectada en:', dbPath);

      return db;
    });
  }
  return dbPromise;
}

export async function query<T = any>(sql: string, params?: unknown[]): Promise<T[]> {
  const db = await getDB();
  return db.all<T[]>(sql, params ?? []);
}

export async function run(
  sql: string,
  params?: unknown[]
): Promise<{ changes: number }> {
  const db = await getDB();
  const result = await db.run(sql, params ?? []);
  return { changes: result.changes ?? 0 };
}