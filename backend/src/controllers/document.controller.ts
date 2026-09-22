import { Response } from 'express';
import { Database } from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';

/**
 * Document Controller
 * Handles document uploads and verification progress tracking
 */
export class DocumentController {
  /**
   * GET /api/documents - Get user's documents
   */
  static async getMyDocuments(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const docs = await Database.getDocuments(userId);
    res.json({ success: true, data: docs });
  }

  /**
   * GET /api/documents/progress - Get verification progress
   */
  static async getProgress(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const progress = await Database.getVerificationProgress(userId);
    const percentage = progress.total > 0 ? Math.round((progress.uploaded / progress.total) * 100) : 0;

    // Final report available only when all docs are uploaded
    const finalReportReady = progress.uploaded === progress.total;

    res.json({
      success: true,
      data: {
        percentage,
        totalRequired: progress.total,
        uploaded: progress.uploaded,
        verified: progress.verified,
        finalReportReady,
        steps: progress.steps,
      }
    });
  }

  /**
   * POST /api/documents/upload - Upload a document (simulated)
   * Body: { type: 'passport' | 'degree' | 'employment_letter' | 'background_cert' | 'photo_id', fileName: string }
   */
  static async upload(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { type, fileName } = req.body;

    if (!type || !fileName) {
      res.status(400).json({ success: false, message: 'Document type and fileName are required.' });
      return;
    }

    // Valid types are the ones required by the uploader's company.
    const user = await Database.getUserById(userId);
    const requiredDocs = await Database.getRequiredDocuments(user?.companyId);
    if (!requiredDocs.some(d => d.type === type)) {
      res.status(400).json({ success: false, message: 'This document is not required for your company.' });
      return;
    }

    // Check if already uploaded
    const existing = (await Database.getDocuments(userId)).find(d => d.type === type);
    if (existing) {
      res.status(409).json({ success: false, message: 'This document type has already been uploaded.' });
      return;
    }

    // Simulate file upload (in real app, would handle multipart/form-data).
    // The document stays 'uploaded' (under review) until a company admin
    // verifies or rejects it — no more automatic verification.
    const doc = await Database.addDocument({
      userId,
      name: fileName,
      type: type as any,
      status: 'uploaded',
      size: `${(Math.random() * 4 + 0.5).toFixed(1)} MB`,
    });

    res.status(201).json({
      success: true,
      message: `${fileName} uploaded successfully. Awaiting admin review.`,
      data: doc,
    });
  }

  // ─── ADMIN REVIEW ───────────────────────────────────────────────────
  /**
   * GET /api/documents/review  (admin)
   * Lists the admin's company employees with a verification-progress summary.
   */
  static async getReviewList(req: AuthRequest, res: Response): Promise<void> {
    const companyId = req.user?.companyId;
    if (!companyId) {
      res.status(400).json({ success: false, message: 'Your account is not linked to a company.' });
      return;
    }
    const employees = await Database.getEmployeesReview(companyId);
    res.json({ success: true, data: employees, total: employees.length });
  }

  /** Shared guard: ensure the document belongs to an employee of the admin's company. */
  private static async ensureSameCompany(req: AuthRequest, res: Response, docId: string): Promise<{ ownerId: string } | null> {
    const doc = await Database.getDocumentById(docId);
    if (!doc) {
      res.status(404).json({ success: false, message: 'Document not found.' });
      return null;
    }
    const owner = await Database.getUserById(doc.userId);
    if (!owner || owner.companyId !== req.user?.companyId) {
      res.status(404).json({ success: false, message: 'Document not found.' });
      return null;
    }
    return { ownerId: doc.userId };
  }

  /** POST /api/documents/:id/verify  (admin) */
  static async verifyDocument(req: AuthRequest, res: Response): Promise<void> {
    const ok = await DocumentController.ensureSameCompany(req, res, req.params.id as string);
    if (!ok) return;
    await Database.updateDocumentStatus(req.params.id as string, 'verified');
    res.json({ success: true, message: 'Document verified.' });
  }

  /** POST /api/documents/:id/reject  (admin) */
  static async rejectDocument(req: AuthRequest, res: Response): Promise<void> {
    const ok = await DocumentController.ensureSameCompany(req, res, req.params.id as string);
    if (!ok) return;
    await Database.updateDocumentStatus(req.params.id as string, 'rejected');
    res.json({ success: true, message: 'Document rejected.' });
  }

  /**
   * POST /api/documents/verify-employee/:userId  (admin)
   * Verifies every uploaded (under-review) document for one employee at once.
   */
  static async verifyEmployee(req: AuthRequest, res: Response): Promise<void> {
    const companyId = req.user?.companyId;
    const targetId = req.params.userId as string;
    const owner = await Database.getUserById(targetId);
    if (!owner || owner.companyId !== companyId) {
      res.status(404).json({ success: false, message: 'Employee not found.' });
      return;
    }
    const docs = await Database.getDocuments(targetId);
    const toVerify = docs.filter(d => d.status === 'uploaded');
    for (const d of toVerify) {
      await Database.updateDocumentStatus(d.id, 'verified');
    }
    res.json({ success: true, message: `Verified ${toVerify.length} document(s) for ${owner.fullName}.` });
  }

  /**
   * GET /api/documents/report - Get final verification report
   */
  static async getFinalReport(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user!.id;
    const progress = await Database.getVerificationProgress(userId);

    if (progress.uploaded < progress.total) {
      res.status(403).json({
        success: false,
        message: `Upload all required documents first. ${progress.total - progress.uploaded} remaining.`,
      });
      return;
    }

    const user = await Database.getUserById(userId);
    res.json({
      success: true,
      data: {
        reportId: `RPT-${Date.now().toString(36).toUpperCase()}`,
        employeeName: user?.fullName || 'Unknown',
        generatedAt: new Date().toISOString(),
        status: progress.verified === progress.total ? 'fully_verified' : 'partially_verified',
        documentsVerified: progress.verified,
        totalDocuments: progress.total,
        summary: progress.verified === progress.total
          ? 'All documents have been verified. Employee cleared for onboarding.'
          : 'Some documents are still being reviewed by the compliance team.',
      }
    });
  }
}
