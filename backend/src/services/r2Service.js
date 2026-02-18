require('dotenv').config();
const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const multer = require('multer');
const path = require('path');

// Configure S3 client for Cloudflare R2
const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.CLOUDFLARE_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true, // Required for R2
});

console.log('[R2Service] Initialized with:', {
  endpoint: process.env.CLOUDFLARE_ENDPOINT,
  bucket: process.env.CLOUDFLARE_BUCKET_NAME,
  hasAccessKey: !!process.env.CLOUDFLARE_ACCESS_KEY_ID,
  hasSecretKey: !!process.env.CLOUDFLARE_SECRET_ACCESS_KEY,
  publicUrl: process.env.CLOUDFLARE_PUBLIC_URL
});

const BUCKET_NAME = process.env.CLOUDFLARE_BUCKET_NAME || 'sahal-card-2025';


// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // strict check
    if (file.mimetype.startsWith('image/')) {
      return cb(null, true);
    }

    // Fallback: check extension if mimetype is generic or missing
    const ext = path.extname(file.originalname).toLowerCase();
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.tiff', '.tif', '.heic', '.heif'];

    if (validExtensions.includes(ext)) {
      // Manually fix mimetype for common cases that might be mis-detected
      if (ext === '.jpg' || ext === '.jpeg') file.mimetype = 'image/jpeg';
      if (ext === '.png') file.mimetype = 'image/png';
      if (ext === '.webp') file.mimetype = 'image/webp';
      return cb(null, true);
    }

    cb(new Error('Only image files are allowed!'), false);
  },
});

class R2Service {
  /**
   * Helper to construct public URL with correct base
   * @param {string} key - Object key
   * @returns {string} - Full public URL
   */
  static _constructPublicUrl(key) {
    const publicUrlBase = process.env.CLOUDFLARE_PUBLIC_URL;
    const bucketName = process.env.CLOUDFLARE_BUCKET_NAME || 'sahal-card-2025';

    if (!publicUrlBase) {
      console.error('[R2Service] ❌ CRITICAL: CLOUDFLARE_PUBLIC_URL is not defined in .env');
      return `https://MISSING_R2_PUBLIC_URL/${key}`;
    }

    // Clean the base URL (remove trailing slash)
    let cleanBase = publicUrlBase.replace(/\/$/, '');

    // If the public URL creates a duplicated bucket path (common with some R2 setups), fix it
    // Example: https://pub-xxx.r2.dev/bucketName/bucketName/file.jpg -> https://pub-xxx.r2.dev/bucketName/file.jpg
    if (cleanBase.endsWith(`/${bucketName}`)) {
      // It already includes the bucket name, so we just append the key
      // But if the key also starts with the bucket name (rare but possible), we might double up.
      // For now, standard behavior:
    }

    return `${cleanBase}/${key}`;
  }

  /**
   * Upload a file to R2 storage with a custom folder path
   * @param {Buffer} fileBuffer - File buffer
   * @param {string} fileName - File name
   * @param {string} contentType - MIME type
   * @param {string} folderPath - Folder path (e.g., 'marketer-ids', 'marketer-profiles', 'uploads')
   * @returns {Promise<string>} - Public URL of uploaded file
   */
  static async uploadFileToPath(fileBuffer, fileName, contentType, folderPath = 'uploads') {
    try {
      const key = `${folderPath}/${Date.now()}-${fileName}`;

      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
        // ACL removed for Cloudflare R2 compatibility
      });

      console.log('[R2Service] Uploading file to path:', {
        key,
        folderPath,
        bucket: BUCKET_NAME,
        size: fileBuffer.length,
        contentType
      });

      const result = await s3Client.send(command);
      console.log('[R2Service] Upload successful:', result);

      // Generate public URL using helper
      const publicUrl = this._constructPublicUrl(key);

      return publicUrl;
    } catch (error) {
      console.error('R2 upload error:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  /**
   * Upload a marketer's government ID image
   * @param {Buffer} fileBuffer - File buffer
   * @param {string} fileName - File name
   * @param {string} contentType - MIME type
   * @returns {Promise<string>} - Public URL of uploaded file
   */
  static async uploadMarketerIdImage(fileBuffer, fileName, contentType) {
    return this.uploadFileToPath(fileBuffer, fileName, contentType, 'marketer-ids');
  }

  /**
   * Upload a marketer's profile picture
   * @param {Buffer} fileBuffer - File buffer
   * @param {string} fileName - File name
   * @param {string} contentType - MIME type
   * @returns {Promise<string>} - Public URL of uploaded file
   */
  static async uploadMarketerProfileImage(fileBuffer, fileName, contentType) {
    return this.uploadFileToPath(fileBuffer, fileName, contentType, 'marketer-profiles');
  }

  /**
   * Upload a file to R2 storage (default uploads folder)
   * @param {Buffer} fileBuffer - File buffer
   * @param {string} fileName - File name
   * @param {string} contentType - MIME type
   * @returns {Promise<string>} - Public URL of uploaded file
   */
  static async uploadFile(fileBuffer, fileName, contentType) {
    try {
      const key = `uploads/${Date.now()}-${fileName}`;

      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
        // ACL removed for Cloudflare R2 compatibility
      });

      console.log('[R2Service] Uploading file:', {
        key,
        bucket: BUCKET_NAME,
        size: fileBuffer.length,
        contentType
      });

      const result = await s3Client.send(command);
      console.log('[R2Service] Upload successful:', result);

      // Generate public URL using helper
      const publicUrl = this._constructPublicUrl(key);

      return publicUrl;
    } catch (error) {
      console.error('R2 upload error:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  /**
   * Delete a file from R2 storage
   * @param {string} fileUrl - Public URL of the file
   * @returns {Promise<boolean>} - Success status
   */
  static async deleteFile(fileUrl) {
    try {
      // Extract key from URL
      const urlParts = fileUrl.split('/');
      const key = urlParts.slice(-2).join('/'); // Get 'uploads/filename'

      const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      await s3Client.send(command);
      return true;
    } catch (error) {
      console.error('Error deleting file from R2:', error);
      return false;
    }
  }

  /**
   * Generate a presigned URL for file upload (for direct client uploads)
   * @param {string} fileName - File name
   * @param {string} contentType - MIME type
   * @returns {Promise<{uploadUrl: string, publicUrl: string}>}
   */
  static async generatePresignedUploadUrl(fileName, contentType) {
    try {
      const key = `uploads/${Date.now()}-${fileName}`;

      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        ContentType: contentType,
        // ACL removed for Cloudflare R2 compatibility
      });

      const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour

      // Use the public URL from helper
      const publicUrl = this._constructPublicUrl(key);

      return { uploadUrl, publicUrl };
    } catch (error) {
      console.error('Error generating presigned URL:', error);
      throw new Error('Failed to generate upload URL');
    }
  }

  /**
   * Generate a fresh signed URL for an existing file
   * @param {string} fileUrl - Existing file URL
   * @returns {Promise<string>} - Fresh signed URL
   */
  static async generateFreshSignedUrl(fileUrl) {
    try {
      // Check if it's already a public URL (doesn't need refreshing)
      const publicUrlBase = process.env.CLOUDFLARE_PUBLIC_URL;
      if (publicUrlBase && fileUrl.startsWith(publicUrlBase)) {
        // It's already a public URL, return as-is
        return fileUrl;
      }

      // Extract key from URL
      const urlParts = fileUrl.split('/');
      const key = urlParts.slice(-2).join('/'); // Get 'uploads/filename'

      const getObjectCommand = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      // Generate fresh signed URL that expires in 7 days
      const signedUrl = await getSignedUrl(s3Client, getObjectCommand, {
        expiresIn: 7 * 24 * 60 * 60 // 7 days
      });

      return signedUrl;
    } catch (error) {
      console.error('Error generating fresh signed URL:', error);
      throw new Error('Failed to generate fresh URL');
    }
  }

  /**
   * Get multer middleware for file uploads
   * @param {string} fieldName - Form field name
   * @returns {Function} - Multer middleware
   */
  static getUploadMiddleware(fieldName = 'file') {
    return upload.single(fieldName);
  }

  /**
   * Validate file type
   * @param {string} mimetype - MIME type
   * @returns {boolean}
   */
  static isValidImageType(mimetype, filename = '') {
    // Accept any image format (image/*)
    if (mimetype && mimetype.startsWith('image/')) {
      return true;
    }

    // Fallback based on extension
    if (filename) {
      const ext = path.extname(filename).toLowerCase();
      const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.tiff', '.tif', '.heic', '.heif'];
      return validExtensions.includes(ext);
    }

    return false;
  }

  /**
   * Generate unique filename
   * @param {string} originalName - Original filename
   * @returns {string} - Unique filename
   */
  static generateUniqueFileName(originalName) {
    const ext = path.extname(originalName);
    const name = path.basename(originalName, ext);
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${name}-${timestamp}-${random}${ext}`;
  }
}

module.exports = R2Service;
