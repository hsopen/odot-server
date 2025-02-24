import express from 'express'
import userController from '../../controllers/userController'
import { getUserIdFromToken } from './middleware/authMiddleware'
import { emailValidator, handleValidationErrors, passwordValidator } from './middleware/validatorMiddleware'

const router = express.Router()

router.post('/registerANewUser', emailValidator, passwordValidator, handleValidationErrors, userController.createAUser)
router.post('/changePassword', getUserIdFromToken, passwordValidator, handleValidationErrors, userController.modifyPassword)
router.post('/changeEmailAddress', getUserIdFromToken, emailValidator, handleValidationErrors, userController.modifyEmailAddress)

export default router
