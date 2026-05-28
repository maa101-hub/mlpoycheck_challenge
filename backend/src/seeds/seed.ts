import mongoose from 'mongoose';
import { config } from '../config';
import { User, UserRole } from '../models/user.model';
import { Record, VerificationStatus, RiskLevel } from '../models/record.model';

/**
 * Database Seeder
 * Populates the database with dummy enterprise data
 */

const seedUsers = [
  {
    email: 'admin@mploycheck.com',
    password: 'Admin@123',
    fullName: 'Sarah Mitchell',
    role: UserRole.ADMIN,
    companyName: 'Mploycheck Corp',
    isActive: true,
  },
  {
    email: 'user@mploycheck.com',
    password: 'User@123',
    fullName: 'James Wilson',
    role: UserRole.GENERAL,
    companyName: 'Mploycheck Corp',
    isActive: true,
  },
  {
    email: 'hr@enterprise.com',
    password: 'Hr@12345',
    fullName: 'Emily Rodriguez',
    role: UserRole.GENERAL,
    companyName: 'Enterprise Solutions Inc',
    isActive: true,
  },
  {
    email: 'manager@techcorp.com',
    password: 'Manager@1',
    fullName: 'David Chen',
    role: UserRole.ADMIN,
    companyName: 'TechCorp Global',
    isActive: true,
  },
];

const seedRecords = [
  {
    employeeName: 'Michael Thompson',
    department: 'Engineering',
    verificationStatus: VerificationStatus.VERIFIED,
    riskLevel: RiskLevel.LOW,
    employeeId: 'EMP-001',
    position: 'Senior Software Engineer',
    lastUpdated: new Date('2024-03-15'),
  },
  {
    employeeName: 'Jessica Martinez',
    department: 'Finance',
    verificationStatus: VerificationStatus.VERIFIED,
    riskLevel: RiskLevel.LOW,
    employeeId: 'EMP-002',
    position: 'Financial Analyst',
    lastUpdated: new Date('2024-03-14'),
  },
  {
    employeeName: 'Robert Johnson',
    department: 'Operations',
    verificationStatus: VerificationStatus.PENDING,
    riskLevel: RiskLevel.MEDIUM,
    employeeId: 'EMP-003',
    position: 'Operations Manager',
    lastUpdated: new Date('2024-03-13'),
  },
  {
    employeeName: 'Amanda Lee',
    department: 'Human Resources',
    verificationStatus: VerificationStatus.VERIFIED,
    riskLevel: RiskLevel.LOW,
    employeeId: 'EMP-004',
    position: 'HR Director',
    lastUpdated: new Date('2024-03-12'),
  },
  {
    employeeName: 'Christopher Davis',
    department: 'Marketing',
    verificationStatus: VerificationStatus.FLAGGED,
    riskLevel: RiskLevel.HIGH,
    employeeId: 'EMP-005',
    position: 'Marketing Lead',
    lastUpdated: new Date('2024-03-11'),
  },
  {
    employeeName: 'Sarah Kim',
    department: 'Engineering',
    verificationStatus: VerificationStatus.VERIFIED,
    riskLevel: RiskLevel.LOW,
    employeeId: 'EMP-006',
    position: 'DevOps Engineer',
    lastUpdated: new Date('2024-03-10'),
  },
  {
    employeeName: 'Daniel Brown',
    department: 'Legal',
    verificationStatus: VerificationStatus.PENDING,
    riskLevel: RiskLevel.MEDIUM,
    employeeId: 'EMP-007',
    position: 'Legal Counsel',
    lastUpdated: new Date('2024-03-09'),
  },
  {
    employeeName: 'Rachel Green',
    department: 'Sales',
    verificationStatus: VerificationStatus.REJECTED,
    riskLevel: RiskLevel.CRITICAL,
    employeeId: 'EMP-008',
    position: 'Sales Director',
    lastUpdated: new Date('2024-03-08'),
  },
  {
    employeeName: 'Kevin Patel',
    department: 'Engineering',
    verificationStatus: VerificationStatus.VERIFIED,
    riskLevel: RiskLevel.LOW,
    employeeId: 'EMP-009',
    position: 'Backend Developer',
    lastUpdated: new Date('2024-03-07'),
  },
  {
    employeeName: 'Lisa Wang',
    department: 'Product',
    verificationStatus: VerificationStatus.PENDING,
    riskLevel: RiskLevel.MEDIUM,
    employeeId: 'EMP-010',
    position: 'Product Manager',
    lastUpdated: new Date('2024-03-06'),
  },
  {
    employeeName: 'Andrew Scott',
    department: 'Security',
    verificationStatus: VerificationStatus.FLAGGED,
    riskLevel: RiskLevel.HIGH,
    employeeId: 'EMP-011',
    position: 'Security Analyst',
    lastUpdated: new Date('2024-03-05'),
  },
  {
    employeeName: 'Maria Garcia',
    department: 'Finance',
    verificationStatus: VerificationStatus.VERIFIED,
    riskLevel: RiskLevel.LOW,
    employeeId: 'EMP-012',
    position: 'Accountant',
    lastUpdated: new Date('2024-03-04'),
  },
  {
    employeeName: 'Thomas Wright',
    department: 'Operations',
    verificationStatus: VerificationStatus.VERIFIED,
    riskLevel: RiskLevel.LOW,
    employeeId: 'EMP-013',
    position: 'Supply Chain Manager',
    lastUpdated: new Date('2024-03-03'),
  },
  {
    employeeName: 'Jennifer Adams',
    department: 'Marketing',
    verificationStatus: VerificationStatus.PENDING,
    riskLevel: RiskLevel.MEDIUM,
    employeeId: 'EMP-014',
    position: 'Content Strategist',
    lastUpdated: new Date('2024-03-02'),
  },
  {
    employeeName: 'William Turner',
    department: 'Engineering',
    verificationStatus: VerificationStatus.VERIFIED,
    riskLevel: RiskLevel.LOW,
    employeeId: 'EMP-015',
    position: 'Frontend Developer',
    lastUpdated: new Date('2024-03-01'),
  },
  {
    employeeName: 'Olivia Harris',
    department: 'Human Resources',
    verificationStatus: VerificationStatus.FLAGGED,
    riskLevel: RiskLevel.HIGH,
    employeeId: 'EMP-016',
    position: 'Recruitment Specialist',
    lastUpdated: new Date('2024-02-28'),
  },
  {
    employeeName: 'Nathan Brooks',
    department: 'Legal',
    verificationStatus: VerificationStatus.VERIFIED,
    riskLevel: RiskLevel.LOW,
    employeeId: 'EMP-017',
    position: 'Compliance Officer',
    lastUpdated: new Date('2024-02-27'),
  },
  {
    employeeName: 'Sophia Clark',
    department: 'Product',
    verificationStatus: VerificationStatus.REJECTED,
    riskLevel: RiskLevel.CRITICAL,
    employeeId: 'EMP-018',
    position: 'UX Designer',
    lastUpdated: new Date('2024-02-26'),
  },
  {
    employeeName: 'Ryan Mitchell',
    department: 'Sales',
    verificationStatus: VerificationStatus.VERIFIED,
    riskLevel: RiskLevel.LOW,
    employeeId: 'EMP-019',
    position: 'Account Executive',
    lastUpdated: new Date('2024-02-25'),
  },
  {
    employeeName: 'Emma Taylor',
    department: 'Engineering',
    verificationStatus: VerificationStatus.PENDING,
    riskLevel: RiskLevel.MEDIUM,
    employeeId: 'EMP-020',
    position: 'QA Engineer',
    lastUpdated: new Date('2024-02-24'),
  },
];

/**
 * Run the seed process
 */
async function seed(): Promise<void> {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongodbUri);
    console.log('✅ Connected to MongoDB for seeding');

    // Clear existing data
    await User.deleteMany({});
    await Record.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Seed users
    await User.insertMany(seedUsers.map(u => new User(u)));
    console.log(`👤 Seeded ${seedUsers.length} users`);

    // Seed records
    await Record.insertMany(seedRecords);
    console.log(`📋 Seeded ${seedRecords.length} verification records`);

    console.log('\n✅ Database seeded successfully!');
    console.log('\n📌 Login Credentials:');
    console.log('   Admin: admin@mploycheck.com / Admin@123');
    console.log('   User:  user@mploycheck.com / User@123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
