import { Response } from 'express';
import { Database } from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';

/**
 * Record Controller - Fetches verification records with search, sort, pagination
 */
export class RecordController {
  static async getAll(req: AuthRequest, res: Response): Promise<void> {
    const { search, status, riskLevel, sortBy = 'lastUpdated', sortOrder = 'desc', page = '1', limit = '10' } = req.query;

    let records = Database.getRecords();

    // Search filter
    if (search) {
      const s = (search as string).toLowerCase();
      records = records.filter(r =>
        r.employeeName.toLowerCase().includes(s) ||
        r.department.toLowerCase().includes(s) ||
        r.employeeId.toLowerCase().includes(s)
      );
    }

    // Status filter
    if (status) records = records.filter(r => r.verificationStatus === status);

    // Risk level filter
    if (riskLevel) records = records.filter(r => r.riskLevel === riskLevel);

    // Sort
    const field = sortBy as keyof typeof records[0];
    records.sort((a, b) => {
      const aVal = a[field] || '';
      const bVal = b[field] || '';
      return sortOrder === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
    });

    // Pagination
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 10;
    const total = records.length;
    const totalPages = Math.ceil(total / limitNum);
    const paginated = records.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    res.status(200).json({
      success: true,
      data: paginated,
      pagination: { total, page: pageNum, limit: limitNum, totalPages, hasNext: pageNum < totalPages, hasPrev: pageNum > 1 },
    });
  }

  static async getSummary(req: AuthRequest, res: Response): Promise<void> {
    const records = Database.getRecords();
    res.status(200).json({
      success: true,
      data: {
        totalRecords: records.length,
        verified: records.filter(r => r.verificationStatus === 'verified').length,
        pending: records.filter(r => r.verificationStatus === 'pending').length,
        flagged: records.filter(r => r.verificationStatus === 'flagged').length,
        rejected: records.filter(r => r.verificationStatus === 'rejected').length,
      },
    });
  }
}
