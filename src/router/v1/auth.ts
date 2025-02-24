import express from 'express'
import authController from '../../controllers/authController'
import {
  emailValidator,
  handleValidationErrors,
  passwordValidator,
  rememberToLogInValidator,
} from './middleware/validatorMiddleware'

const router = express.Router()

/**
 * 发送验证码
 */
router.post('/sendAnEmailVerificationCode', emailValidator, handleValidationErrors, authController.sendAnEmailVerificationCode)

/**
 * 用户登录
 */
router.post('/login', emailValidator, passwordValidator, rememberToLogInValidator, handleValidationErrors, authController.login)
export default router
