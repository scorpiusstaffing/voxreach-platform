import multer from 'multer';
import path from 'path';
import { Request } from 'express';

// Allowed file types
const ALLOWED_MIME_TYPES = [
  // Documents
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  
  // Audio
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'audio/webm',
  
  // Text formats
  'application/json',
  'text/markdown',
  'text/html',
];

// Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Configure storage
const storage = multer.memoryStorage(); // Store in memory for processing

// File filter function
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check file type
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(new Error(`File type ${file.mimetype} is not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`));
  }

  // Check file extension
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = ['.pdf', '.txt', '.csv', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', 
                            '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', 
                            '.mp3', '.wav', '.ogg', '.webm',
                            '.json', '.md', '.html'];

  if (!allowedExtensions.includes(ext)) {
    return cb(new Error(`File extension ${ext} is not allowed.`));
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return cb(new Error(`File size ${file.size} bytes exceeds maximum allowed size of ${MAX_FILE_SIZE} bytes.`));
  }

  // Additional security checks
  const filename = file.originalname.toLowerCase();
  
  // Prevent executable files
  if (filename.endsWith('.exe') || filename.endsWith('.bat') || filename.endsWith('.sh') || 
      filename.endsWith('.php') || filename.endsWith('.py') || filename.endsWith('.js')) {
    return cb(new Error('Executable files are not allowed.'));
  }

  // Prevent hidden files
  if (filename.startsWith('.')) {
    return cb(new Error('Hidden files are not allowed.'));
  }

  // Prevent path traversal attempts
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return cb(new Error('Invalid filename.'));
  }

  cb(null, true);
};

// Create multer instance with security configurations
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1, // Limit to 1 file per request
  },
});

// Middleware to sanitize filename
export function sanitizeFilename(filename: string): string {
  // Remove path components
  const basename = path.basename(filename);
  
  // Replace spaces with underscores
  let sanitized = basename.replace(/\s+/g, '_');
  
  // Remove special characters (keep alphanumeric, dots, underscores, hyphens)
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '');
  
  // Limit length
  if (sanitized.length > 100) {
    const ext = path.extname(sanitized);
    const name = path.basename(sanitized, ext);
    sanitized = name.substring(0, 95) + ext;
  }
  
  // Add timestamp to prevent collisions
  const timestamp = Date.now();
  const ext = path.extname(sanitized);
  const name = path.basename(sanitized, ext);
  return `${name}_${timestamp}${ext}`;
}

// Middleware to validate uploaded file content
export async function validateFileContent(file: Express.Multer.File): Promise<{ valid: boolean; error?: string }> {
  try {
    // Check for null bytes (common in malicious files)
    if (file.buffer.includes(0x00)) {
      return { valid: false, error: 'File contains null bytes (potential malicious content)' };
    }

    // Check for PHP tags (common in web shells)
    const contentStr = file.buffer.toString('utf8', 0, Math.min(file.buffer.length, 4096));
    if (contentStr.includes('<?php') || contentStr.includes('<?=')) {
      return { valid: false, error: 'File contains PHP code (potential web shell)' };
    }

    // Check for script tags in HTML/XML files
    if (file.mimetype.includes('html') || file.mimetype.includes('xml')) {
      if (contentStr.toLowerCase().includes('<script>')) {
        return { valid: false, error: 'File contains script tags (potential XSS attack)' };
      }
    }

    // Check for executable headers
    const header = file.buffer.slice(0, 4);
    const executableHeaders = [
      Buffer.from('MZ', 'ascii'), // Windows EXE
      Buffer.from('\x7FELF', 'ascii'), // Linux ELF
      Buffer.from('#!', 'ascii'), // Shell script
    ];

    for (const execHeader of executableHeaders) {
      if (header.slice(0, execHeader.length).equals(execHeader)) {
        return { valid: false, error: 'File appears to be an executable' };
      }
    }

    return { valid: true };
  } catch (error) {
    console.error('File content validation error:', error);
    return { valid: false, error: 'Failed to validate file content' };
  }
}

// Express middleware for file upload with security
export const secureUpload = upload.single('file');