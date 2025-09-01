// src/scripts/validateGoogleDriveSetup.ts
import { googleDriveService } from '../services/googleDriveService'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

interface ValidationResult {
  environment: boolean
  connection: boolean
  folderAccess: { [key: string]: boolean }
  summary: {
    totalFolders: number
    accessibleFolders: number
    inaccessibleFolders: number
  }
}

export async function validateGoogleDriveSetup(): Promise<ValidationResult> {
  console.log('🔍 Starting Google Drive Setup Validation...\n')

  const result: ValidationResult = {
    environment: false,
    connection: false,
    folderAccess: {},
    summary: {
      totalFolders: 0,
      accessibleFolders: 0,
      inaccessibleFolders: 0
    }
  }

  try {
    // 1. Environment validation
    console.log('1️⃣ Validating environment variables...')
    const envValidation = await googleDriveService.validateEnvironment()
    result.environment = envValidation.valid

    if (!envValidation.valid) {
      console.error('❌ Environment validation failed:')
      envValidation.errors.forEach(error => console.error(`   - ${error}`))
      return result
    }
    console.log('✅ Environment variables valid')

    // 2. Connection test
    console.log('\n2️⃣ Testing Google Drive connection...')
    result.connection = await googleDriveService.testConnection()

    if (!result.connection) {
      console.error('❌ Google Drive connection failed')
      return result
    }
    console.log('✅ Google Drive connection successful')

    // 3. Folder access validation
    console.log('\n3️⃣ Testing folder access...')
    result.folderAccess = await googleDriveService.validateFolderAccess()

    result.summary.totalFolders = Object.keys(result.folderAccess).length
    result.summary.accessibleFolders = Object.values(result.folderAccess).filter(Boolean).length
    result.summary.inaccessibleFolders = result.summary.totalFolders - result.summary.accessibleFolders

    // Display folder access results
    for (const [folderName, accessible] of Object.entries(result.folderAccess)) {
      const status = accessible ? '✅' : '❌'
      console.log(`   ${status} ${folderName}: ${accessible ? 'Accessible' : 'Inaccessible'}`)
    }

    // 4. Summary
    console.log('\n📊 VALIDATION SUMMARY:')
    console.log(`   Environment: ${result.environment ? '✅ Valid' : '❌ Invalid'}`)
    console.log(`   Connection: ${result.connection ? '✅ Connected' : '❌ Failed'}`)
    console.log(`   Folder Access: ${result.summary.accessibleFolders}/${result.summary.totalFolders} accessible`)

    const isFullyValid = result.environment && result.connection && result.summary.inaccessibleFolders === 0

    if (isFullyValid) {
      console.log('\n🎉 Google Drive setup is fully validated and ready!')
    } else {
      console.log('\n⚠️ Google Drive setup has issues that need to be addressed')
    }

    return result

  } catch (error: any) {
    console.error('\n❌ Validation failed with error:', error.message)
    throw error
  }
}

// Run validation if script is executed directly
if (require.main === module) {
  validateGoogleDriveSetup()
    .then((result) => {
      const success = result.environment && result.connection && result.summary.inaccessibleFolders === 0
      process.exit(success ? 0 : 1)
    })
    .catch((error) => {
      console.error('Fatal validation error:', error.message)
      process.exit(1)
    })
}