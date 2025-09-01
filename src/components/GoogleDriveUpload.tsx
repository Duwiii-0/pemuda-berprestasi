// src/components/GoogleDriveUpload.tsx
import React, { useState, useRef } from 'react'
import { uploadService, UploadProgress, UploadResponse } from '../services/uploadService'

interface GoogleDriveUploadProps {
  fileType: string
  userType: 'atlet' | 'pelatih'
  userId: number
  label: string
  description?: string
  acceptedTypes?: string[]
  maxSize?: number
  existingFileId?: string
  existingFileName?: string
  onUploadSuccess?: (result: UploadResponse) => void
  onUploadError?: (error: string) => void
  className?: string
  required?: boolean
}

const GoogleDriveUpload: React.FC<GoogleDriveUploadProps> = ({
  fileType,
  userType,
  userId,
  label,
  description,
  acceptedTypes = ['jpg', 'jpeg', 'png', 'pdf'],
  maxSize = 5 * 1024 * 1024, // 5MB default
  existingFileId,
  existingFileName,
  onUploadSuccess,
  onUploadError,
  className = '',
  required = false
}) => {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null)
  const [uploadedFile, setUploadedFile] = useState<{
    fileId: string
    fileName: string
    webViewLink: string
  } | null>(
    existingFileId && existingFileName 
      ? { fileId: existingFileId, fileName: existingFileName, webViewLink: '' }
      : null
  )
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Reset states
    setError(null)
    setUploadProgress(null)

    // Validate file
    const validation = uploadService.validateFile(file, acceptedTypes, maxSize)
    if (!validation.valid) {
      setError(validation.error || 'Invalid file')
      return
    }

    // Start upload
    setIsUploading(true)

    try {
      let result: UploadResponse

      // Choose upload method based on whether replacing existing file
      if (existingFileId) {
        result = await uploadService.replaceFile(
          file,
          fileType,
          userType,
          userId,
          existingFileId,
          (progress) => setUploadProgress(progress)
        )
      } else {
        // Use appropriate method based on userType
        if (userType === 'atlet') {
          result = await uploadService.uploadAtletFile(
            file,
            fileType as 'ktp' | 'akte_kelahiran' | 'pas_foto' | 'sertifikat_belt',
            userId,
            (progress) => setUploadProgress(progress)
          )
        } else {
          result = await uploadService.uploadPelatihFile(
            file,
            fileType as 'foto_ktp' | 'sertifikat_sabuk',
            userId,
            (progress) => setUploadProgress(progress)
          )
        }
      }

      if (result.success && result.data) {
        setUploadedFile({
          fileId: result.data.fileId,
          fileName: result.data.fileName,
          webViewLink: result.data.webViewLink
        })
        
        // Call success callback
        onUploadSuccess?.(result)
        
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      } else {
        setError(result.error || result.message || 'Upload failed')
        onUploadError?.(result.error || result.message || 'Upload failed')
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Upload failed'
      setError(errorMessage)
      onUploadError?.(errorMessage)
    } finally {
      setIsUploading(false)
      setUploadProgress(null)
    }
  }

  const handleRemoveFile = async () => {
    if (!uploadedFile?.fileId) return

    try {
      setIsUploading(true)
      const result = await uploadService.deleteFile(uploadedFile.fileId)
      
      if (result.success) {
        setUploadedFile(null)
        setError(null)
      } else {
        setError(result.error || 'Failed to delete file')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete file')
    } finally {
      setIsUploading(false)
    }
  }

  const triggerFileSelect = () => {
    fileInputRef.current?.click()
  }

  const getAcceptAttribute = () => {
    return acceptedTypes.map(type => `.${type}`).join(',')
  }

  const renderUploadButton = () => {
    if (uploadedFile) {
      return (
        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-green-50 border border-green-200 rounded-lg px-3 py-2 flex-1">
            <span className="text-green-600 mr-2">
              {uploadService.getFileTypeIcon(uploadedFile.fileName)}
            </span>
            <span className="text-sm text-green-800 truncate flex-1">
              {uploadedFile.fileName}
            </span>
            {uploadedFile.webViewLink && (
              <a
                href={uploadedFile.webViewLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 ml-2"
                title="View in Google Drive"
              >
                👁️
              </a>
            )}
          </div>
          <button
            type="button"
            onClick={handleRemoveFile}
            disabled={isUploading}
            className="px-3 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
            title="Remove file"
          >
            🗑️
          </button>
        </div>
      )
    }

    return (
      <button
        type="button"
        onClick={triggerFileSelect}
        disabled={isUploading}
        className={`
          w-full border-2 border-dashed rounded-lg p-6 text-center transition-colors
          ${isUploading 
            ? 'border-blue-300 bg-blue-50' 
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
          }
          ${error ? 'border-red-300 bg-red-50' : ''}
        `}
      >
        {isUploading ? (
          <div className="space-y-2">
            <div className="text-blue-600">📤 Uploading...</div>
            {uploadProgress && (
              <div className="space-y-1">
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress.percentage}%` }}
                  />
                </div>
                <div className="text-xs text-blue-600">
                  {uploadProgress.percentage}% - {uploadService.formatFileSize(uploadProgress.loaded)} / {uploadService.formatFileSize(uploadProgress.total)}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-4xl">📎</div>
            <div className="text-sm font-medium text-gray-700">
              {existingFileId ? 'Replace file' : 'Click to upload file'}
            </div>
            <div className="text-xs text-gray-500">
              {acceptedTypes.join(', ').toUpperCase()} • Max {uploadService.formatFileSize(maxSize)}
            </div>
          </div>
        )}
      </button>
    )
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label */}
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Description */}
      {description && (
        <p className="text-xs text-gray-600">{description}</p>
      )}

      {/* Upload Area */}
      {renderUploadButton()}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={getAcceptAttribute()}
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />

      {/* Error Message */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">
          ❌ {error}
        </div>
      )}

      {/* Guidelines */}
      <div className="text-xs text-gray-500 space-y-1">
        <div>• Supported formats: {acceptedTypes.join(', ').toUpperCase()}</div>
        <div>• Maximum size: {uploadService.formatFileSize(maxSize)}</div>
        <div>• Files are securely stored in Google Drive</div>
      </div>
    </div>
  )
}

export default GoogleDriveUpload