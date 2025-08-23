import jwt from 'jsonwebtoken'
import { SignOptions, Secret, StringValue } from 'jsonwebtoken'

export interface JWTPayload {
  id: number
  email: string
  role: string
  pelatihId?: number
  adminId?: number
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
}

const JWT_SECRET: Secret = process.env.JWT_SECRET || 'your-fallback-secret'
const JWT_EXPIRES_IN: StringValue = (process.env.JWT_EXPIRES_IN as StringValue) || '7d'
const JWT_REFRESH_SECRET: Secret = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret'
const JWT_REFRESH_EXPIRES_IN: StringValue = (process.env.JWT_REFRESH_EXPIRES_IN as StringValue) || '30d'

if (!process.env.JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET not set in environment variables')
}

export const generateAccessToken = (payload: JWTPayload): string => {
  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'pemuda-berprestasi',
    audience: 'pemuda-berprestasi-users',
  }
  return jwt.sign(payload, JWT_SECRET, options)
}


export const generateRefreshToken = (payload: { id: number; email: string }): string => {
  const options: SignOptions = {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
    issuer: 'pemuda-berprestasi',
    audience: 'pemuda-berprestasi-users',
  }
  return jwt.sign(payload, JWT_REFRESH_SECRET, options)
}

export const generateTokenPair = (payload: JWTPayload): TokenPair => {
  const accessToken = generateAccessToken(payload)
  const refreshToken = generateRefreshToken({ id: payload.id, email: payload.email })
  return { accessToken, refreshToken }
}


// Convenience function for most common use case
export const generateToken = (payload: JWTPayload): string => {
  return generateAccessToken(payload)
}

export const verifyAccessToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'pemuda-berprestasi',
      audience: 'pemuda-berprestasi-users'
    }) as JWTPayload
    
    return decoded
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired')
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token')
    } else {
      throw new Error('Token verification failed')
    }
  }
}

export const verifyRefreshToken = (token: string): { id: number, email: string } => {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: 'pemuda-berprestasi',
      audience: 'pemuda-berprestasi-users'
    }) as { id: number, email: string }
    
    return decoded
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token expired')
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid refresh token')
    } else {
      throw new Error('Refresh token verification failed')
    }
  }
}

export const extractTokenFromHeader = (authHeader: string | undefined): string | null => {
  if (!authHeader) {
    return null
  }

  const parts = authHeader.split(' ')
  
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null
  }
  
  return parts[1]
}

export const decodeTokenWithoutVerification = (token: string): JWTPayload | null => {
  try {
    const decoded = jwt.decode(token) as JWTPayload
    return decoded
  } catch (error) {
    return null
  }
}

export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = jwt.decode(token) as { exp: number }
    
    if (!decoded.exp) {
      return true
    }
    
    const currentTime = Math.floor(Date.now() / 1000)
    return decoded.exp < currentTime
  } catch (error) {
    return true
  }
}