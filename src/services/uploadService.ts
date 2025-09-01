// src/services/uploadService.ts
interface UploadResponse {
  success: boolean
  message: string
  data?: {
    fileId: string
    webViewLink: string
    webContentLink: string
    fileName: string
    fileSize: number
  }
  error?: string
}

interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

class UploadService {
  private static instance: UploadService
  private baseURL: string

  private constructor() {
    // Adjust based on your backend URL
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
  }

  public static getInstance(): UploadService {
    if (!UploadService.instance) {
      UploadService.instance = new UploadService()
    }
    return UploadService.instance
  }

  /**
   * Upload file untuk atlet
   */
  async uploadAtletFile(
    file: File,
    fileType: 'ktp' | 'akte_kelahiran' | 'pas_foto' | 'sertifikat_belt',
    userId: number,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResponse> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('fileType', fileType)
    formData.append('userType', 'atlet')
    formData.append('userId', userId.toString())

    return this.uploadWithProgress(
      `${this.baseURL}/upload/atlet`,
      formData,
      onProgress
    )
  }

  /**
   * Upload file untuk pelatih
   */
  async uploadPelatihFile(
    file: File,
    fileType: 'foto_ktp' | 'sertifikat_sabuk',
    userId: number,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResponse> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('fileType', fileType)
    formData.append('userType', 'pelatih')
    formData.append('userId', userId.toString())

    return this.uploadWithProgress(
      `${this.baseURL}/upload/pelatih`,
      formData,
      onProgress
    )
  }

  /**
   * Replace existing file
   */
  async replaceFile(
    file: File,
    fileType: string,
    userType: 'atlet' | 'pelatih',
    userId: number,
    oldFileId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResponse> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('fileType', fileType)
    formData.append('userType', userType)
    formData.append('userId', userId.toString())
    formData.append('oldFileId', oldFileId)

    return this.uploadWithProgress(
      `${this.baseURL}/upload/replace`,
      formData,
      onProgress
    )
  }

  /**
   * Delete file
   */
  async deleteFile(fileId: string): Promise<UploadResponse> {
    try {
      const response = await fetch(`${this.baseURL}/upload/delete/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
          'Content-Type': 'application/json'
        }
      })

      const result = await response.json()
      return result
    } catch (error: any) {
      return {
        success: false,
        message: 'Upload failed',
        error: error.message
      }
    }
  }

  /**
   * Get file info
   */
  async getFileInfo(fileId: string): Promise<UploadResponse> {
    try {
      const response = await fetch(`${this.baseURL}/upload/info/${fileId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
          'Content-Type': 'application/json'
        }
      })

      const result = await response.json()
      return result
    } catch (error: any) {
      return {
        success: false,
        message: 'Failed to get file info',
        error: error.message
      }
    }
  }

  /**
   * Upload with progress tracking
   */
  private async uploadWithProgress(
    url: string,
    formData: FormData,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResponse> {
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest()

      // Progress tracking
      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress: UploadProgress = {
              loaded: event.loaded,
              total: event.total,
              percentage: Math.round((event.loaded / event.total) * 100)
            }
            onProgress(progress)
          }
        })
      }

      // Handle completion
      xhr.addEventListener('load', () => {
        try {
          const response = JSON.parse(xhr.responseText)
          resolve(response)
        } catch (error) {
          resolve({
            success: false,
            message: 'Invalid response format',
            error: 'Failed to parse server response'
          })
        }
      })

      // Handle errors
      xhr.addEventListener('error', () => {
        resolve({
          success: false,
          message: 'Upload failed',
          error: 'Network error occurred'
        })
      })

      // Handle timeout
      xhr.addEventListener('timeout', () => {
        resolve({
          success: false,
          message: 'Upload timeout',
          error: 'Request timed out'
        })
      })

      // Set timeout (5 minutes)
      xhr.timeout = 5 * 60 * 1000

      // Set authorization header
      const token = this.getToken()
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`)
      }

      // Start upload
      xhr.open('POST', url)
      xhr.send(formData)
    })
  }

  /**
   * Get JWT token from localStorage/context
   */
  private getToken(): string | null {
    // Adjust based on your auth implementation
    return localStorage.getItem('token') || null
  }

  /**
   * Validate file before upload
   */
  validateFile(file: File, allowedTypes: string[] = [], maxSize: number = 5 * 1024 * 1024): {
    valid: boolean
    error?: string
  } {
    // Check file size (default 5MB)
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size exceeds ${Math.round(maxSize / (1024 * 1024))}MB limit`
      }
    }

    // Check file type if specified
    if (allowedTypes.length > 0) {
      const fileExtension = file.name.split('.').pop()?.toLowerCase()
      if (!fileExtension || !allowedTypes.includes(fileExtension)) {
        return {
          valid: false,
          error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`
        }
      }
    }

    return { valid: true }
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * Get file type icon based on extension
   */
  getFileTypeIcon(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase()
    
    switch (extension) {
      case 'pdf':
        return '📄'
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return '🖼️'
      case 'doc':
      case 'docx':
        return '📝'
      default:
        return '📎'
    }
  }
}

// Export singleton instance
export const uploadService = UploadService.getInstance()
export default uploadService

// Export types
export type { UploadResponse, UploadProgress }