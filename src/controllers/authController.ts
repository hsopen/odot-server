import type { NextFunction, Request, Response } from 'express'
import authService from '../services/authService'
import getEnv from '../utils/getEnv'
import logger from '../utils/logger'
import { redisOne, redisZero } from '../utils/redis'
import { resHandler } from '../utils/resHandler'

const authController = {

  /**
   * 修改密码
   * @param req
   * @param res
   * @param _next
   */
  async forgotPassword(req: Request, res: Response, _next: NextFunction) {
    if (!await authService.verificationCode(req.body.code, req.body.email)) {
      resHandler(res, 401, false, 'incorrectVerificationCode')
    }
    else {
      const result = await authService.changePasswordAfterForgot(req.body.email, req.body.password)
      if (result === 'noSuchUser') {
        resHandler(res, 401, true, 'noSuchUser')
        return
      }
      else if (result === 'queryError') {
        resHandler(res, 500, false, 'updateFailed')
        return
      }
      redisZero.del(req.body.email)
      resHandler(res, 200, true, 'modificationSuccessful')
    }
  },

  /**
   * 登录认证控制器
   * @param req
   * @param res
   * @param _next
   */
  async login(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const data = req.body
    const result = await authService.login(data.email, data.password)
    if (result === 'loginSuccessfully') {
      const token = await authService.generateJwtToken(data.email)

      data.remember
        ? res.cookie('token', token, { maxAge: getEnv.JWT_TOKEN_COOKIE_MAX_AGE, httpOnly: getEnv.COOKIE_HTTP_ONLY, secure: getEnv.COOKIE_SECURE, sameSite: getEnv.COOKIE_SAME_SITE })
        : res.cookie('token', token, { httpOnly: getEnv.COOKIE_HTTP_ONLY, secure: getEnv.COOKIE_SECURE, sameSite: getEnv.COOKIE_SAME_SITE })
      resHandler(res, 200, true, 'login successfully')
    }
    else if (result === 'loginFailed') {
      resHandler(res, 500, false, 'login failed')
    }
    else {
      resHandler(res, 401, false, 'incorrect account or password')
    }
  },

  /**
   * 发送邮箱验证码控制器
   * @param req
   * @param res
   * @param _next
   */
  async sendAnEmailVerificationCode(req: Request, res: Response, _next: NextFunction) {
    const data = req.body
    try {
      if (await redisOne.get(data.email)) {
        resHandler(res, 429, false, 'RequestsTooFrequently')
        return
      }
      const code = await authService.sendVerificationCode(data.email)
      await redisZero.set(data.email, code, 'EX', getEnv.EMAIL_EXPIRATION_TIME)
      await redisOne.set(data.email, 1, 'EX', getEnv.VERIFICATION_CODE_SENDING_INTERVAL)
      resHandler(res, 200, true, 'email verification code was sent successfully')
    }
    catch (error) {
      logger.error(error)
      res.status(400).send('email_verification_code_was_sent_error')
    }
  },
}

export default authController
