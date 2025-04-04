import express from 'express'
import userController from '../../controllers/userController'
import { getUserIdFromToken } from './middleware/authMiddleware'
import { emailValidator, handleValidationErrors, nickname as nicknameValidator, passwordValidator } from './middleware/validatorMiddleware'

const router = express.Router()

/**
 * 获取用户昵称
 */
router.get('/getNickname', getUserIdFromToken, userController.getNickname)

/**
 * 获取用户邮箱
 */
router.get('/getUserEmail', getUserIdFromToken, userController.getUserEmail)

/**
 * 获取头像
 */
router.get('/getAvatar', getUserIdFromToken, userController.getAvatarPresignedUrl)

/**
 * 上传头像api
 */
router.put('/uploadAvatar', getUserIdFromToken, userController.uploadAvatar)

/**
 * 注销用户api
 */
router.delete('/deactivateUser', getUserIdFromToken, passwordValidator, handleValidationErrors, userController.deactivateUser)

/**
 * 修改用户昵称api
 */
router.put('/modifyNickname', getUserIdFromToken, nicknameValidator, handleValidationErrors, userController.modifyNickname)

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
