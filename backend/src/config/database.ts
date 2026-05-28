import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

/**
 * JSON File-based Database
 * Stores users and records in local JSON files
 * Works without MongoDB installation
 */

const DB_DIR = path.join(__dirname, '../../data');
const USERS_FILE = path.join(DB_DIR, 'users.json');
const RECORDS_FILE = path.join(DB_DIR, 'records.json');
const DOCS_FILE = path.join(DB_DIR, 'documents.json');

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

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

/**
 * Read JSON file
 */
function readJSON<T>(filePath: string): T[] {
  if (!fs.existsSync(filePath)) return [];
  const data = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(data);
}

/**
 * Write JSON file
 */
function writeJSON<T>(filePath: string, data: T[]): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * Database class with CRUD operations
 */
export class Database {
  // ─── USERS ──────────────────────────────────────────────────────────
  static getUsers(): DBUser[] {
    return readJSON<DBUser>(USERS_FILE);
  }

  static getUserById(id: string): DBUser | undefined {
    return this.getUsers().find(u => u.id === id);
  }

  static getUserByEmail(email: string): DBUser | undefined {
    return this.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  static createUser(user: Omit<DBUser, 'id' | 'createdAt'>): DBUser {
    const users = this.getUsers();
    const newUser: DBUser = {
      ...user,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    writeJSON(USERS_FILE, users);
    return newUser;
  }

  static updateUser(id: string, updates: Partial<DBUser>): DBUser | null {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === id);
    if (index === -1) return null;
    users[index] = { ...users[index], ...updates };
    writeJSON(USERS_FILE, users);
    return users[index];
  }

  static deleteUser(id: string): boolean {
    const users = this.getUsers();
    const filtered = users.filter(u => u.id !== id);
    if (filtered.length === users.length) return false;
    writeJSON(USERS_FILE, filtered);
    return true;
  }

  // ─── RECORDS ────────────────────────────────────────────────────────
  static getRecords(): DBRecord[] {
    return readJSON<DBRecord>(RECORDS_FILE);
  }

  static getRecordById(id: string): DBRecord | undefined {
    return this.getRecords().find(r => r.id === id);
  }

  // ─── DOCUMENTS ──────────────────────────────────────────────────────
  static getDocuments(userId?: string): DBDocument[] {
    const docs = readJSON<DBDocument>(DOCS_FILE);
    if (userId) return docs.filter(d => d.userId === userId);
    return docs;
  }

  static addDocument(doc: Omit<DBDocument, 'id' | 'uploadedAt'>): DBDocument {
    const docs = this.getDocuments();
    const newDoc: DBDocument = {
      ...doc,
      id: this.generateId(),
      uploadedAt: new Date().toISOString(),
    };
    docs.push(newDoc);
    writeJSON(DOCS_FILE, docs);
    return newDoc;
  }

  static getVerificationProgress(userId: string): { total: number; uploaded: number; verified: number; steps: any[] } {
    const requiredDocs = [
      { type: 'photo_id', label: 'Photo ID / Passport', step: 'Identity Check' },
      { type: 'employment_letter', label: 'Employment Letter', step: 'Employment Verification' },
      { type: 'degree', label: 'Degree Certificate', step: 'Education Verification' },
      { type: 'background_cert', label: 'Background Certificate', step: 'Background Check' },
    ];

    const userDocs = this.getDocuments(userId);

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
   * Seed initial data if database is empty
   */
  static async seedIfEmpty(): Promise<void> {
    const users = this.getUsers();
    if (users.length === 0) {
      console.log('📦 Seeding database with initial data...');

      // Seed users
      const salt = await bcrypt.genSalt(10);
      const seedUsers: DBUser[] = [
        {
          id: this.generateId(),
          email: 'admin@mploycheck.com',
          password: await bcrypt.hash('Admin@123', salt),
          fullName: 'Sarah Mitchell',
          role: 'admin',
          companyName: 'Mploycheck Corp',
          lastLogin: null,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: this.generateId(),
          email: 'user@mploycheck.com',
          password: await bcrypt.hash('User@123', salt),
          fullName: 'James Wilson',
          role: 'general',
          companyName: 'Mploycheck Corp',
          lastLogin: null,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: this.generateId(),
          email: 'hr@enterprise.com',
          password: await bcrypt.hash('Hr@12345', salt),
          fullName: 'Emily Rodriguez',
          role: 'general',
          companyName: 'Enterprise Solutions Inc',
          lastLogin: null,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: this.generateId(),
          email: 'manager@techcorp.com',
          password: await bcrypt.hash('Manager@1', salt),
          fullName: 'David Chen',
          role: 'admin',
          companyName: 'TechCorp Global',
          lastLogin: null,
          isActive: true,
          createdAt: new Date().toISOString(),
        },
      ];
      writeJSON(USERS_FILE, seedUsers);
      console.log(`   ✅ Seeded ${seedUsers.length} users`);

      // Seed records
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
      writeJSON(RECORDS_FILE, seedRecords);
      console.log(`   ✅ Seeded ${seedRecords.length} records`);
      console.log('   📌 Login: admin@mploycheck.com / Admin@123');
      console.log('   📌 Login: user@mploycheck.com / User@123\n');
    }
  }
}

export const connectDatabase = async (): Promise<void> => {
  await Database.seedIfEmpty();
  console.log('✅ JSON Database ready');
};
