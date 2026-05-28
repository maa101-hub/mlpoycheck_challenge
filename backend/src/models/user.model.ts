import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * User roles enum
 */
export enum UserRole {
  ADMIN = 'admin',
  GENERAL = 'general',
}

/**
 * User document interface
 */
export interface IUser extends Document {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  companyName?: string;
  lastLogin?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

/**
 * User Schema
 */
const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.GENERAL,
    },
    companyName: {
      type: String,
      trim: true,
    },
    lastLogin: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Hash password before saving
 */
userSchema.pre('save', async function (this: IUser) {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

/**
 * Compare password method
 */
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Remove password from JSON output
 */
userSchema.set('toJSON', {
  transform: (_doc: any, ret: any) => {
    delete ret.password;
    return ret;
  },
});

export const User = mongoose.model<IUser>('User', userSchema);
