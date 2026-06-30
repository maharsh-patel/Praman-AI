import multer from 'multer';
import path from 'path';

// Store files in memory
const storage = multer.memoryStorage();

// File filter for CSV and Excel files
const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.csv', '.xlsx', '.xls'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only CSV and Excel (.xlsx, .xls) files are allowed.'), false);
  }
};

// Set file upload limit to 5MB
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB
  }
});

export default upload;
