const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

export interface JwtPayload {
  id_akun: number
  email: string
  role: string
  pelatihId?: number
  adminId?: number
}

export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  })
}

export const verifyToken = (token: string): JwtPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload
  } catch (error) {
    throw new Error('Invalid or expired token')
  }
}

export const decodeToken = (token: string): JwtPayload | null => {
  try {
    return jwt.decode(token) as JwtPayload
  } catch (error) {
    return null
  }
}