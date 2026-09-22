import { Response } from 'express';
import { Database } from '../config/database';
import { AuthRequest } from '../middleware/auth.middleware';

/**
 * Required Document Controller
 * Admins define which documents their company requires for verification.
 * All actions are scoped to the caller's company (companyId from the JWT).
 */
export class RequiredDocumentController {
  /**
   * GET /api/required-documents
   * Any authenticated member can read their company's required list
   * (employees need it to know what to upload).
   */
  static async list(req: AuthRequest, res: Response): Promise<void> {
    const companyId = req.user?.companyId;
    const docs = await Database.getRequiredDocuments(companyId);
    res.status(200).json({ success: true, data: docs, total: docs.length });
  }

  /**
   * POST /api/required-documents  (admin)
   * Body: { docType, label, step? }
   * docType is normalised to a lowercase snake_case slug.
   */
  static async add(req: AuthRequest, res: Response): Promise<void> {
    const companyId = req.user?.companyId;
    if (!companyId) {
      res.status(400).json({ success: false, message: 'Your account is not linked to a company.' });
      return;
    }

    const { label } = req.body;
    let { docType, step } = req.body;

    if (!label || typeof label !== 'string') {
      res.status(400).json({ success: false, message: 'A document label is required.' });
      return;
    }

    // Derive a slug from docType or the label if docType is missing.
    const base = (docType || label).toString().toLowerCase().trim();
    docType = base.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    if (!docType) {
      res.status(400).json({ success: false, message: 'Could not derive a valid document type.' });
      return;
    }
    if (!step) step = `${label} Verification`;

    const doc = await Database.addRequiredDocument(companyId, docType, label, step);
    res.status(201).json({ success: true, message: 'Required document added.', data: doc });
  }

  /**
   * DELETE /api/required-documents/:docType  (admin)
   */
  static async remove(req: AuthRequest, res: Response): Promise<void> {
    const companyId = req.user?.companyId;
    if (!companyId) {
      res.status(400).json({ success: false, message: 'Your account is not linked to a company.' });
      return;
    }
    const docType = req.params.docType as string;
    const deleted = await Database.deleteRequiredDocument(companyId, docType);
    if (!deleted) {
      res.status(404).json({ success: false, message: 'Required document not found.' });
      return;
    }
    res.status(200).json({ success: true, message: 'Required document removed.' });
  }
}
