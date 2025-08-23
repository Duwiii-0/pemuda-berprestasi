import bcrypt from 'bcrypt'

// Salt rounds configuration
const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12')

// Validate salt rounds
if (SALT_ROUNDS < 10 || SALT_ROUNDS > 15) {
  console.warn('⚠️  BCRYPT_SALT_ROUNDS should be between 10-15 for optimal security/performance')
}

export const hashPassword = async (plainPassword: string): Promise<string> => {
  try {
    // Input validation
    if (!plainPassword || plainPassword.trim().length === 0) {
      throw new Error('Password cannot be empty')
    }

    if (plainPassword.length < 6) {
      throw new Error('Password must be at least 6 characters long')
    }

    // Generate salt and hash
    const salt = await bcrypt.genSalt(SALT_ROUNDS)
    const hash = await bcrypt.hash(plainPassword, salt)
    
    return hash
  } catch (error) {
    console.error('Error hashing password:', error)
    throw new Error('Failed to hash password')
  }
}

export const comparePassword = async (
  plainPassword: string, 
  hashedPassword: string
): Promise<boolean> => {
  try {
    // Input validation
    if (!plainPassword || !hashedPassword) {
      return false
    }

    const isMatch = await bcrypt.compare(plainPassword, hashedPassword)
    return isMatch
  } catch (error) {
    console.error('Error comparing password:', error)
    return false
  }
}

export interface PasswordStrength {
  score: number // 0-4
  feedback: string[]
  isStrong: boolean
}

export const validatePasswordStrength = (password: string): PasswordStrength => {
  const feedback: string[] = []
  let score = 0

  // Length check
  if (password.length >= 8) {
    score += 1
  } else {
    feedback.push('Password should be at least 8 characters long')
  }

  // Uppercase check
  if (/[A-Z]/.test(password)) {
    score += 1
  } else {
    feedback.push('Add uppercase letters')
  }

  // Lowercase check
  if (/[a-z]/.test(password)) {
    score += 1
  } else {
    feedback.push('Add lowercase letters')
  }

  // Number check
  if (/\d/.test(password)) {
    score += 1
  } else {
    feedback.push('Add numbers')
  }

  // Special character check
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score += 1
  } else {
    feedback.push('Add special characters (!@#$%^&*)')
  }

  // Common patterns check
  const commonPatterns = ['123456', 'password', 'qwerty', 'abc123', '111111']
  if (commonPatterns.some(pattern => password.toLowerCase().includes(pattern))) {
    score -= 1
    feedback.push('Avoid common patterns')
  }

  return {
    score: Math.max(0, Math.min(4, score)),
    feedback,
    isStrong: score >= 3 && feedback.length <= 1
  }
}

export const generateSecurePassword = (length: number = 12): string => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?'
  
  let password = ''
  
  // Ensure at least one character from each category
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += symbols[Math.floor(Math.random() * symbols.length)]
  
  // Fill the rest randomly
  const allChars = uppercase + lowercase + numbers + symbols
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

import crypto from 'crypto'

export const generatePasswordResetToken = (): { token: string, hashedToken: string } => {
  const token = crypto.randomBytes(32).toString('hex')
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex')
  
  return { token, hashedToken }
}

export const hashPasswordResetToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex')
}