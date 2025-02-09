import type { NextFunction, Request, Response } from 'express'
import authService from '../services/authService'
import logger from '../utils/logger'
import { resHandler } from '../utils/resHandler'

const authController = {
  async getEmailVerificationCode(req: Request, res: Response, _next: NextFunction) {
    const data = req.body
    try {
      await authService.sendVerificationCode(data.email)
      resHandler(res, 200, true, 'EmailVerificationCodeWasSentSuccessfully')
    }
    catch (error) {
      logger.error(error)
      res.status(400).send('emailVerificationCodeWasSentError')
    }
  },
}

export default authController
