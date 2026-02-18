const R2Service = require('../services/r2Service');

/**
 * Upload a single file to R2 storage
 */
const uploadFile = async (req, res) => {
  try {
    // Debug logging
    console.log('=== Upload Request Debug ===');
    console.log('req.file:', req.file);
    console.log('req.body:', req.body);
    console.log('req.headers:', req.headers);
    console.log('===========================');

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { buffer, originalname, mimetype } = req.file;

    // Validate file type
    if (!R2Service.isValidImageType(mimetype, originalname)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Only images are allowed.'
      });
    }

    // Generate unique filename
    const uniqueFileName = R2Service.generateUniqueFileName(originalname);

    // Upload to R2
    const publicUrl = await R2Service.uploadFile(buffer, uniqueFileName, mimetype);

    const responseData = {
      url: publicUrl,
      fileName: uniqueFileName,
      originalName: originalname,
      size: buffer.length,
      type: mimetype
    };

    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      data: responseData
    });

  } catch (error) {
    console.error('Upload error:', error);

    // Check for specific R2 credential errors
    if (error.message.includes('credential') || error.message.includes('credentials')) {
      return res.status(500).json({
        success: false,
        message: 'Cloudflare R2 credentials are not properly configured. Please check your environment variables.',
        error: 'R2 credentials not configured',
        details: 'Set CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_ACCESS_KEY_ID, CLOUDFLARE_SECRET_ACCESS_KEY, and CLOUDFLARE_ENDPOINT in your .env file'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to upload file',
      error: error.message
    });
  }
};

/**
 * Generate presigned URL for direct client upload
 */
const generateUploadUrl = async (req, res) => {
  try {
    const { fileName, contentType } = req.body;

    if (!fileName || !contentType) {
      return res.status(400).json({
        success: false,
        message: 'File name and content type are required'
      });
    }

    // Validate content type
    if (!R2Service.isValidImageType(contentType, fileName)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Only images are allowed.'
      });
    }

    const { uploadUrl, publicUrl } = await R2Service.generatePresignedUploadUrl(fileName, contentType);

    res.status(200).json({
      success: true,
      message: 'Upload URL generated successfully',
      data: {
        uploadUrl,
        publicUrl,
        expiresIn: 3600 // 1 hour
      }
    });

  } catch (error) {
    console.error('Generate URL error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate upload URL',
      error: error.message
    });
  }
};

/**
 * Delete a file from R2 storage
 */
const deleteFile = async (req, res) => {
  try {
    const { fileUrl } = req.body;

    if (!fileUrl) {
      return res.status(400).json({
        success: false,
        message: 'File URL is required'
      });
    }

    const success = await R2Service.deleteFile(fileUrl);

    if (success) {
      res.status(200).json({
        success: true,
        message: 'File deleted successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to delete file'
      });
    }

  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete file',
      error: error.message
    });
  }
};

/**
 * Generate fresh signed URL for an existing file
 */
const refreshImageUrl = async (req, res) => {
  try {
    const { fileUrl } = req.body;

    if (!fileUrl) {
      return res.status(400).json({
        success: false,
        message: 'File URL is required'
      });
    }

    const freshUrl = await R2Service.generateFreshSignedUrl(fileUrl);

    res.status(200).json({
      success: true,
      message: 'Fresh URL generated successfully',
      data: {
        url: freshUrl,
        expiresIn: 7 * 24 * 60 * 60 // 7 days
      }
    });

  } catch (error) {
    console.error('Refresh URL error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate fresh URL',
      error: error.message
    });
  }
};

/**
 * Upload a marketer's government ID image to R2 storage
 */
const uploadMarketerIdImage = async (req, res) => {
  try {
    console.log('=== Marketer ID Upload Request ===');
    console.log('req.file:', req.file);

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { buffer, originalname, mimetype } = req.file;

    // Validate file type
    if (!R2Service.isValidImageType(mimetype, originalname)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Only images are allowed.'
      });
    }

    // Generate unique filename
    const uniqueFileName = R2Service.generateUniqueFileName(originalname);

    // Upload to R2 in marketer-ids folder
    const publicUrl = await R2Service.uploadMarketerIdImage(buffer, uniqueFileName, mimetype);

    res.status(200).json({
      success: true,
      message: 'Marketer ID image uploaded successfully',
      data: {
        url: publicUrl,
        fileName: uniqueFileName,
        originalName: originalname,
        size: buffer.length,
        type: mimetype
      }
    });

  } catch (error) {
    console.error('Upload marketer ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload marketer ID image',
      error: error.message
    });
  }
};

/**
 * Upload a marketer's profile picture to R2 storage
 */
const uploadMarketerProfileImage = async (req, res) => {
  try {
    console.log('=== Marketer Profile Upload Request ===');
    console.log('req.file:', req.file);

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { buffer, originalname, mimetype } = req.file;

    // Validate file type
    if (!R2Service.isValidImageType(mimetype, originalname)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Only images are allowed.'
      });
    }

    // Generate unique filename
    const uniqueFileName = R2Service.generateUniqueFileName(originalname);

    // Upload to R2 in marketer-profiles folder
    const publicUrl = await R2Service.uploadMarketerProfileImage(buffer, uniqueFileName, mimetype);

    res.status(200).json({
      success: true,
      message: 'Marketer profile image uploaded successfully',
      data: {
        url: publicUrl,
        fileName: uniqueFileName,
        originalName: originalname,
        size: buffer.length,
        type: mimetype
      }
    });

  } catch (error) {
    console.error('Upload marketer profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload marketer profile image',
      error: error.message
    });
  }
};

module.exports = {
  uploadFile,
  generateUploadUrl,
  deleteFile,
  refreshImageUrl,
  uploadMarketerIdImage,
  uploadMarketerProfileImage
};
