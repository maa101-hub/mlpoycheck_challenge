import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from '../config';
import { Database } from '../config/database';

/**
 * Auth Controller - Handles login with JWT token generation
 */
export class AuthController {
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ success: false, message: 'Email and password are required.' });
        return;
      }

      const user = Database.getUserByEmail(email);
      if (!user) {
        res.status(401).json({ success: false, message: 'Invalid credentials.' });
        return;
      }

      if (!user.isActive) {
        res.status(403).json({ success: false, message: 'Account is deactivated.' });
        return;
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        res.status(401).json({ success: false, message: 'Invalid credentials.' });
        return;
      }

      // Update last login
      Database.updateUser(user.id, { lastLogin: new Date().toISOString() });

      // Generate JWT
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn as any }
      );

      res.status(200).json({
        success: true,
        message: 'Login successful.',
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            companyName: user.companyName,
            lastLogin: new Date().toISOString(),
          },
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ success: false, message: 'Internal server error.' });
    }
  }
}
