import express from 'express'
import authController from '../../controllers/authController'
import { emailValidator, handleValidationErrors } from './middleware/validator'

const router = express.Router()

router.post('/sendAnEmailVerificationCode', emailValidator, handleValidationErrors, authController.sendAnEmailVerificationCode)

export default router
