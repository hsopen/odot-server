import express from 'express'
import userController from '../../controllers/userController'
import { getUserIdFromToken } from './middleware/authMiddleware'
import { emailValidator, handleValidationErrors, passwordValidator } from './middleware/validatorMiddleware'

const router = express.Router()

/**
 * 注册新用户api
 */
router.post('/registerANewUser', emailValidator, passwordValidator, handleValidationErrors, userController.createAUser)

/**
 * 修改用户密码api
 */
router.post('/changePassword', getUserIdFromToken, passwordValidator, handleValidationErrors, userController.modifyPassword)

/**
 * 修改用户邮箱api
 */
router.post('/changeEmailAddress', getUserIdFromToken, emailValidator, handleValidationErrors, userController.modifyEmailAddress)

export default router
