import express from 'express'
import authController from '../../controllers/authController'
import { emailValidator, handleValidationErrors } from './middleware/validator'

const router = express.Router()

router.post('/getEmailVerificationCode', emailValidator, handleValidationErrors, authController.getEmailVerificationCode)

export default router
