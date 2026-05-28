import mongoose, { Document, Schema } from 'mongoose';

/**
 * Verification status enum
 */
export enum VerificationStatus {
  VERIFIED = 'verified',
  PENDING = 'pending',
  FLAGGED = 'flagged',
  REJECTED = 'rejected',
}

/**
 * Risk level enum
 */
export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Verification Record document interface
 */
export interface IRecord extends Document {
  employeeName: string;
  department: string;
  verificationStatus: VerificationStatus;
  riskLevel: RiskLevel;
  lastUpdated: Date;
  employeeId: string;
  position: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Record Schema
 */
const recordSchema = new Schema<IRecord>(
  {
    employeeName: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      required: true,
      trim: true,
    },
    verificationStatus: {
      type: String,
      enum: Object.values(VerificationStatus),
      default: VerificationStatus.PENDING,
    },
    riskLevel: {
      type: String,
      enum: Object.values(RiskLevel),
      default: RiskLevel.LOW,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    employeeId: {
      type: String,
      required: true,
      unique: true,
    },
    position: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Record = mongoose.model<IRecord>('Record', recordSchema);
