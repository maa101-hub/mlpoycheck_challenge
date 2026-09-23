import { Response } from 'express';
import { Database } from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';

/**
 * Company Controller
 * Provides the authenticated user's own company info, including who to contact
 * (the company's admins) — used by the employee Help Center.
 */
export class CompanyController {
  /**
   * GET /api/company/me
   * Returns the caller's company name and its admin contacts.
   */
  static async myCompany(req: AuthRequest, res: Response): Promise<void> {
    const companyId = req.user?.companyId;
    if (!companyId) {
      res.status(200).json({ success: true, data: { companyName: null, admins: [] } });
      return;
    }

    const company = await Database.getCompanyById(companyId);
    const members = await Database.getUsersByCompany(companyId);
    const admins = members
      .filter(u => u.role === 'admin' && u.isActive)
      .map(u => ({ fullName: u.fullName, email: u.email }));

    res.status(200).json({
      success: true,
      data: {
        companyName: company?.name || req.user?.email?.split('@')[1] || null,
        admins,
      },
    });
  }
}
