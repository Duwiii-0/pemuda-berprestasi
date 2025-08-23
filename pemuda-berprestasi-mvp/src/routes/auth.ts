// src/routes/auth.ts
import { Router } from 'express'
import authController from '../controllers/authController'
import { validate } from '../middleware/validation'
import { authenticate } from '../middleware/auth'
import { 
  registerSchema, 
  loginSchema, 
  changePasswordSchema 
} from '../validations/authValidation'

const router = Router()

// Public routes
router.post('/register', validate(registerSchema), authController.register)
router.post('/login', validate(loginSchema), authController.login)

// Protected routes
router.get('/profile', authenticate, authController.getProfile)
router.put('/change-password', 
  authenticate, 
  validate(changePasswordSchema), 
  authController.changePassword
)
router.post('/logout', authenticate, authController.logout)

export default router