// src/controllers/authController.ts
import { Request, Response } from 'express'
import { hashPassword, comparePassword } from '../utils/bcrypt'
import { generateTokenPair } from '../utils/jwt'
import { ResponseHelper } from '../utils/response'
import { prisma } from '../config/database'

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const { email, password, nama_pelatih, no_telp } = req.body

      // Check if user exists
      const existingUser = await prisma.tb_akun.findUnique({
        where: { email }
      })

      if (existingUser) {
        return ResponseHelper.error(res, 'Email already registered', null, 409)
      }

      // Hash password
      const hashedPassword = await hashPassword(password)

      // Create account and pelatih in transaction
      const result = await prisma.$transaction(async (tx) => {
        const akun = await tx.tb_akun.create({
          data: {
            email,
            password_hash: hashedPassword,
            role: 'PELATIH'
          }
        })

        const pelatih = await tx.tb_pelatih.create({
          data: {
            nama_pelatih,
            no_telp,
            id_akun: akun.id_akun
          }
        })

        return { akun, pelatih }
      })

      // Generate tokens
      const tokens = generateTokenPair({
        id: result.akun.id_akun,
        email: result.akun.email,
        role: result.akun.role,
        pelatihId: result.pelatih.id_pelatih
      })

      return ResponseHelper.created(res, {
        user: {
          id: result.akun.id_akun,
          email: result.akun.email,
          role: result.akun.role,
          pelatih: result.pelatih
        },
        tokens
      }, 'Pelatih registered successfully')

    } catch (error) {
      console.error('Registration error:', error)
      return ResponseHelper.serverError(res, 'Registration failed', error)
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body

      // Find user with relations
      const akun = await prisma.tb_akun.findUnique({
        where: { email },
        include: {
          pelatih: true,
          admin: true
        }
      })

      if (!akun) {
        return ResponseHelper.unauthorized(res, 'Invalid credentials')
      }

      // Verify password
      const isPasswordValid = await comparePassword(password, akun.password_hash)
      if (!isPasswordValid) {
        return ResponseHelper.unauthorized(res, 'Invalid credentials')
      }

      // Generate tokens
      const tokenPayload: any = {
        id: akun.id_akun,
        email: akun.email,
        role: akun.role
      }

      if (akun.pelatih) {
        tokenPayload.pelatihId = akun.pelatih.id_pelatih
      }

      if (akun.admin) {
        tokenPayload.adminId = akun.admin.id_admin
      }

      const tokens = generateTokenPair(tokenPayload)

      return ResponseHelper.success(res, {
        user: {
          id: akun.id_akun,
          email: akun.email,
          role: akun.role,
          pelatih: akun.pelatih,
          admin: akun.admin
        },
        tokens
      }, 'Login successful')

    } catch (error) {
      console.error('Login error:', error)
      return ResponseHelper.serverError(res, 'Login failed', error)
    }
  }
}