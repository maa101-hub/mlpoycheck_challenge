import { Response } from 'express';
import { Database } from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';

/**
 * Access Request Controller
 * Admins review employees who requested to join their company. All actions are
 * scoped to the admin's own company (companyId taken from the JWT), so an admin
 * can never see or act on another company's users.
 */
export class AccessRequestController {
  /**
   * GET /api/access-requests?status=pending
   * Lists users in the admin's company. Defaults to pending requests.
   */
  static async list(req: AuthRequest, res: Response): Promise<void> {
    const companyId = req.user?.companyId;
    if (!companyId) {
      res.status(400).json({ success: false, message: 'Your account is not linked to a company.' });
      return;
    }

    const statusFilter = (req.query.status as string) || 'pending';
    const valid = ['pending', 'approved', 'rejected'];
    const users = await Database.getUsersByCompany(
      companyId,
      valid.includes(statusFilter) ? (statusFilter as any) : undefined
    );

    const data = users.map(u => ({
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      role: u.role,
      status: u.status,
      createdAt: u.createdAt,
    }));

    res.status(200).json({ success: true, data, total: data.length });
  }

  private static async setStatus(req: AuthRequest, res: Response, status: 'approved' | 'rejected'): Promise<void> {
    const companyId = req.user?.companyId;
    const targetId = req.params.id as string;

    const target = await Database.getUserById(targetId);
    if (!target || target.companyId !== companyId) {
      // Either doesn't exist or belongs to another company — same response so
      // an admin can't probe other companies' user ids.
      res.status(404).json({ success: false, message: 'Access request not found.' });
      return;
    }

    if (target.role === 'admin') {
      res.status(400).json({ success: false, message: 'Cannot change the status of a company admin.' });
      return;
    }

    const updated = await Database.updateUser(targetId, { status });
    res.status(200).json({
      success: true,
      message: status === 'approved' ? 'Access approved.' : 'Access rejected.',
      data: { id: updated!.id, status: updated!.status },
    });
  }

  static async approve(req: AuthRequest, res: Response): Promise<void> {
    return AccessRequestController.setStatus(req, res, 'approved');
  }

  static async reject(req: AuthRequest, res: Response): Promise<void> {
    return AccessRequestController.setStatus(req, res, 'rejected');
  }
}
