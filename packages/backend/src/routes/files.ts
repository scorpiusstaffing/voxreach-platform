import { Router, Response } from 'express';
import { AuthRequest, authenticate } from '../middleware/auth';
import { prisma } from '../db';
import * as vapi from '../services/vapi';
import { secureUpload, sanitizeFilename, validateFileContent } from '../middleware/fileUpload';

const router = Router();
router.use(authenticate);

// GET /api/files — list all files for org
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    // Fetch from Vapi since files are stored there
    const vapiFiles = await vapi.listFiles();
    res.json({ success: true, data: vapiFiles });
  } catch (err: any) {
    console.error('List files error:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});

// POST /api/files/upload — upload a file for knowledge base
router.post('/upload', secureUpload, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    // Validate file content
    const validation = await validateFileContent(req.file);
    if (!validation.valid) {
      return res.status(400).json({ 
        success: false, 
        error: validation.error || 'File validation failed' 
      });
    }

    // Sanitize filename
    const sanitizedName = sanitizeFilename(req.file.originalname);

    // Upload to Vapi
    const vapiFile = await vapi.uploadFile({
      name: sanitizedName,
      content: req.file.buffer,
      contentType: req.file.mimetype,
    });

    // Log the upload for security auditing
    console.log(`File uploaded by user ${req.userId}: ${sanitizedName} (${req.file.size} bytes, ${req.file.mimetype})`);

    res.status(201).json({ success: true, data: vapiFile });
  } catch (err: any) {
    console.error('Upload file error:', err);
    
    // Provide user-friendly error messages
    let errorMessage = err.message || 'Internal server error';
    let statusCode = 500;
    
    if (err.message.includes('File type') || err.message.includes('File extension')) {
      statusCode = 400;
      errorMessage = 'Invalid file type. Please upload a supported document, image, or audio file.';
    } else if (err.message.includes('File size')) {
      statusCode = 400;
      errorMessage = 'File too large. Maximum size is 10MB.';
    } else if (err.message.includes('Executable') || err.message.includes('malicious')) {
      statusCode = 400;
      errorMessage = 'File rejected for security reasons.';
    }
    
    res.status(statusCode).json({ success: false, error: errorMessage });
  }
});

// GET /api/files/:id — get file details
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const file = await vapi.getFile(req.params.id);
    res.json({ success: true, data: file });
  } catch (err: any) {
    console.error('Get file error:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});

// DELETE /api/files/:id — delete a file
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    await vapi.deleteFile(req.params.id);
    res.json({ success: true, message: 'File deleted' });
  } catch (err: any) {
    console.error('Delete file error:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});

export default router;
