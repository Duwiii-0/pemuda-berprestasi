// pemuda-berprestasi-mvp/src/routes/auth.ts
import { Router } from 'express'
import authController from '../controllers/authController'
import { validate } from '../middleware/validation'
import { authenticate } from '../middleware/auth'
import { 
  registerSchema, 
  loginSchema, 
  changePasswordSchema,
  resetPasswordSchema 
} from '../validations/authValidation'

const router = Router()

// Public routes
router.post('/register', validate(registerSchema), authController.register)
router.post('/login', validate(loginSchema), authController.login)

// NEW: Reset password route (public - no auth required)
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword)

// Protected routes
router.get('/profile', authenticate, authController.getProfile)
router.put('/change-password', 
  authenticate, 
  validate(changePasswordSchema), 
  authController.changePassword
)
router.post('/logout', authenticate, authController.logout)

export default router