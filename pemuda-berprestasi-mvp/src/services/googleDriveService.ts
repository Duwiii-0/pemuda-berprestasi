// src/services/googleDriveService.ts
import { google } from 'googleapis'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

// Load environment variables explicitly
dotenv.config()

interface UploadResult {
  fileId: string
  webViewLink: string
  webContentLink: string
  fileName: string
  fileSize: number
}

interface DriveFolder {
  MAIN: string
  ATLET: string
  PELATIH: string
  KTP_ATLET: string
  KTP_PELATIH: string
  AKTE: string
  PASFOTO: string
  SERTIFIKAT_BELT: string
  SERTIFIKAT_SABUK: string
}

class GoogleDriveService {
  private static instance: GoogleDriveService
  private drive: any
  private auth: any
  private folders: DriveFolder
  private isInitialized: boolean = false

  private constructor() {
    // Load folder config after dotenv is loaded
    this.folders = this.loadFolderConfig()
  }

  public static getInstance(): GoogleDriveService {
    if (!GoogleDriveService.instance) {
      GoogleDriveService.instance = new GoogleDriveService()
    }
    return GoogleDriveService.instance
  }

  private loadFolderConfig(): DriveFolder {
    // Debug: log environment variables
    console.log('🔍 Loading folder configuration...')
    console.log('Environment check:', {
      MAIN: process.env.GOOGLE_DRIVE_MAIN_FOLDER_ID ? 'SET' : 'NOT SET',
      ATLET: process.env.GOOGLE_DRIVE_ATLET_FOLDER_ID ? 'SET' : 'NOT SET',
      PELATIH: process.env.GOOGLE_DRIVE_PELATIH_FOLDER_ID ? 'SET' : 'NOT SET'
    })

    return {
      MAIN: process.env.GOOGLE_DRIVE_MAIN_FOLDER_ID || '',
      ATLET: process.env.GOOGLE_DRIVE_ATLET_FOLDER_ID || '',
      PELATIH: process.env.GOOGLE_DRIVE_PELATIH_FOLDER_ID || '',
      KTP_ATLET: process.env.GOOGLE_DRIVE_KTP_ATLET_FOLDER_ID || '',
      KTP_PELATIH: process.env.GOOGLE_DRIVE_KTP_PELATIH_FOLDER_ID || '',
      AKTE: process.env.GOOGLE_DRIVE_AKTE_FOLDER_ID || '',
      PASFOTO: process.env.GOOGLE_DRIVE_PASFOTO_FOLDER_ID || '',
      SERTIFIKAT_BELT: process.env.GOOGLE_DRIVE_SERTIFIKAT_BELT_FOLDER_ID || '',
      SERTIFIKAT_SABUK: process.env.GOOGLE_DRIVE_SERTIFIKAT_SABUK_FOLDER_ID || ''
    }
  }

  private async initializeAuth(): Promise<void> {
    try {
      const credentialsPath = process.env.GOOGLE_DRIVE_CREDENTIALS_PATH || 
                             './credentials/pemuda-berprestasi-46b52f0668a6.json'
      
      console.log(`🔑 Using credentials: ${credentialsPath}`)
      
      // Validate credentials file
      if (!fs.existsSync(credentialsPath)) {
        throw new Error(`Credentials file not found: ${credentialsPath}`)
      }

      // Initialize auth
      this.auth = new google.auth.GoogleAuth({
        keyFile: credentialsPath,
        scopes: [
          'https://www.googleapis.com/auth/drive.file',
          'https://www.googleapis.com/auth/drive'
        ]
      })

      // Initialize drive
      this.drive = google.drive({ 
        version: 'v3', 
        auth: this.auth 
      })

      // Test connection
      await this.validateConnection()
      this.isInitialized = true
      
      console.log('✅ Google Drive service initialized successfully')
    } catch (error: any) {
      console.error('❌ Failed to initialize Google Drive:', error.message)
      throw new Error(`Google Drive initialization failed: ${error.message}`)
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initializeAuth()
    }
  }

  private async validateConnection(): Promise<void> {
    try {
      await this.drive.about.get({ fields: 'user' })
    } catch (error: any) {
      throw new Error(`Google Drive connection failed: ${error.message}`)
    }
  }

  private getFolderId(fileType: string, userType: 'atlet' | 'pelatih'): string {
    const folderMap = {
      atlet: {
        ktp: this.folders.KTP_ATLET,
        akte_kelahiran: this.folders.AKTE,
        pas_foto: this.folders.PASFOTO,
        sertifikat_belt: this.folders.SERTIFIKAT_BELT
      },
      pelatih: {
        foto_ktp: this.folders.KTP_PELATIH,
        sertifikat_sabuk: this.folders.SERTIFIKAT_SABUK
      }
    }

    const folderId = folderMap[userType]?.[fileType as keyof typeof folderMap[typeof userType]]
    
    if (!folderId) {
      throw new Error(`No folder configured for ${userType}/${fileType}`)
    }

    return folderId
  }

  private generateUniqueFileName(userId: number, fileType: string, originalName: string): string {
    const timestamp = Date.now()
    const extension = path.extname(originalName)
    const baseName = path.basename(originalName, extension).replace(/\s+/g, '_')
    
    return `${userId}_${fileType}_${timestamp}_${baseName}${extension}`
  }

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

  private async cleanupLocalFile(filePath: string): Promise<void> {
    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath)
        console.log(`🧹 Cleaned up local file: ${filePath}`)
      }
    } catch (error: any) {
      console.warn(`⚠️ Failed to cleanup ${filePath}: ${error.message}`)
      // Don't throw - cleanup failures shouldn't break the flow
    }
  }

  // Public Methods

  async uploadFile(
    filePath: string,
    fileName: string,
    fileType: string,
    userType: 'atlet' | 'pelatih',
    userId: number
  ): Promise<UploadResult> {
    await this.ensureInitialized()
    
    try {
      console.log(`📤 Uploading ${fileType} for ${userType} ID: ${userId}`)
      
      // Validate file exists
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`)
      }

      // Get target folder
      const folderId = this.getFolderId(fileType, userType)
      
      // Generate unique filename
      const uniqueFileName = this.generateUniqueFileName(userId, fileType, fileName)
      
      // Prepare upload
      const fileMetadata = {
        name: uniqueFileName,
        parents: [folderId]
      }

      const media = {
        mimeType: this.getMimeType(filePath),
        body: fs.createReadStream(filePath)
      }

      // Upload to Google Drive
      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id, webViewLink, webContentLink, size'
      })

      const result: UploadResult = {
        fileId: response.data.id,
        webViewLink: response.data.webViewLink,
        webContentLink: response.data.webContentLink,
        fileName: uniqueFileName,
        fileSize: parseInt(response.data.size) || 0
      }

      console.log(`✅ Upload successful: ${result.fileId}`)
      
      // Cleanup local file after successful upload
      await this.cleanupLocalFile(filePath)
      
      return result

    } catch (error: any) {
      console.error(`❌ Upload failed for ${fileType}:`, error.message)
      
      // Cleanup local file on error
      await this.cleanupLocalFile(filePath)
      
      throw new Error(`Failed to upload ${fileType}: ${error.message}`)
    }
  }

  async deleteFile(fileId: string): Promise<void> {
    await this.ensureInitialized()
    
    try {
      console.log(`🗑️ Deleting file: ${fileId}`)
      
      await this.drive.files.delete({ fileId })
      
      console.log(`✅ File deleted: ${fileId}`)
    } catch (error: any) {
      console.error(`❌ Delete failed for ${fileId}:`, error.message)
      throw new Error(`Failed to delete file: ${error.message}`)
    }
  }

  async replaceFile(
    oldFileId: string,
    newFilePath: string,
    fileName: string,
    fileType: string,
    userType: 'atlet' | 'pelatih',
    userId: number
  ): Promise<UploadResult> {
    await this.ensureInitialized()
    
    try {
      console.log(`🔄 Replacing file: ${oldFileId}`)
      
      // Upload new file first
      const newFile = await this.uploadFile(newFilePath, fileName, fileType, userType, userId)
      
      // Delete old file after successful upload
      await this.deleteFile(oldFileId)
      
      console.log(`✅ File replaced successfully`)
      return newFile
      
    } catch (error: any) {
      console.error(`❌ File replacement failed:`, error.message)
      throw new Error(`Failed to replace file: ${error.message}`)
    }
  }

  async getFileInfo(fileId: string) {
    await this.ensureInitialized()
    
    try {
      const response = await this.drive.files.get({
        fileId,
        fields: 'id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink'
      })
      
      return response.data
    } catch (error: any) {
      console.error(`❌ Get file info failed for ${fileId}:`, error.message)
      throw new Error(`Failed to get file info: ${error.message}`)
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.ensureInitialized()
      await this.drive.about.get({ fields: 'user' })
      return true
    } catch (error: any) {
      console.error('❌ Connection test failed:', error.message)
      return false
    }
  }

  // Validation methods
  
  async validateEnvironment(): Promise<{ valid: boolean, errors: string[] }> {
    const errors: string[] = []
    
    // Debug environment loading
    console.log('🔍 Checking environment variables...')
    console.log('Current folder config:', {
      MAIN: process.env.GOOGLE_DRIVE_MAIN_FOLDER_ID || 'NOT SET',
      ATLET: process.env.GOOGLE_DRIVE_ATLET_FOLDER_ID || 'NOT SET',
      CREDENTIALS: process.env.GOOGLE_DRIVE_CREDENTIALS_PATH || 'NOT SET'
    })
    
    // Check credentials path
    const credentialsPath = process.env.GOOGLE_DRIVE_CREDENTIALS_PATH
    if (!credentialsPath) {
      errors.push('GOOGLE_DRIVE_CREDENTIALS_PATH not set')
    } else if (!fs.existsSync(credentialsPath)) {
      errors.push(`Credentials file not found: ${credentialsPath}`)
    }

    // Check folder IDs
    const requiredFolders = Object.entries(this.folders)
    for (const [folderName, folderId] of requiredFolders) {
      if (!folderId) {
        errors.push(`${folderName} folder ID not configured`)
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  async validateFolderAccess(): Promise<{ [folderName: string]: boolean }> {
    await this.ensureInitialized()
    
    const results: { [folderName: string]: boolean } = {}
    
    for (const [folderName, folderId] of Object.entries(this.folders)) {
      if (folderId) {
        try {
          await this.drive.files.get({
            fileId: folderId,
            fields: 'id, name'
          })
          results[folderName] = true
        } catch {
          results[folderName] = false
        }
      } else {
        results[folderName] = false
      }
    }

    return results
  }

  // Utility methods for debugging

  async getFolderContents(folderName: keyof DriveFolder): Promise<any[]> {
    await this.ensureInitialized()
    
    const folderId = this.folders[folderName]
    if (!folderId) {
      throw new Error(`Folder ${folderName} not configured`)
    }

    try {
      const response = await this.drive.files.list({
        q: `'${folderId}' in parents and trashed=false`,
        fields: 'files(id, name, mimeType, size, createdTime)',
        orderBy: 'createdTime desc'
      })
      
      return response.data.files || []
    } catch (error: any) {
      throw new Error(`Failed to get ${folderName} contents: ${error.message}`)
    }
  }
}

// Export singleton instance
export const googleDriveService = GoogleDriveService.getInstance()
export default googleDriveService

// Export types for external use
export type { UploadResult, DriveFolder }