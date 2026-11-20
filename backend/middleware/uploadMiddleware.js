import multer from "multer";
import imagekit from "../config/imagekit.js";

// Configure multer to use memory storage
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Allow images and PDFs
    if (
      file.mimetype.startsWith("image/") ||
      file.mimetype === "application/pdf"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only image and PDF files are allowed"));
    }
  },
});

// Middleware to upload single file (like PDF for emails)
export const uploadSingleFile = upload.single("file");

// Middleware to upload an array of files
export const uploadArray = upload.array("files", 5);

// Middleware to upload any files (supports single or multiple file fields)
export const uploadAnyFiles = upload.any();

// Middleware to upload single file to ImageKit
export const uploadToImageKit = async (req, res, next) => {
  try {
    if (!req.file) return next();

    const result = await imagekit.upload({
      file: req.file.buffer,
      fileName: `${Date.now()}_${req.file.originalname}`,
      folder: "/employee-documents",
    });

    req.imageUrl = result.url;
    next();
  } catch (error) {
    console.error("ImageKit upload error:", error);
    res.status(500).json({ message: "File upload failed" });
  }
};

// Middleware to upload multiple files to ImageKit
export const uploadFilesToImageKit = async (req, res, next) => {
  try {
    const urls = [];
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      for (const f of req.files) {
        const result = await imagekit.upload({
          file: f.buffer,
          fileName: `${Date.now()}_${f.originalname}`,
          folder: "/employee-documents",
        });
        urls.push(result.url);
      }
    } else if (req.file) {
      const result = await imagekit.upload({
        file: req.file.buffer,
        fileName: `${Date.now()}_${req.file.originalname}`,
        folder: "/employee-documents",
      });
      urls.push(result.url);
      req.imageUrl = result.url;
    }
    req.imageUrls = urls;
    next();
  } catch (error) {
    console.error("ImageKit files upload error:", error);
    res.status(500).json({ message: "File upload failed" });
  }
};

// Export multer upload for multiple fields
export const uploadMultiple = upload.fields([
  { name: "passportPhoto", maxCount: 1 },
  { name: "tenthMarksheet", maxCount: 1 },
  { name: "twelthDiplomaMarksheet", maxCount: 1 },
  { name: "graduationMarksheet", maxCount: 1 },
  { name: "bankPassbookPhoto", maxCount: 1 },
  { name: "aadharFront", maxCount: 1 },
  { name: "aadharBack", maxCount: 1 },
  { name: "panCard", maxCount: 1 },
  { name: "cv", maxCount: 1 },
]);

// Middleware to handle multiple uploads
export const handleMultipleUploads = (req, res, next) => {
  uploadMultiple(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    const uploads = {};
    const fields = [
      "passportPhoto",
      "tenthMarksheet",
      "twelthDiplomaMarksheet",
      "graduationMarksheet",
      "bankPassbookPhoto",
      "aadharFront",
      "aadharBack",
      "panCard",
      "cv",
    ];

    for (const field of fields) {
      if (req.files[field]) {
        try {
          const result = await imagekit.upload({
            file: req.files[field][0].buffer,
            fileName: `${Date.now()}_${req.files[field][0].originalname}`,
            folder: "/employee-documents",
          });
          uploads[field] = result.url;
        } catch (error) {
          console.error(`Upload error for ${field}:`, error);
          return res.status(500).json({ message: `Upload failed for ${field}` });
        }
      }
    }

    req.uploadedUrls = uploads;
    next();
  });
};