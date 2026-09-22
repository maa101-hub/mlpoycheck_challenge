import { Pool, PoolClient } from 'pg';
import bcrypt from 'bcryptjs';
import { config } from './index';

/**
 * PostgreSQL data layer (Neon-compatible).
 * Replaces the previous JSON-file storage so data persists across
 * restarts/redeploys on hosts with an ephemeral filesystem (e.g. Render).
 *
 * The public `Database` class keeps the same method names as before, but every
 * method is now async (returns a Promise) because it talks to Postgres.
 */

// Neon (and most managed Postgres) require SSL. rejectUnauthorized:false is the
// standard setting for these providers' connection strings.
const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: config.databaseSsl ? { rejectUnauthorized: false } : undefined,
});

export interface DBUser {
  id: string;
  email: string;
  password: string;
  fullName: string;
  role: 'admin' | 'general';
  companyName: string;
  lastLogin: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface DBRecord {
  id: string;
  employeeName: string;
  department: string;
  verificationStatus: 'verified' | 'pending' | 'flagged' | 'rejected';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  lastUpdated: string;
  employeeId: string;
  position: string;
}

export interface DBDocument {
  id: string;
  userId: string;
  name: string;
  type: 'passport' | 'degree' | 'employment_letter' | 'background_cert' | 'photo_id';
  status: 'uploaded' | 'verified' | 'rejected';
  uploadedAt: string;
  size: string;
}

// ─── Row mappers (snake_case columns → camelCase objects) ────────────────
function mapUser(r: any): DBUser {
  return {
    id: r.id,
    email: r.email,
    password: r.password,
    fullName: r.full_name,
    role: r.role,
    companyName: r.company_name,
    lastLogin: r.last_login ? new Date(r.last_login).toISOString() : null,
    isActive: r.is_active,
    createdAt: new Date(r.created_at).toISOString(),
  };
}

function mapRecord(r: any): DBRecord {
  return {
    id: r.id,
    employeeName: r.employee_name,
    department: r.department,
    verificationStatus: r.verification_status,
    riskLevel: r.risk_level,
    lastUpdated: r.last_updated,
    employeeId: r.employee_id,
    position: r.position,
  };
}

function mapDocument(r: any): DBDocument {
  return {
    id: r.id,
    userId: r.user_id,
    name: r.name,
    type: r.type,
    status: r.status,
    uploadedAt: new Date(r.uploaded_at).toISOString(),
    size: r.size,
  };
}

/**
 * Database class with CRUD operations (all async).
 */
export class Database {
  // ─── USERS ──────────────────────────────────────────────────────────
  static async getUsers(): Promise<DBUser[]> {
    const { rows } = await pool.query('SELECT * FROM users ORDER BY created_at ASC');
    return rows.map(mapUser);
  }

  static async getUserById(id: string): Promise<DBUser | undefined> {
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return rows[0] ? mapUser(rows[0]) : undefined;
  }

  static async getUserByEmail(email: string): Promise<DBUser | undefined> {
    const { rows } = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
    return rows[0] ? mapUser(rows[0]) : undefined;
  }

  static async createUser(user: Omit<DBUser, 'id' | 'createdAt'>): Promise<DBUser> {
    const id = this.generateId();
    const { rows } = await pool.query(
      `INSERT INTO users (id, email, password, full_name, role, company_name, last_login, is_active, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       RETURNING *`,
      [id, user.email, user.password, user.fullName, user.role, user.companyName, user.lastLogin, user.isActive]
    );
    return mapUser(rows[0]);
  }

  static async updateUser(id: string, updates: Partial<DBUser>): Promise<DBUser | null> {
    // Map allowed fields to columns; build a dynamic SET clause.
    const columnMap: Record<string, string> = {
      email: 'email',
      password: 'password',
      fullName: 'full_name',
      role: 'role',
      companyName: 'company_name',
      lastLogin: 'last_login',
      isActive: 'is_active',
    };

    const sets: string[] = [];
    const values: any[] = [];
    let i = 1;
    for (const [key, column] of Object.entries(columnMap)) {
      if (key in updates) {
        sets.push(`${column} = $${i++}`);
        values.push((updates as any)[key]);
      }
    }

    if (sets.length === 0) {
      return this.getUserById(id).then(u => u ?? null);
    }

    values.push(id);
    const { rows } = await pool.query(
      `UPDATE users SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`,
      values
    );
    return rows[0] ? mapUser(rows[0]) : null;
  }

  static async deleteUser(id: string): Promise<boolean> {
    const res = await pool.query('DELETE FROM users WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  }

  // ─── RECORDS ────────────────────────────────────────────────────────
  static async getRecords(): Promise<DBRecord[]> {
    const { rows } = await pool.query('SELECT * FROM records');
    return rows.map(mapRecord);
  }

  static async getRecordById(id: string): Promise<DBRecord | undefined> {
    const { rows } = await pool.query('SELECT * FROM records WHERE id = $1', [id]);
    return rows[0] ? mapRecord(rows[0]) : undefined;
  }

  static async createRecord(record: Omit<DBRecord, 'id'>): Promise<DBRecord> {
    const id = this.generateId();
    const { rows } = await pool.query(
      `INSERT INTO records (id, employee_name, department, verification_status, risk_level, last_updated, employee_id, position)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [id, record.employeeName, record.department, record.verificationStatus, record.riskLevel, record.lastUpdated, record.employeeId, record.position]
    );
    return mapRecord(rows[0]);
  }

  static async updateRecord(id: string, updates: Partial<DBRecord>): Promise<DBRecord | null> {
    const columnMap: Record<string, string> = {
      employeeName: 'employee_name',
      department: 'department',
      verificationStatus: 'verification_status',
      riskLevel: 'risk_level',
      lastUpdated: 'last_updated',
      employeeId: 'employee_id',
      position: 'position',
    };

    const sets: string[] = [];
    const values: any[] = [];
    let i = 1;
    for (const [key, column] of Object.entries(columnMap)) {
      if (key in updates) {
        sets.push(`${column} = $${i++}`);
        values.push((updates as any)[key]);
      }
    }

    if (sets.length === 0) {
      return this.getRecordById(id).then(r => r ?? null);
    }

    values.push(id);
    const { rows } = await pool.query(
      `UPDATE records SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`,
      values
    );
    return rows[0] ? mapRecord(rows[0]) : null;
  }

  static async deleteRecord(id: string): Promise<boolean> {
    const res = await pool.query('DELETE FROM records WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  }

  // ─── DOCUMENTS ──────────────────────────────────────────────────────
  static async getDocuments(userId?: string): Promise<DBDocument[]> {
    if (userId) {
      const { rows } = await pool.query('SELECT * FROM documents WHERE user_id = $1', [userId]);
      return rows.map(mapDocument);
    }
    const { rows } = await pool.query('SELECT * FROM documents');
    return rows.map(mapDocument);
  }

  static async addDocument(doc: Omit<DBDocument, 'id' | 'uploadedAt'>): Promise<DBDocument> {
    const id = this.generateId();
    const { rows } = await pool.query(
      `INSERT INTO documents (id, user_id, name, type, status, uploaded_at, size)
       VALUES ($1, $2, $3, $4, $5, NOW(), $6)
       RETURNING *`,
      [id, doc.userId, doc.name, doc.type, doc.status, doc.size]
    );
    return mapDocument(rows[0]);
  }

  static async updateDocumentStatus(id: string, status: DBDocument['status']): Promise<void> {
    await pool.query('UPDATE documents SET status = $1 WHERE id = $2', [status, id]);
  }

  static async getVerificationProgress(userId: string): Promise<{ total: number; uploaded: number; verified: number; steps: any[] }> {
    const requiredDocs = [
      { type: 'photo_id', label: 'Photo ID / Passport', step: 'Identity Check' },
      { type: 'employment_letter', label: 'Employment Letter', step: 'Employment Verification' },
      { type: 'degree', label: 'Degree Certificate', step: 'Education Verification' },
      { type: 'background_cert', label: 'Background Certificate', step: 'Background Check' },
    ];

    const userDocs = await this.getDocuments(userId);

    const steps = requiredDocs.map(req => {
      const doc = userDocs.find(d => d.type === req.type);
      let status: 'completed' | 'uploaded' | 'pending' | 'locked' = 'pending';
      if (doc && doc.status === 'verified') status = 'completed';
      else if (doc && doc.status === 'uploaded') status = 'uploaded';
      return { ...req, status, document: doc || null };
    });

    const uploaded = steps.filter(s => s.status === 'uploaded' || s.status === 'completed').length;
    const verified = steps.filter(s => s.status === 'completed').length;

    return { total: requiredDocs.length, uploaded, verified, steps };
  }

  // ─── HELPERS ────────────────────────────────────────────────────────
  static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Create tables if they don't exist yet.
   */
  static async initSchema(): Promise<void> {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id           TEXT PRIMARY KEY,
        email        TEXT UNIQUE NOT NULL,
        password     TEXT NOT NULL,
        full_name    TEXT NOT NULL,
        role         TEXT NOT NULL DEFAULT 'general',
        company_name TEXT NOT NULL DEFAULT '',
        last_login   TIMESTAMPTZ,
        is_active    BOOLEAN NOT NULL DEFAULT TRUE,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS records (
        id                  TEXT PRIMARY KEY,
        employee_name       TEXT NOT NULL,
        department          TEXT NOT NULL,
        verification_status TEXT NOT NULL,
        risk_level          TEXT NOT NULL,
        last_updated        TEXT NOT NULL,
        employee_id         TEXT NOT NULL,
        position            TEXT NOT NULL
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id          TEXT PRIMARY KEY,
        user_id     TEXT NOT NULL,
        name        TEXT NOT NULL,
        type        TEXT NOT NULL,
        status      TEXT NOT NULL,
        uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        size        TEXT NOT NULL DEFAULT ''
      );
    `);
  }

  /**
   * Seed initial data if the database is empty.
   */
  static async seedIfEmpty(): Promise<void> {
    const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM users');
    if (rows[0].count > 0) return;

    console.log('📦 Seeding database with initial data...');

    const salt = await bcrypt.genSalt(10);
    const seedUsers: Array<Omit<DBUser, 'createdAt'>> = [
      { id: this.generateId(), email: 'admin@mploycheck.com', password: await bcrypt.hash('Admin@123', salt), fullName: 'Sarah Mitchell', role: 'admin', companyName: 'Mploycheck Corp', lastLogin: null, isActive: true },
      { id: this.generateId(), email: 'user@mploycheck.com', password: await bcrypt.hash('User@123', salt), fullName: 'James Wilson', role: 'general', companyName: 'Mploycheck Corp', lastLogin: null, isActive: true },
      { id: this.generateId(), email: 'hr@enterprise.com', password: await bcrypt.hash('Hr@12345', salt), fullName: 'Emily Rodriguez', role: 'general', companyName: 'Enterprise Solutions Inc', lastLogin: null, isActive: true },
      { id: this.generateId(), email: 'manager@techcorp.com', password: await bcrypt.hash('Manager@1', salt), fullName: 'David Chen', role: 'admin', companyName: 'TechCorp Global', lastLogin: null, isActive: true },
    ];

    const client: PoolClient = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const u of seedUsers) {
        await client.query(
          `INSERT INTO users (id, email, password, full_name, role, company_name, last_login, is_active, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
          [u.id, u.email, u.password, u.fullName, u.role, u.companyName, u.lastLogin, u.isActive]
        );
      }
      console.log(`   ✅ Seeded ${seedUsers.length} users`);

      const seedRecords: DBRecord[] = [
        { id: this.generateId(), employeeName: 'Michael Thompson', department: 'Engineering', verificationStatus: 'verified', riskLevel: 'low', lastUpdated: '2024-03-15', employeeId: 'EMP-001', position: 'Senior Software Engineer' },
        { id: this.generateId(), employeeName: 'Jessica Martinez', department: 'Finance', verificationStatus: 'verified', riskLevel: 'low', lastUpdated: '2024-03-14', employeeId: 'EMP-002', position: 'Financial Analyst' },
        { id: this.generateId(), employeeName: 'Robert Johnson', department: 'Operations', verificationStatus: 'pending', riskLevel: 'medium', lastUpdated: '2024-03-13', employeeId: 'EMP-003', position: 'Operations Manager' },
        { id: this.generateId(), employeeName: 'Amanda Lee', department: 'Human Resources', verificationStatus: 'verified', riskLevel: 'low', lastUpdated: '2024-03-12', employeeId: 'EMP-004', position: 'HR Director' },
        { id: this.generateId(), employeeName: 'Christopher Davis', department: 'Marketing', verificationStatus: 'flagged', riskLevel: 'high', lastUpdated: '2024-03-11', employeeId: 'EMP-005', position: 'Marketing Lead' },
        { id: this.generateId(), employeeName: 'Sarah Kim', department: 'Engineering', verificationStatus: 'verified', riskLevel: 'low', lastUpdated: '2024-03-10', employeeId: 'EMP-006', position: 'DevOps Engineer' },
        { id: this.generateId(), employeeName: 'Daniel Brown', department: 'Legal', verificationStatus: 'pending', riskLevel: 'medium', lastUpdated: '2024-03-09', employeeId: 'EMP-007', position: 'Legal Counsel' },
        { id: this.generateId(), employeeName: 'Rachel Green', department: 'Sales', verificationStatus: 'rejected', riskLevel: 'critical', lastUpdated: '2024-03-08', employeeId: 'EMP-008', position: 'Sales Director' },
        { id: this.generateId(), employeeName: 'Kevin Patel', department: 'Engineering', verificationStatus: 'verified', riskLevel: 'low', lastUpdated: '2024-03-07', employeeId: 'EMP-009', position: 'Backend Developer' },
        { id: this.generateId(), employeeName: 'Lisa Wang', department: 'Product', verificationStatus: 'pending', riskLevel: 'medium', lastUpdated: '2024-03-06', employeeId: 'EMP-010', position: 'Product Manager' },
        { id: this.generateId(), employeeName: 'Andrew Scott', department: 'Security', verificationStatus: 'flagged', riskLevel: 'high', lastUpdated: '2024-03-05', employeeId: 'EMP-011', position: 'Security Analyst' },
        { id: this.generateId(), employeeName: 'Maria Garcia', department: 'Finance', verificationStatus: 'verified', riskLevel: 'low', lastUpdated: '2024-03-04', employeeId: 'EMP-012', position: 'Accountant' },
        { id: this.generateId(), employeeName: 'Thomas Wright', department: 'Operations', verificationStatus: 'verified', riskLevel: 'low', lastUpdated: '2024-03-03', employeeId: 'EMP-013', position: 'Supply Chain Manager' },
        { id: this.generateId(), employeeName: 'Jennifer Adams', department: 'Marketing', verificationStatus: 'pending', riskLevel: 'medium', lastUpdated: '2024-03-02', employeeId: 'EMP-014', position: 'Content Strategist' },
        { id: this.generateId(), employeeName: 'William Turner', department: 'Engineering', verificationStatus: 'verified', riskLevel: 'low', lastUpdated: '2024-03-01', employeeId: 'EMP-015', position: 'Frontend Developer' },
        { id: this.generateId(), employeeName: 'Olivia Harris', department: 'Human Resources', verificationStatus: 'flagged', riskLevel: 'high', lastUpdated: '2024-02-28', employeeId: 'EMP-016', position: 'Recruitment Specialist' },
        { id: this.generateId(), employeeName: 'Nathan Brooks', department: 'Legal', verificationStatus: 'verified', riskLevel: 'low', lastUpdated: '2024-02-27', employeeId: 'EMP-017', position: 'Compliance Officer' },
        { id: this.generateId(), employeeName: 'Sophia Clark', department: 'Product', verificationStatus: 'rejected', riskLevel: 'critical', lastUpdated: '2024-02-26', employeeId: 'EMP-018', position: 'UX Designer' },
        { id: this.generateId(), employeeName: 'Ryan Mitchell', department: 'Sales', verificationStatus: 'verified', riskLevel: 'low', lastUpdated: '2024-02-25', employeeId: 'EMP-019', position: 'Account Executive' },
        { id: this.generateId(), employeeName: 'Emma Taylor', department: 'Engineering', verificationStatus: 'pending', riskLevel: 'medium', lastUpdated: '2024-02-24', employeeId: 'EMP-020', position: 'QA Engineer' },
      ];
      for (const r of seedRecords) {
        await client.query(
          `INSERT INTO records (id, employee_name, department, verification_status, risk_level, last_updated, employee_id, position)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [r.id, r.employeeName, r.department, r.verificationStatus, r.riskLevel, r.lastUpdated, r.employeeId, r.position]
        );
      }
      await client.query('COMMIT');
      console.log(`   ✅ Seeded ${seedRecords.length} records`);
      console.log('   📌 Login: admin@mploycheck.com / Admin@123');
      console.log('   📌 Login: user@mploycheck.com / User@123\n');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

export const connectDatabase = async (): Promise<void> => {
  if (!config.databaseUrl) {
    throw new Error('DATABASE_URL is not set. Provide a Postgres connection string (e.g. from Neon).');
  }
  await Database.initSchema();
  await Database.seedIfEmpty();
  console.log('✅ PostgreSQL database ready');
};
