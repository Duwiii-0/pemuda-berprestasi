// src/config/googleDrive.ts
import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';

export class GoogleDriveConfig {
  private static instance: GoogleDriveConfig;
  public drive: any;
  
  private constructor() {
    this.initializeGoogleDrive();
  }

  public static getInstance(): GoogleDriveConfig {
    if (!GoogleDriveConfig.instance) {
      GoogleDriveConfig.instance = new GoogleDriveConfig();
    }
    return GoogleDriveConfig.instance;
  }

  private initializeGoogleDrive() {
    try {
      // Path ke service account credentials
      const credentialsPath = process.env.GOOGLE_DRIVE_CREDENTIALS_PATH || './credentials/pemuda-berprestasi-46b52f0668a6.json';
      
      // Check if credentials file exists
      if (!fs.existsSync(credentialsPath)) {
        throw new Error(`Credentials file not found at: ${credentialsPath}`);
      }

      // Initialize Google Auth dengan service account
      const auth = new google.auth.GoogleAuth({
        keyFile: credentialsPath,
        scopes: [
          'https://www.googleapis.com/auth/drive.file',
          'https://www.googleapis.com/auth/drive'
        ]
      });

      // Initialize Google Drive API
      this.drive = google.drive({ 
        version: 'v3', 
        auth 
      });

      console.log('✅ Google Drive API initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize Google Drive API:', error);
      throw error;
    }
  }

  // Test connection ke Google Drive
  public async testConnection(): Promise<boolean> {
    try {
      const response = await this.drive.files.list({
        pageSize: 1,
      });
      
      console.log('✅ Google Drive connection test successful');
      return true;
      
    } catch (error) {
      console.error('❌ Google Drive connection test failed:', error);
      return false;
    }
  }

  // Get folder info untuk debugging
  public async getFolderInfo(folderId: string) {
    try {
      const response = await this.drive.files.get({
        fileId: folderId,
        fields: 'id,name,mimeType,parents'
      });
      
      return response.data;
      
    } catch (error) {
      console.error(`❌ Failed to get folder info for ID: ${folderId}`, error);
      throw error;
    }
  }

  // List files di folder tertentu (untuk debugging)
  public async listFilesInFolder(folderId: string) {
    try {
      const response = await this.drive.files.list({
        q: `'${folderId}' in parents`,
        fields: 'files(id,name,size,mimeType,createdTime)'
      });
      
      return response.data.files;
      
    } catch (error) {
      console.error(`❌ Failed to list files in folder: ${folderId}`, error);
      throw error;
    }
  }
}

// Function untuk mendapatkan folder IDs (dipanggil setelah env ter-load)
export const getDriveFolders = () => {
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
  };
};

// Legacy export untuk backward compatibility (tapi sekarang sebagai function)
export const DRIVE_FOLDERS = getDriveFolders;

// Utility function untuk validate environment variables
export const validateGoogleDriveEnv = (): boolean => {
  const requiredEnvVars = [
    'GOOGLE_DRIVE_CREDENTIALS_PATH',
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingVars);
    return false;
  }
  
  // Check if credentials file exists
  const credentialsPath = process.env.GOOGLE_DRIVE_CREDENTIALS_PATH!;
  if (!fs.existsSync(credentialsPath)) {
    console.error(`❌ Credentials file not found at: ${credentialsPath}`);
    return false;
  }
  
  console.log('✅ Google Drive environment variables validated');
  return true;
};

// Test script untuk debugging
export const testGoogleDriveSetup = async () => {
  console.log('🔍 Testing Google Drive Setup...\n');
  
  // 1. Validate environment
  console.log('1. Validating environment variables...');
  if (!validateGoogleDriveEnv()) {
    return false;
  }
  
  // 2. Test connection
  console.log('\n2. Testing Google Drive connection...');
  const driveConfig = GoogleDriveConfig.getInstance();
  const connectionSuccess = await driveConfig.testConnection();
  
  if (!connectionSuccess) {
    return false;
  }
  
  // 3. Test folder access (menggunakan function getDriveFolders)
  console.log('\n3. Testing folder access...');
  const driveFolders = getDriveFolders();
  
  for (const [folderName, folderId] of Object.entries(driveFolders)) {
    if (folderId) {
      try {
        const folderInfo = await driveConfig.getFolderInfo(folderId);
        console.log(`✅ ${folderName}: ${folderInfo.name} (ID: ${folderId})`);
      } catch (error) {
        console.log(`❌ ${folderName}: Failed to access folder (ID: ${folderId})`);
      }
    } else {
      console.log(`⚠️  ${folderName}: Folder ID not set in environment`);
    }
  }
  
  console.log('\n✅ Google Drive setup test completed!');
  return true;
};