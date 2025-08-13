import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { ApiResponse } from '../utils/response';
import { hashPassword, comparePassword } from '../utils/bcrypt';

const prisma = new PrismaClient();

export class AuthController {
  // Register Pelatih
  static async registerPelatih(req: Request, res: Response) {
    try {
      const { nama_pelatih, email, no_telp, password } = req.body;

      // Check if email already exists
      const existingPelatih = await prisma.tb_pelatih.findUnique({
        where: { email }
      });

      if (existingPelatih) {
        return ApiResponse.error(res, 'Email sudah terdaftar', 400);
      }

      // Hash password
      const password_hash = await hashPassword(password);

      // Create pelatih
      const newPelatih = await prisma.tb_pelatih.create({
        data: {
          nama_pelatih,
          email,
          no_telp,
          password_hash
        },
        select: {
          id_pelatih: true,
          nama_pelatih: true,
          email: true,
          no_telp: true,
          foto_ktp: true,
          sertifikat_pelatih: true
        }
      });

      return ApiResponse.success(res, newPelatih, 'Pelatih berhasil terdaftar', 201);
    } catch (error) {
      console.error('Register pelatih error:', error);
      return ApiResponse.error(res, 'Internal server error', 500);
    }
  }

  // Login
  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      // Find pelatih by email
      const pelatih = await prisma.tb_pelatih.findUnique({
        where: { email }
      });

      if (!pelatih) {
        return ApiResponse.error(res, 'Email atau password salah', 401);
      }

      // Compare password
      const isPasswordValid = await comparePassword(password, pelatih.password_hash);
      if (!isPasswordValid) {
        return ApiResponse.error(res, 'Email atau password salah', 401);
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          id_pelatih: pelatih.id_pelatih, 
          email: pelatih.email,
          nama_pelatih: pelatih.nama_pelatih
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      const responseData = {
        token,
        user: {
          id_pelatih: pelatih.id_pelatih,
          nama_pelatih: pelatih.nama_pelatih,
          email: pelatih.email,
          no_telp: pelatih.no_telp,
          foto_ktp: pelatih.foto_ktp,
          sertifikat_pelatih: pelatih.sertifikat_pelatih
        }
      };

      return ApiResponse.success(res, responseData, 'Login berhasil');
    } catch (error) {
      console.error('Login error:', error);
      return ApiResponse.error(res, 'Internal server error', 500);
    }
  }

  // Get Profile
  static async getProfile(req: Request, res: Response) {
    try {
      const { id_pelatih } = req.user;

      const pelatih = await prisma.tb_pelatih.findUnique({
        where: { id_pelatih },
        select: {
          id_pelatih: true,
          nama_pelatih: true,
          email: true,
          no_telp: true,
          foto_ktp: true,
          sertifikat_pelatih: true
        }
      });

      if (!pelatih) {
        return ApiResponse.error(res, 'Pelatih tidak ditemukan', 404);
      }

      return ApiResponse.success(res, pelatih, 'Profile berhasil diambil');
    } catch (error) {
      console.error('Get profile error:', error);
      return ApiResponse.error(res, 'Internal server error', 500);
    }
  }

  // Update Profile
  static async updateProfile(req: Request, res: Response) {
    try {
      const { id_pelatih } = req.user;
      const { nama_pelatih, no_telp } = req.body;

      const updatedPelatih = await prisma.tb_pelatih.update({
        where: { id_pelatih },
        data: {
          nama_pelatih,
          no_telp
        },
        select: {
          id_pelatih: true,
          nama_pelatih: true,
          email: true,
          no_telp: true,
          foto_ktp: true,
          sertifikat_pelatih: true
        }
      });

      return ApiResponse.success(res, updatedPelatih, 'Profile berhasil diupdate');
    } catch (error) {
      console.error('Update profile error:', error);
      return ApiResponse.error(res, 'Internal server error', 500);
    }
  }

  // Upload Documents
  static async uploadDocuments(req: Request, res: Response) {
    try {
      const { id_pelatih } = req.user;
      const files = req.files as any;

      const updateData: any = {};
      
      if (files?.foto_ktp) {
        updateData.foto_ktp = files.foto_ktp[0].filename;
      }
      
      if (files?.sertifikat_pelatih) {
        updateData.sertifikat_pelatih = files.sertifikat_pelatih[0].filename;
      }

      const updatedPelatih = await prisma.tb_pelatih.update({
        where: { id_pelatih },
        data: updateData,
        select: {
          id_pelatih: true,
          nama_pelatih: true,
          email: true,
          no_telp: true,
          foto_ktp: true,
          sertifikat_pelatih: true
        }
      });

      return ApiResponse.success(res, updatedPelatih, 'Dokumen berhasil diupload');
    } catch (error) {
      console.error('Upload documents error:', error);
      return ApiResponse.error(res, 'Internal server error', 500);
    }
  }

  // Change Password
  static async changePassword(req: Request, res: Response) {
    try {
      const { id_pelatih } = req.user;
      const { old_password, new_password } = req.body;

      // Get current pelatih
      const pelatih = await prisma.tb_pelatih.findUnique({
        where: { id_pelatih }
      });

      if (!pelatih) {
        return ApiResponse.error(res, 'Pelatih tidak ditemukan', 404);
      }

      // Verify old password
      const isOldPasswordValid = await comparePassword(old_password, pelatih.password_hash);
      if (!isOldPasswordValid) {
        return ApiResponse.error(res, 'Password lama salah', 400);
      }

      // Hash new password
      const new_password_hash = await hashPassword(new_password);

      // Update password
      await prisma.tb_pelatih.update({
        where: { id_pelatih },
        data: { password_hash: new_password_hash }
      });

      return ApiResponse.success(res, null, 'Password berhasil diubah');
    } catch (error) {
      console.error('Change password error:', error);
      return ApiResponse.error(res, 'Internal server error', 500);
    }
  }
}