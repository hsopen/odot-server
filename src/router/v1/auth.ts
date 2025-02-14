import express from 'express'
import authController from '../../controllers/authController'
import {
  emailValidator,
  handleValidationErrors,
  passwordValidator,
  rememberToLogInValidator,
} from './middleware/validator'

const router = express.Router()

router.post('/sendAnEmailVerificationCode', emailValidator, handleValidationErrors, authController.sendAnEmailVerificationCode)
router.post('/login', emailValidator, passwordValidator, rememberToLogInValidator, handleValidationErrors, authController.login)
export default router
