import type { NextFunction, Request, Response } from 'express'
import authService from '../services/authService'
import getEnv from '../utils/getEnv'
import logger from '../utils/logger'
import { redisOne, redisZero } from '../utils/redis'
import { resHandler } from '../utils/resHandler'

const authController = {
  async sendAnEmailVerificationCode(req: Request, res: Response, _next: NextFunction) {
    const data = req.body
    try {
      const code = await authService.sendVerificationCode(data.email)
      await redisZero.set(data.email, code, 'EX', getEnv.EMAIL_EXPIRATION_TIME)
      await redisOne.set(data.email, '', 'EX', getEnv.EMAIL_EXPIRATION_TIME)
      resHandler(res, 200, true, 'EmailVerificationCodeWasSentSuccessfully')
    }
    catch (error) {
      logger.error(error)
      res.status(400).send('emailVerificationCodeWasSentError')
    }
  },
}

export default authController
