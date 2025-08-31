// src/scripts/testGoogleDrive.ts
import dotenv from 'dotenv';
import { testGoogleDriveSetup } from '../config/googleDrive';

// Load environment variables
dotenv.config();

async function main() {
  console.log('🚀 Starting Google Drive Setup Test\n');
  
  try {
    const success = await testGoogleDriveSetup();
    
    if (success) {
      console.log('\n🎉 Google Drive setup is working correctly!');
      process.exit(0);
    } else {
      console.log('\n💥 Google Drive setup has issues. Please check the logs above.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n💥 Unexpected error during Google Drive test:', error);
    process.exit(1);
  }
}

// Run the test
main();