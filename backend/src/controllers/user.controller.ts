import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { Database } from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';

/**
 * User Controller - CRUD operations for user management
 */
export class UserController {
  static async getAll(req: AuthRequest, res: Response): Promise<void> {
    const users = Database.getUsers().map(u => ({ ...u, password: undefined }));
    res.status(200).json({ success: true, data: users, total: users.length });
  }

  static async getById(req: AuthRequest, res: Response): Promise<void> {
    const user = Database.getUserById(req.params.id as string);
    if (!user) { res.status(404).json({ success: false, message: 'User not found.' }); return; }
    res.status(200).json({ success: true, data: { ...user, password: undefined } });
  }

  static async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { email, password, fullName, role, companyName } = req.body;
      if (!email || !password || !fullName) {
        res.status(400).json({ success: false, message: 'Email, password, and full name are required.' });
        return;
      }

      if (Database.getUserByEmail(email)) {
        res.status(409).json({ success: false, message: 'User with this email already exists.' });
        return;
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newUser = Database.createUser({
        email: email.toLowerCase(),
        password: hashedPassword,
        fullName,
        role: role || 'general',
        companyName: companyName || '',
        lastLogin: null,
        isActive: true,
      });

      res.status(201).json({ success: true, message: 'User created.', data: { ...newUser, password: undefined } });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to create user.' });
    }
  }

  static async update(req: AuthRequest, res: Response): Promise<void> {
    const { fullName, email, role, companyName, isActive } = req.body;
    const user = Database.getUserById(req.params.id as string);
    if (!user) { res.status(404).json({ success: false, message: 'User not found.' }); return; }

    const updates: any = {};
    if (fullName) updates.fullName = fullName;
    if (email) updates.email = email.toLowerCase();
    if (role) updates.role = role;
    if (companyName !== undefined) updates.companyName = companyName;
    if (isActive !== undefined) updates.isActive = isActive;

    const updated = Database.updateUser(req.params.id as string, updates);
    res.status(200).json({ success: true, message: 'User updated.', data: { ...updated, password: undefined } });
  }

  static async delete(req: AuthRequest, res: Response): Promise<void> {
    if (req.user && (req.params.id as string) === req.user.id) {
      res.status(400).json({ success: false, message: 'Cannot delete your own account.' });
      return;
    }
    const deleted = Database.deleteUser(req.params.id as string);
    if (!deleted) { res.status(404).json({ success: false, message: 'User not found.' }); return; }
    res.status(200).json({ success: true, message: 'User deleted.' });
  }
}
