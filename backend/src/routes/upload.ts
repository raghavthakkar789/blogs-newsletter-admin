import { Router, Response } from 'express';
import fileUpload from 'express-fileupload';
import path from 'path';
import fs from 'fs';
import { authenticate, AuthRequest } from '../middleware/authenticate';

const router = Router();

router.use(authenticate);

// Ensure upload directory exists
const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure file upload middleware
const uploadMiddleware = fileUpload({
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') // 10MB default
  },
  abortOnLimit: true,
  responseOnLimit: 'File size limit exceeded',
  createParentPath: true
});

// Upload file
router.post('/', uploadMiddleware, (req: AuthRequest, res: Response) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const file = Array.isArray(req.files.file) ? req.files.file[0] : req.files.file;
    
    // Validate file type
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimes.includes(file.mimetype)) {
      return res.status(400).json({ 
        message: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.' 
      });
    }
    
    // Sanitize filename
    const sanitized = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const timestamp = Date.now();
    const ext = path.extname(sanitized);
    const name = path.basename(sanitized, ext);
    const filename = `${timestamp}-${name}${ext}`;
    const filepath = path.join(uploadDir, filename);
    
    // Save file
    file.mv(filepath, (err) => {
      if (err) {
        return res.status(500).json({ message: 'Failed to save file' });
      }
      
      // Return file URL (relative path)
      const fileUrl = `/uploads/${filename}`;
      
      res.json({
        url: fileUrl,
        filename: filename
      });
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'File upload failed' });
  }
});

export default router;

