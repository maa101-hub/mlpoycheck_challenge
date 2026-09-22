import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from '../config';
import { Database } from '../config/database';

/**
 * Auth Controller - login + multi-tenant registration.
 */
export class AuthController {
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ success: false, message: 'Email and password are required.' });
        return;
      }

      const user = await Database.getUserByEmail(email);
      if (!user) {
        res.status(401).json({ success: false, message: 'Invalid credentials.' });
        return;
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        res.status(401).json({ success: false, message: 'Invalid credentials.' });
        return;
      }

      if (!user.isActive) {
        res.status(403).json({ success: false, message: 'Account is deactivated.' });
        return;
      }

      // Login gate: only approved members can sign in.
      if (user.status === 'pending') {
        res.status(403).json({ success: false, message: 'Your access request is awaiting admin approval.' });
        return;
      }
      if (user.status === 'rejected') {
        res.status(403).json({ success: false, message: 'Your access request was declined. Contact your company admin.' });
        return;
      }

      await Database.updateUser(user.id, { lastLogin: new Date().toISOString() });

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, companyId: user.companyId, status: user.status },
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
            companyId: user.companyId,
            status: user.status,
            lastLogin: new Date().toISOString(),
          },
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ success: false, message: 'Internal server error.' });
    }
  }

  /**
   * Registration with two modes:
   *  - mode 'company': creates a new company + the requester as its admin
   *    (status approved). Returns the generated join code to share.
   *  - mode 'join': requester joins an existing company via its join code as a
   *    general user with status 'pending' (must be approved by an admin).
   */
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { mode, fullName, email, password, companyName, joinCode } = req.body;

      if (!fullName || !email || !password) {
        res.status(400).json({ success: false, message: 'Full name, email, and password are required.' });
        return;
      }
      if (typeof password !== 'string' || password.length < 8) {
        res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
        return;
      }
      if (await Database.getUserByEmail(email)) {
        res.status(409).json({ success: false, message: 'An account with this email already exists.' });
        return;
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      if (mode === 'company') {
        if (!companyName) {
          res.status(400).json({ success: false, message: 'Company name is required to register a company.' });
          return;
        }
        const company = await Database.createCompany(companyName);
        // Give the new company a sensible default required-documents list.
        await Database.seedDefaultRequiredDocs(company.id);
        const admin = await Database.createUser({
          email: email.toLowerCase(),
          password: hashedPassword,
          fullName,
          role: 'admin',
          companyName: company.name,
          companyId: company.id,
          status: 'approved',
          lastLogin: null,
          isActive: true,
        });

        res.status(201).json({
          success: true,
          message: 'Company registered. Share your join code with employees.',
          data: {
            joinCode: company.joinCode,
            companyName: company.name,
            user: { id: admin.id, email: admin.email, role: admin.role },
          },
        });
        return;
      }

      if (mode === 'join') {
        if (!joinCode) {
          res.status(400).json({ success: false, message: 'A company join code is required.' });
          return;
        }
        const company = await Database.getCompanyByJoinCode(joinCode);
        if (!company) {
          res.status(404).json({ success: false, message: 'Invalid company join code.' });
          return;
        }
        await Database.createUser({
          email: email.toLowerCase(),
          password: hashedPassword,
          fullName,
          role: 'general',
          companyName: company.name,
          companyId: company.id,
          status: 'pending',
          lastLogin: null,
          isActive: true,
        });

        res.status(201).json({
          success: true,
          message: `Request sent to ${company.name}. You can log in once an admin approves your access.`,
          data: { companyName: company.name, status: 'pending' },
        });
        return;
      }

      res.status(400).json({ success: false, message: "Invalid registration mode. Use 'company' or 'join'." });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
    }
  }
}
