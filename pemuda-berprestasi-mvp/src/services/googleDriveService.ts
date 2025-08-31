// src/services/googleDriveService.ts
import { google } from 'googleapis'
import fs from 'fs'
import path from 'path'

interface UploadResult {
  fileId: string
  webViewLink: string
  webContentLink: string
}

interface FileMetadata {
  name: string
  parents: string[]
}

class GoogleDriveService {
  private drive: any
  private auth: any

  constructor() {
    this.initializeAuth()
  }

  private initializeAuth() {
    try {
      // Initialize auth with service account
      this.auth = new google.auth.GoogleAuth({
        keyFile: process.env.GOOGLE_DRIVE_CREDENTIALS_PATH,
        scopes: ['https://www.googleapis.com/auth/drive']
      })

      this.drive = google.drive({ version: 'v3', auth: this.auth })
      console.log('✅ Google Drive service initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize Google Drive service:', error)
      throw new Error('Google Drive initialization failed')
    }
  }

  // Get folder ID based on file type and user type
  private getFolderId(fileType: string, userType: 'atlet' | 'pelatih'): string {
    const folderMap = {
      atlet: {
        ktp: process.env.GOOGLE_DRIVE_KTP_ATLET_FOLDER_ID!,
        akte_kelahiran: process.env.GOOGLE_DRIVE_AKTE_FOLDER_ID!,
        pas_foto: process.env.GOOGLE_DRIVE_PASFOTO_FOLDER_ID!,
        sertifikat_belt: process.env.GOOGLE_DRIVE_SERTIFIKAT_BELT_FOLDER_ID!
      },
      pelatih: {
        foto_ktp: process.env.GOOGLE_DRIVE_KTP_PELATIH_FOLDER_ID!,
        sertifikat_sabuk: process.env.GOOGLE_DRIVE_SERTIFIKAT_SABUK_FOLDER_ID!
      }
    }

    const folderId = folderMap[userType]?.[fileType as keyof typeof folderMap[typeof userType]]
    
    if (!folderId) {
      throw new Error(`No folder configured for ${userType}/${fileType}`)
    }

    return folderId
  }

  // Generate unique filename
  private generateUniqueFileName(userId: number, fileType: string, originalName: string): string {
    const timestamp = Date.now()
    const extension = path.extname(originalName)
    const baseName = path.basename(originalName, extension)
    
    return `${userId}_${fileType}_${timestamp}_${baseName}${extension}`
  }

  // Upload file to Google Drive
  async uploadFile(
    filePath: string,
    fileName: string,
    fileType: string,
    userType: 'atlet' | 'pelatih',
    userId: number
  ): Promise<UploadResult> {
    try {
      console.log(`📤 Uploading ${fileType} for ${userType} ID: ${userId}`)
      
      // Get appropriate folder ID
      const folderId = this.getFolderId(fileType, userType)
      
      // Generate unique filename
      const uniqueFileName = this.generateUniqueFileName(userId, fileType, fileName)
      
      // Prepare file metadata
      const fileMetadata: FileMetadata = {
        name: uniqueFileName,
        parents: [folderId]
      }

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`)
      }

      // Create readable stream
      const media = {
        mimeType: this.getMimeType(filePath),
        body: fs.createReadStream(filePath)
      }

      console.log(`📁 Uploading to folder: ${folderId}`)
      console.log(`📄 File name: ${uniqueFileName}`)

      // Upload file
      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id, webViewLink, webContentLink'
      })

      const result: UploadResult = {
        fileId: response.data.id,
        webViewLink: response.data.webViewLink,
        webContentLink: response.data.webContentLink
      }

      console.log(`✅ Upload successful: ${result.fileId}`)
      
      // Clean up local file after successful upload
      await this.cleanupLocalFile(filePath)
      
      return result

    } catch (error: any) {
      console.error(`❌ Upload failed for ${fileType}:`, error.message)
      
      // Clean up local file on error too
      await this.cleanupLocalFile(filePath)
      
      throw new Error(`Failed to upload ${fileType}: ${error.message}`)
    }
  }

  // Delete file from Google Drive
  async deleteFile(fileId: string): Promise<void> {
    try {
      console.log(`🗑️ Deleting file: ${fileId}`)
      
      await this.drive.files.delete({
        fileId: fileId
      })

      console.log(`✅ File deleted successfully: ${fileId}`)
    } catch (error: any) {
      console.error(`❌ Delete failed for file ${fileId}:`, error.message)
      throw new Error(`Failed to delete file: ${error.message}`)
    }
  }

  // Get file info
  async getFileInfo(fileId: string) {
    try {
      const response = await this.drive.files.get({
        fileId: fileId,
        fields: 'id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink'
      })

      return response.data
    } catch (error: any) {
      console.error(`❌ Get file info failed for ${fileId}:`, error.message)
      throw new Error(`Failed to get file info: ${error.message}`)
    }
  }

  // Download file from Google Drive
  async downloadFile(fileId: string, destinationPath: string): Promise<void> {
    try {
      console.log(`📥 Downloading file: ${fileId}`)
      
      const response = await this.drive.files.get({
        fileId: fileId,
        alt: 'media'
      }, { responseType: 'stream' })

      const dest = fs.createWriteStream(destinationPath)
      
      return new Promise((resolve, reject) => {
        response.data
          .on('end', () => {
            console.log(`✅ Download successful: ${destinationPath}`)
            resolve()
          })
          .on('error', (err: any) => {
            console.error(`❌ Download failed:`, err)
            reject(err)
          })
          .pipe(dest)
      })

    } catch (error: any) {
      console.error(`❌ Download failed for ${fileId}:`, error.message)
      throw new Error(`Failed to download file: ${error.message}`)
    }
  }

  // Get mime type from file path
  private getMimeType(filePath: string): string {
    const extension = path.extname(filePath).toLowerCase()
    
    const mimeTypes: { [key: string]: string } = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.pdf': 'application/pdf'
    }

    return mimeTypes[extension] || 'application/octet-stream'
  }

  // Clean up local file
  private async cleanupLocalFile(filePath: string): Promise<void> {
    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath)
        console.log(`🧹 Cleaned up local file: ${filePath}`)
      }
    } catch (error: any) {
      console.warn(`⚠️ Failed to cleanup local file ${filePath}:`, error.message)
      // Don't throw error for cleanup failures
    }
  }

  // Upload multiple files (for bulk operations)
  async uploadMultipleFiles(
    files: Array<{
      filePath: string
      fileName: string
      fileType: string
      userType: 'atlet' | 'pelatih'
      userId: number
    }>
  ): Promise<{ [fileType: string]: UploadResult | Error }> {
    const results: { [fileType: string]: UploadResult | Error } = {}

    // Process files in parallel with controlled concurrency
    const uploadPromises = files.map(async (fileData) => {
      try {
        const result = await this.uploadFile(
          fileData.filePath,
          fileData.fileName,
          fileData.fileType,
          fileData.userType,
          fileData.userId
        )
        results[fileData.fileType] = result
      } catch (error) {
        console.error(`❌ Failed to upload ${fileData.fileType}:`, error)
        results[fileData.fileType] = error as Error
      }
    })

    await Promise.allSettled(uploadPromises)
    
    return results
  }

  // Replace existing file (delete old, upload new)
  async replaceFile(
    oldFileId: string,
    newFilePath: string,
    fileName: string,
    fileType: string,
    userType: 'atlet' | 'pelatih',
    userId: number
  ): Promise<UploadResult> {
    try {
      console.log(`🔄 Replacing file: ${oldFileId}`)
      
      // Upload new file first
      const newFileResult = await this.uploadFile(
        newFilePath,
        fileName,
        fileType,
        userType,
        userId
      )

      // Delete old file after successful upload
      await this.deleteFile(oldFileId)

      console.log(`✅ File replaced successfully`)
      return newFileResult

    } catch (error: any) {
      console.error(`❌ File replacement failed:`, error.message)
      throw new Error(`Failed to replace file: ${error.message}`)
    }
  }

  // Test Google Drive connection
  async testConnection(): Promise<boolean> {
    try {
      await this.drive.about.get({ fields: 'user' })
      console.log('✅ Google Drive connection test successful')
      return true
    } catch (error: any) {
      console.error('❌ Google Drive connection test failed:', error.message)
      return false
    }
  }

  // Get folder contents (for debugging/admin purposes)
  async getFolderContents(folderId: string) {
    try {
      const response = await this.drive.files.list({
        q: `'${folderId}' in parents and trashed=false`,
        fields: 'files(id, name, mimeType, size, createdTime, modifiedTime)'
      })

      return response.data.files || []
    } catch (error: any) {
      console.error(`❌ Failed to get folder contents:`, error.message)
      throw new Error(`Failed to get folder contents: ${error.message}`)
    }
  }
}

// Export singleton instance
export const googleDriveService = new GoogleDriveService()
export default googleDriveService