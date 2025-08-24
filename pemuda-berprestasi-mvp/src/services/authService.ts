// src/services/authService.ts
import prisma from '../config/database'
import { hashPassword, comparePassword } from '../utils/bcrypt'
import { generateToken, JwtPayload } from '../utils/jwt'

export interface RegisterData {
  email: string
  password: string
  nama_pelatih: string
  no_telp?: string
  id_dojang: number
}

export interface LoginData {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user: {
    id_akun: number
    email: string
    role: string
    pelatih?: {
      id_pelatih: number
      nama_pelatih: string
      no_telp?: string | null
      id_dojang?: number | null
    }
    admin?: {
      id_admin: number
      nama: string
    }
  }
}

class AuthService {
  async register(data: RegisterData): Promise<LoginResponse> {
    const { email, password, nama_pelatih, no_telp, id_dojang } = data

    // Check if email already exists
    const existingAccount = await prisma.tb_akun.findUnique({
      where: { email }
    })

    if (existingAccount) {
      throw new Error('Email already registered')
    }

    // Hash password
    const password_hash = await hashPassword(password)

    // Create account and pelatih in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create account
      const account = await tx.tb_akun.create({
        data: {
          email,
          password_hash,
          role: 'PELATIH'
        }
      })

      // Create pelatih profile (include id_dojang)
      const pelatih = await tx.tb_pelatih.create({
        data: {
          nama_pelatih,
          no_telp,
          id_akun: account.id_akun,
          id_dojang: id_dojang
        }
      })

      return { account, pelatih }
    })

    // Generate JWT token
    const tokenPayload: JwtPayload = {
      id_akun: result.account.id_akun,
      email: result.account.email,
      role: result.account.role,
      pelatihId: result.pelatih.id_pelatih
    }

    const token = generateToken(tokenPayload)

    return {
      token,
      user: {
        id_akun: result.account.id_akun,
        email: result.account.email,
        role: result.account.role,
        pelatih: {
          id_pelatih: result.pelatih.id_pelatih,
          nama_pelatih: result.pelatih.nama_pelatih,
          no_telp: result.pelatih.no_telp,
          id_dojang: result.pelatih.id_dojang
        }
      }
    }
  }

  async login(data: LoginData): Promise<LoginResponse> {
    const { email, password } = data

    // Find account with related data
    const account = await prisma.tb_akun.findUnique({
      where: { email },
      include: {
        pelatih: true,
        admin: true
      }
    })

    if (!account) {
      throw new Error('Invalid credentials')
    }

    // Verify password
    const isValidPassword = await comparePassword(password, account.password_hash)
    
    if (!isValidPassword) {
      throw new Error('Invalid credentials')
    }

    // Prepare JWT payload
    const tokenPayload: JwtPayload = {
      id_akun: account.id_akun,
      email: account.email,
      role: account.role
    }

    if (account.role === 'PELATIH' && account.pelatih) {
      tokenPayload.pelatihId = account.pelatih.id_pelatih
    } else if (account.role === 'ADMIN' && account.admin) {
      tokenPayload.adminId = account.admin.id_admin
    }

    const token = generateToken(tokenPayload)

    // Prepare user response
    const userResponse: LoginResponse['user'] = {
      id_akun: account.id_akun,
      email: account.email,
      role: account.role
    }

    if (account.pelatih) {
      userResponse.pelatih = {
        id_pelatih: account.pelatih.id_pelatih,
        nama_pelatih: account.pelatih.nama_pelatih,
        no_telp: account.pelatih.no_telp,
        id_dojang: account.pelatih.id_dojang
      }
    }

    if (account.admin) {
      userResponse.admin = {
        id_admin: account.admin.id_admin,
        nama: account.admin.nama
      }
    }

    return {
      token,
      user: userResponse
    }
  }

  async getProfile(id_akun: number) {
    const account = await prisma.tb_akun.findUnique({
      where: { id_akun },
      include: {
        pelatih: true,
        admin: true
      }
    })

    if (!account) {
      throw new Error('Account not found')
    }

    const { password_hash, ...accountData } = account

    return accountData
  }

  async changePassword(id_akun: number, currentPassword: string, newPassword: string) {
    const account = await prisma.tb_akun.findUnique({
      where: { id_akun }
    })

    if (!account) {
      throw new Error('Account not found')
    }

    const isValidPassword = await comparePassword(currentPassword, account.password_hash)
    
    if (!isValidPassword) {
      throw new Error('Current password is incorrect')
    }

    const password_hash = await hashPassword(newPassword)

    await prisma.tb_akun.update({
      where: { id_akun },
      data: { password_hash }
    })

    return { message: 'Password updated successfully' }
  }
}

export default new AuthService()
