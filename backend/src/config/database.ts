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
  companyId: string | null;
  status: 'approved' | 'pending' | 'rejected';
  lastLogin: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface DBCompany {
  id: string;
  name: string;
  joinCode: string;
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
  // A document type slug. Built-ins include photo_id/employment_letter/degree/
  // background_cert, but companies can define their own required document types.
  type: string;
  status: 'uploaded' | 'verified' | 'rejected';
  uploadedAt: string;
  size: string;
}

export interface DBRequiredDoc {
  type: string;
  label: string;
  step: string;
}

/**
 * Default required documents used when a company has not defined its own list.
 * Keeps existing companies working and gives new companies a sensible start.
 */
export const DEFAULT_REQUIRED_DOCS: DBRequiredDoc[] = [
  { type: 'photo_id', label: 'Photo ID / Passport', step: 'Identity Check' },
  { type: 'employment_letter', label: 'Employment Letter', step: 'Employment Verification' },
  { type: 'degree', label: 'Degree Certificate', step: 'Education Verification' },
  { type: 'background_cert', label: 'Background Certificate', step: 'Background Check' },
];

// ─── Row mappers (snake_case columns → camelCase objects) ────────────────
function mapUser(r: any): DBUser {
  return {
    id: r.id,
    email: r.email,
    password: r.password,
    fullName: r.full_name,
    role: r.role,
    companyName: r.company_name,
    companyId: r.company_id ?? null,
    status: r.status ?? 'approved',
    lastLogin: r.last_login ? new Date(r.last_login).toISOString() : null,
    isActive: r.is_active,
    createdAt: new Date(r.created_at).toISOString(),
  };
}

function mapCompany(r: any): DBCompany {
  return {
    id: r.id,
    name: r.name,
    joinCode: r.join_code,
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
      `INSERT INTO users (id, email, password, full_name, role, company_name, company_id, status, last_login, is_active, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
       RETURNING *`,
      [id, user.email, user.password, user.fullName, user.role, user.companyName, user.companyId, user.status, user.lastLogin, user.isActive]
    );
    return mapUser(rows[0]);
  }

  static async getUsersByCompany(companyId: string, status?: DBUser['status']): Promise<DBUser[]> {
    if (status) {
      const { rows } = await pool.query(
        'SELECT * FROM users WHERE company_id = $1 AND status = $2 ORDER BY created_at DESC',
        [companyId, status]
      );
      return rows.map(mapUser);
    }
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE company_id = $1 ORDER BY created_at DESC',
      [companyId]
    );
    return rows.map(mapUser);
  }

  static async updateUser(id: string, updates: Partial<DBUser>): Promise<DBUser | null> {
    // Map allowed fields to columns; build a dynamic SET clause.
    const columnMap: Record<string, string> = {
      email: 'email',
      password: 'password',
      fullName: 'full_name',
      role: 'role',
      companyName: 'company_name',
      companyId: 'company_id',
      status: 'status',
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

  // ─── COMPANIES ──────────────────────────────────────────────────────
  static async getCompanyById(id: string): Promise<DBCompany | undefined> {
    const { rows } = await pool.query('SELECT * FROM companies WHERE id = $1', [id]);
    return rows[0] ? mapCompany(rows[0]) : undefined;
  }

  static async getCompanyByJoinCode(code: string): Promise<DBCompany | undefined> {
    const { rows } = await pool.query('SELECT * FROM companies WHERE UPPER(join_code) = UPPER($1)', [code]);
    return rows[0] ? mapCompany(rows[0]) : undefined;
  }

  static async createCompany(name: string): Promise<DBCompany> {
    const id = this.generateId();
    // Generate a unique join code (retry on the rare collision).
    let joinCode = this.generateJoinCode();
    for (let attempt = 0; attempt < 5; attempt++) {
      const existing = await this.getCompanyByJoinCode(joinCode);
      if (!existing) break;
      joinCode = this.generateJoinCode();
    }
    const { rows } = await pool.query(
      `INSERT INTO companies (id, name, join_code, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *`,
      [id, name, joinCode]
    );
    return mapCompany(rows[0]);
  }

  static generateJoinCode(): string {
    // 6-char uppercase alphanumeric, excludes ambiguous chars (0/O, 1/I).
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)];
    return code;
  }

  // ─── REQUIRED DOCUMENTS (per company) ───────────────────────────────
  /**
   * Returns a company's configured required documents. If the company has none
   * defined (e.g. companies created before this feature), returns the defaults
   * so verification still works.
   */
  static async getRequiredDocuments(companyId: string | null | undefined): Promise<DBRequiredDoc[]> {
    if (!companyId) return DEFAULT_REQUIRED_DOCS;
    const { rows } = await pool.query(
      'SELECT doc_type, label, step FROM required_documents WHERE company_id = $1 ORDER BY created_at ASC',
      [companyId]
    );
    if (rows.length === 0) return DEFAULT_REQUIRED_DOCS;
    return rows.map(r => ({ type: r.doc_type, label: r.label, step: r.step }));
  }

  static async addRequiredDocument(companyId: string, docType: string, label: string, step: string): Promise<DBRequiredDoc> {
    const id = this.generateId();
    // Upsert so re-adding the same type updates its label instead of erroring.
    const { rows } = await pool.query(
      `INSERT INTO required_documents (id, company_id, doc_type, label, step, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (company_id, doc_type) DO UPDATE SET label = EXCLUDED.label, step = EXCLUDED.step
       RETURNING doc_type, label, step`,
      [id, companyId, docType, label, step]
    );
    return { type: rows[0].doc_type, label: rows[0].label, step: rows[0].step };
  }

  static async deleteRequiredDocument(companyId: string, docType: string): Promise<boolean> {
    const res = await pool.query(
      'DELETE FROM required_documents WHERE company_id = $1 AND doc_type = $2',
      [companyId, docType]
    );
    return (res.rowCount ?? 0) > 0;
  }

  /**
   * Seed a company's required-documents list with the defaults. Called when a
   * new company is registered. Safe to call more than once (ON CONFLICT).
   */
  static async seedDefaultRequiredDocs(companyId: string, client?: PoolClient): Promise<void> {
    const runner = client || pool;
    for (const d of DEFAULT_REQUIRED_DOCS) {
      await runner.query(
        `INSERT INTO required_documents (id, company_id, doc_type, label, step, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT (company_id, doc_type) DO NOTHING`,
        [this.generateId(), companyId, d.type, d.label, d.step]
      );
    }
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

  static async getDocumentById(id: string): Promise<DBDocument | undefined> {
    const { rows } = await pool.query('SELECT * FROM documents WHERE id = $1', [id]);
    return rows[0] ? mapDocument(rows[0]) : undefined;
  }

  /**
   * For an admin: list the company's approved general employees, each with a
   * verification-progress summary so the admin knows who needs reviewing.
   */
  static async getEmployeesReview(companyId: string): Promise<any[]> {
    const employees = (await this.getUsersByCompany(companyId))
      .filter(u => u.role === 'general' && u.status === 'approved');

    const result = [];
    for (const emp of employees) {
      const progress = await this.getVerificationProgress(emp.id);
      const percentage = progress.total > 0 ? Math.round((progress.verified / progress.total) * 100) : 0;
      // Overall employee status derived from their documents.
      let overall: 'not_started' | 'in_progress' | 'ready_for_review' | 'verified' = 'not_started';
      if (progress.verified === progress.total && progress.total > 0) overall = 'verified';
      else if (progress.uploaded === progress.total && progress.total > 0) overall = 'ready_for_review';
      else if (progress.uploaded > 0) overall = 'in_progress';

      result.push({
        id: emp.id,
        fullName: emp.fullName,
        email: emp.email,
        verifiedPercentage: percentage,
        total: progress.total,
        uploaded: progress.uploaded,
        verified: progress.verified,
        overall,
        steps: progress.steps,
      });
    }
    return result;
  }

  static async getVerificationProgress(userId: string): Promise<{ total: number; uploaded: number; verified: number; steps: any[] }> {
    // Required documents are now defined per company (falls back to defaults).
    const user = await this.getUserById(userId);
    const requiredDocs = await this.getRequiredDocuments(user?.companyId);

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
      CREATE TABLE IF NOT EXISTS companies (
        id         TEXT PRIMARY KEY,
        name       TEXT NOT NULL,
        join_code  TEXT UNIQUE NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

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

    // Migrations for databases created before multi-tenant support.
    // ADD COLUMN IF NOT EXISTS is safe to run on every boot.
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id TEXT`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'approved'`);

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

    await pool.query(`
      CREATE TABLE IF NOT EXISTS required_documents (
        id         TEXT PRIMARY KEY,
        company_id TEXT NOT NULL,
        doc_type   TEXT NOT NULL,
        label      TEXT NOT NULL,
        step       TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (company_id, doc_type)
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

    // Seed companies (each with a fixed, memorable join code for the demo).
    const companies = [
      { id: this.generateId(), name: 'Mploycheck Corp', joinCode: 'MPLOY1' },
      { id: this.generateId(), name: 'Enterprise Solutions Inc', joinCode: 'ENTER1' },
      { id: this.generateId(), name: 'TechCorp Global', joinCode: 'TECHC1' },
    ];
    const companyIdByName: Record<string, string> = {};
    companies.forEach(c => { companyIdByName[c.name] = c.id; });

    const seedUsers: Array<Omit<DBUser, 'createdAt'>> = [
      { id: this.generateId(), email: 'admin@mploycheck.com', password: await bcrypt.hash('Admin@123', salt), fullName: 'Sarah Mitchell', role: 'admin', companyName: 'Mploycheck Corp', companyId: companyIdByName['Mploycheck Corp'], status: 'approved', lastLogin: null, isActive: true },
      { id: this.generateId(), email: 'user@mploycheck.com', password: await bcrypt.hash('User@123', salt), fullName: 'James Wilson', role: 'general', companyName: 'Mploycheck Corp', companyId: companyIdByName['Mploycheck Corp'], status: 'approved', lastLogin: null, isActive: true },
      { id: this.generateId(), email: 'hr@enterprise.com', password: await bcrypt.hash('Hr@12345', salt), fullName: 'Emily Rodriguez', role: 'general', companyName: 'Enterprise Solutions Inc', companyId: companyIdByName['Enterprise Solutions Inc'], status: 'approved', lastLogin: null, isActive: true },
      { id: this.generateId(), email: 'manager@techcorp.com', password: await bcrypt.hash('Manager@1', salt), fullName: 'David Chen', role: 'admin', companyName: 'TechCorp Global', companyId: companyIdByName['TechCorp Global'], status: 'approved', lastLogin: null, isActive: true },
    ];

    const client: PoolClient = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const c of companies) {
        await client.query(
          `INSERT INTO companies (id, name, join_code, created_at) VALUES ($1, $2, $3, NOW())`,
          [c.id, c.name, c.joinCode]
        );
        await this.seedDefaultRequiredDocs(c.id, client);
      }
      console.log(`   ✅ Seeded ${companies.length} companies (with default required documents)`);
      for (const u of seedUsers) {
        await client.query(
          `INSERT INTO users (id, email, password, full_name, role, company_name, company_id, status, last_login, is_active, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
          [u.id, u.email, u.password, u.fullName, u.role, u.companyName, u.companyId, u.status, u.lastLogin, u.isActive]
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
