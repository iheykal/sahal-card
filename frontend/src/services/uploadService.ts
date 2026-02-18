import axios from 'axios';

import { API_BASE_URL } from './apiConfig';

const api = axios.create({
  baseURL: API_BASE_URL,
  // Important: do NOT set a default 'Content-Type' here. When sending FormData, axios must set
  // the Content-Type including the multipart boundary automatically. A default of
  // 'application/json' prevents axios from setting the proper multipart Content-Type and
  // causes the server to see no file (Bad Request / No file uploaded).
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  console.log('[UploadService] Interceptor - Token check:', token ? `Present (${token.substring(0, 10)}...)` : 'MISSING');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('[UploadService] Authorization header set');
  } else {
    console.warn('[UploadService] Warning: No token found in localStorage for upload request');
  }
  return config;
});

export interface UploadResponse {
  success: boolean;
  message: string;
  data: {
    url: string;
    fileName: string;
    originalName: string;
    size: number;
    type: string;
  };
}

export interface PresignedUrlResponse {
  success: boolean;
  message: string;
  data: {
    uploadUrl: string;
    publicUrl: string;
    expiresIn: number;
  };
}

export const uploadService = {
  /**
   * Upload file directly to backend (server-side upload to R2)
   */
  uploadFile: async (file: File): Promise<UploadResponse> => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      // Debug: log file info and formData entries so we can inspect payload in console
      console.log('uploadFile: file ->', { name: file.name, size: file.size, type: file.type });
      try {
        for (const entry of formData.entries()) {
          // entry[1] can be a File object; log minimal info
          if (entry[1] instanceof File) {
            const f = entry[1] as File;
            console.log('formData entry:', entry[0], { name: f.name, size: f.size, type: f.type });
          } else {
            console.log('formData entry:', entry[0], entry[1]);
          }
        }
      } catch (logErr) {
        console.warn('Failed to iterate formData entries for logging', logErr);
      }

      // Primary upload path using axios instance
      const response = await api.post('/upload/file', formData);

      return response.data;
    } catch (err: any) {
      console.error('uploadFile error:', err.response?.data || err.message || err);

      // If server explicitly reported no file uploaded, try a fetch fallback to rule out axios boundary issues
      if (err.response?.data?.message && typeof err.response.data.message === 'string' && err.response.data.message.toLowerCase().includes('no file')) {
        console.warn('uploadFile: server said no file uploaded — retrying upload with fetch as a fallback to verify payload');
        try {
          const token = localStorage.getItem('token');
          const fallbackResponse = await fetch(`${API_BASE_URL}/upload/file`, {
            method: 'POST',
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            body: (() => {
              const fd = new FormData();
              fd.append('file', file);
              return fd;
            })(),
          });

          const data = await fallbackResponse.json();
          if (!fallbackResponse.ok) {
            console.error('uploadFile fallback (fetch) failed:', data);
            // Throw the original axios error to preserve stack/response for callers
            throw err;
          }

          console.log('uploadFile fallback succeeded:', data);
          return data;
        } catch (fetchErr) {
          console.error('uploadFile fetch fallback error:', fetchErr);
          throw err; // keep original error for caller
        }
      }

      // Rethrow the original axios error so callers can inspect error.response
      throw err;
    }
  },

  /**
   * Generate presigned URL for direct client upload to R2
   */
  generatePresignedUrl: async (fileName: string, contentType: string): Promise<PresignedUrlResponse> => {
    const response = await api.post('/upload/presigned-url', {
      fileName,
      contentType,
    });

    return response.data;
  },

  /**
   * Upload file directly to R2 using presigned URL
   */
  uploadToR2: async (file: File, presignedUrl: string): Promise<void> => {
    try {
      await axios.put(presignedUrl, file, {
        headers: {
          'Content-Type': file.type,
        },
      });
    } catch (err: any) {
      console.error('uploadToR2 error:', err.response?.data || err.message || err);
      throw err;
    }
  },

  /**
   * Delete file from R2 storage
   */
  deleteFile: async (fileUrl: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete('/upload/file', {
      data: { fileUrl },
    });

    return response.data;
  },

  /**
   * Upload file with progress tracking
   */
  uploadFileWithProgress: async (
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<UploadResponse> => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/upload/file', formData, {
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        },
      });

      return response.data;
    } catch (err: any) {
      console.error('uploadFileWithProgress error:', err.response?.data || err.message || err);
      throw err;
    }
  },

  /**
   * Validate file before upload
   */
  validateFile: (file: File): { isValid: boolean; error?: string } => {
    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'File size must be less than 5MB',
      };
    }

    // Check file type - accept any image format
    // enhanced check: rely on extension if type is missing or generic
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.tiff', '.tif', '.heic', '.heif'];
    const fileName = file.name.toLowerCase();
    const hasValidExt = validExtensions.some(ext => fileName.endsWith(ext));

    if (!file.type.startsWith('image/') && !hasValidExt) {
      return {
        isValid: false,
        error: 'Only image files are allowed',
      };
    }

    return { isValid: true };
  },

  /**
   * Convert file to base64 (for preview)
   */
  fileToBase64: (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },
};

export default uploadService;
