// src/controllers/authController.ts
import { Request, Response } from 'express'
import authService from '../services/authService'
import { sendSuccess, sendError } from '../utils/response'
import { asyncHandler } from '../middleware/errorHandler'

class AuthController {
  // Register new pelatih
  register = asyncHandler(async (req: Request, res: Response) => {
    try {
      const result = await authService.register(req.body)
      
      sendSuccess(
        res, 
        result, 
        'Registration successful', 
        201
      )
    } catch (error: any) {
      if (error.message === 'Email already registered') {
        return sendError(res, error.message, 409)
      }
      
      return sendError(res, error.message || 'Registration failed', 400)
    }
  })

  // Login user
  login = asyncHandler(async (req: Request, res: Response) => {
    try {
      const result = await authService.login(req.body)
      
      sendSuccess(res, result, 'Login successful')
    } catch (error: any) {
      if (error.message === 'Invalid credentials') {
        return sendError(res, error.message, 401)
      }
      
      return sendError(res, error.message || 'Login failed', 400)
    }
  })

  // Get user profile
  getProfile = asyncHandler(async (req: Request, res: Response) => {
    try {
      const user = req.user!
      const profile = await authService.getProfile(user.id_akun)
      
      sendSuccess(res, profile, 'Profile retrieved successfully')
    } catch (error: any) {
      return sendError(res, error.message || 'Failed to get profile', 400)
    }
  })

  // Change password
  changePassword = asyncHandler(async (req: Request, res: Response) => {
    try {
      const user = req.user!
      const { currentPassword, newPassword } = req.body
      
      const result = await authService.changePassword(
        user.id_akun, 
        currentPassword, 
        newPassword
      )
      
      sendSuccess(res, result, 'Password changed successfully')
    } catch (error: any) {
      if (error.message === 'Current password is incorrect') {
        return sendError(res, error.message, 400)
      }
      
      return sendError(res, error.message || 'Failed to change password', 400)
    }
  })

  // Logout (optional - for token blacklist if needed)
  logout = asyncHandler(async (req: Request, res: Response) => {
    // Since we're using stateless JWT, logout is handled client-side
    // But we can add token blacklist logic here if needed in future
    sendSuccess(res, null, 'Logged out successfully')
  })
}

export default new AuthController()