import { Response } from 'express';
import { Database } from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';

/**
 * Record Controller - Fetches verification records with search, sort, pagination
 */
export class RecordController {
  static async getAll(req: AuthRequest, res: Response): Promise<void> {
    const { search, status, riskLevel, sortBy = 'lastUpdated', sortOrder = 'desc', page = '1', limit = '10' } = req.query;

    let records = await Database.getRecords();

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
    const records = await Database.getRecords();
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

  private static readonly VALID_STATUSES = ['verified', 'pending', 'flagged', 'rejected'];
  private static readonly VALID_RISKS = ['low', 'medium', 'high', 'critical'];

  private static today(): string {
    return new Date().toISOString().slice(0, 10); // YYYY-MM-DD, matches seeded format
  }

  static async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { employeeName, department, employeeId, position, verificationStatus, riskLevel } = req.body;

      if (!employeeName || !department || !employeeId || !position) {
        res.status(400).json({ success: false, message: 'employeeName, department, employeeId and position are required.' });
        return;
      }

      const status = verificationStatus || 'pending';
      const risk = riskLevel || 'low';
      if (!RecordController.VALID_STATUSES.includes(status)) {
        res.status(400).json({ success: false, message: 'Invalid verificationStatus.' });
        return;
      }
      if (!RecordController.VALID_RISKS.includes(risk)) {
        res.status(400).json({ success: false, message: 'Invalid riskLevel.' });
        return;
      }

      const record = await Database.createRecord({
        employeeName,
        department,
        employeeId,
        position,
        verificationStatus: status,
        riskLevel: risk,
        lastUpdated: RecordController.today(),
      });

      res.status(201).json({ success: true, message: 'Record created.', data: record });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to create record.' });
    }
  }

  static async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const existing = await Database.getRecordById(id);
      if (!existing) { res.status(404).json({ success: false, message: 'Record not found.' }); return; }

      const { employeeName, department, employeeId, position, verificationStatus, riskLevel } = req.body;
      const updates: any = { lastUpdated: RecordController.today() };

      if (employeeName !== undefined) updates.employeeName = employeeName;
      if (department !== undefined) updates.department = department;
      if (employeeId !== undefined) updates.employeeId = employeeId;
      if (position !== undefined) updates.position = position;
      if (verificationStatus !== undefined) {
        if (!RecordController.VALID_STATUSES.includes(verificationStatus)) {
          res.status(400).json({ success: false, message: 'Invalid verificationStatus.' });
          return;
        }
        updates.verificationStatus = verificationStatus;
      }
      if (riskLevel !== undefined) {
        if (!RecordController.VALID_RISKS.includes(riskLevel)) {
          res.status(400).json({ success: false, message: 'Invalid riskLevel.' });
          return;
        }
        updates.riskLevel = riskLevel;
      }

      const updated = await Database.updateRecord(id, updates);
      res.status(200).json({ success: true, message: 'Record updated.', data: updated });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to update record.' });
    }
  }

  static async remove(req: AuthRequest, res: Response): Promise<void> {
    const deleted = await Database.deleteRecord(req.params.id as string);
    if (!deleted) { res.status(404).json({ success: false, message: 'Record not found.' }); return; }
    res.status(200).json({ success: true, message: 'Record deleted.' });
  }
}
