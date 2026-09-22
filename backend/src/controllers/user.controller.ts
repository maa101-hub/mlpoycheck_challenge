import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { Database } from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';

/**
 * User Controller - CRUD operations for user management
 */
export class UserController {
  static async getAll(req: AuthRequest, res: Response): Promise<void> {
    const users = (await Database.getUsers()).map(u => ({ ...u, password: undefined }));
    res.status(200).json({ success: true, data: users, total: users.length });
  }

  static async getById(req: AuthRequest, res: Response): Promise<void> {
    const user = await Database.getUserById(req.params.id as string);
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

      if (await Database.getUserByEmail(email)) {
        res.status(409).json({ success: false, message: 'User with this email already exists.' });
        return;
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Admin-created members belong to the admin's own company and are
      // approved immediately (the admin is adding them directly).
      const adminCompanyId = req.user?.companyId ?? null;
      let companyNameForUser = companyName || '';
      if (adminCompanyId) {
        const company = await Database.getCompanyById(adminCompanyId);
        if (company) companyNameForUser = company.name;
      }

      const newUser = await Database.createUser({
        email: email.toLowerCase(),
        password: hashedPassword,
        fullName,
        role: role || 'general',
        companyName: companyNameForUser,
        companyId: adminCompanyId,
        status: 'approved',
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
    const user = await Database.getUserById(req.params.id as string);
    if (!user) { res.status(404).json({ success: false, message: 'User not found.' }); return; }

    const updates: any = {};
    if (fullName) updates.fullName = fullName;
    if (email) updates.email = email.toLowerCase();
    if (role) updates.role = role;
    if (companyName !== undefined) updates.companyName = companyName;
    if (isActive !== undefined) updates.isActive = isActive;

    const updated = await Database.updateUser(req.params.id as string, updates);
    res.status(200).json({ success: true, message: 'User updated.', data: { ...updated, password: undefined } });
  }

  /**
   * Change the authenticated user's own password.
   * Requires the current password and verifies it before updating.
   */
  static async changePassword(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        res.status(400).json({ success: false, message: 'Current and new password are required.' });
        return;
      }

      if (typeof newPassword !== 'string' || newPassword.length < 6) {
        res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
        return;
      }

      const user = await Database.getUserById(userId);
      if (!user) {
        res.status(404).json({ success: false, message: 'User not found.' });
        return;
      }

      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        res.status(401).json({ success: false, message: 'Current password is incorrect.' });
        return;
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      await Database.updateUser(userId, { password: hashedPassword });

      res.status(200).json({ success: true, message: 'Password updated successfully.' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to update password.' });
    }
  }

  static async delete(req: AuthRequest, res: Response): Promise<void> {
    if (req.user && (req.params.id as string) === req.user.id) {
      res.status(400).json({ success: false, message: 'Cannot delete your own account.' });
      return;
    }
    const deleted = await Database.deleteUser(req.params.id as string);
    if (!deleted) { res.status(404).json({ success: false, message: 'User not found.' }); return; }
    res.status(200).json({ success: true, message: 'User deleted.' });
  }
}
