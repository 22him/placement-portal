import multer from 'multer';
import { HttpError } from './auth.js';

export const uploadPdf = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const okMime = file.mimetype === 'application/pdf';
    const okExt = file.originalname.toLowerCase().endsWith('.pdf');
    if (!okMime || !okExt) return cb(new HttpError(400, 'Only PDF files are allowed'));
    cb(null, true);
  },
}).single('resume');
