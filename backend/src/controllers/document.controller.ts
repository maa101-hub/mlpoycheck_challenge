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

    const validTypes = ['passport', 'degree', 'employment_letter', 'background_cert', 'photo_id'];
    if (!validTypes.includes(type)) {
      res.status(400).json({ success: false, message: 'Invalid document type.' });
      return;
    }

    // Check if already uploaded
    const existing = (await Database.getDocuments(userId)).find(d => d.type === type);
    if (existing) {
      res.status(409).json({ success: false, message: 'This document type has already been uploaded.' });
      return;
    }

    // Simulate file upload (in real app, would handle multipart/form-data)
    const doc = await Database.addDocument({
      userId,
      name: fileName,
      type: type as any,
      status: 'uploaded',
      size: `${(Math.random() * 4 + 0.5).toFixed(1)} MB`,
    });

    // Auto-verify after 3 seconds (simulates backend processing)
    setTimeout(() => {
      Database.updateDocumentStatus(doc.id, 'verified').catch(err => {
        console.error('Auto-verify failed:', err);
      });
    }, 3000);

    res.status(201).json({
      success: true,
      message: `${fileName} uploaded successfully. Verification in progress.`,
      data: doc,
    });
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
