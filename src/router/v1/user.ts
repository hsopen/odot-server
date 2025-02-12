import express from 'express'
import userController from '../../controllers/userController'
import { emailValidator, handleValidationErrors, passwordValidator } from './middleware/validator'

const router = express.Router()

router.post('/registerANewUser', emailValidator, passwordValidator, handleValidationErrors, userController.createAUser)

export default router
