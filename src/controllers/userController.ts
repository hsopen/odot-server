import type { NextFunction, Request, Response } from 'express'
import authService from '../services/authService'
import userService from '../services/userService'
import { redisZero } from '../utils/redis'
import { resHandler } from '../utils/resHandler'

const userController = {

  /**
   * 修改用户昵称
   * @param req
   * @param res
   * @param _next
   */
  async modifyNickname(req: Request, res: Response, _next: NextFunction) {
    const data = req.body
    if (await userService.modifyNickname(res.locals.userId, data.nickname)) {
      resHandler(res, 200, true, 'nicknameUpdateSuccess')
      return
    }
    resHandler(res, 500, false, 'nicknameUpdateFailed')
  },

  /**
   * 修改用户邮箱地址
   * @param req
   * @param res
   * @param _next
   */
  async modifyEmailAddress(req: Request, res: Response, _next: NextFunction) {
    const data = req.body
    if (!await authService.verificationCode(data.code, data.email)) {
      resHandler(res, 401, false, 'verificationCodeError')
      return
    }
    const result = await userService.modifyEmailAddress(res.locals.userId, data.email, res.locals.userEmail)
    if (result === 'modificationSuccess') {
      redisZero.del(res.locals.userEmail)
      resHandler(res, 200, true, 'emailUpdateSuccessful')
    }
    else if (result === 'newEmailSameAsOldEmail') {
      resHandler(res, 409, false, 'newEmailSameAsOldEmail')
    }
    else {
      resHandler(res, 500, false, 'updateFailed')
    }
  },

  /**
   * 修改密码
   * @param req
   * @param res
   * @param _next
   */
  async modifyPassword(req: Request, res: Response, _next: NextFunction) {
    const data = req.body
    if (await authService.verificationCode(data.code, undefined, res.locals.userId)) {
      await userService.modifyPassword(res.locals.userId, data.password)
      redisZero.del(res.locals.userEmail)
      resHandler(res, 200, true, 'modificationWasSuccessful')
      return
    }
    resHandler(res, 401, false, 'verificationCodeError')
  },

  /**
   * 创建用户
   * @param req
   * @param res
   * @param _next
   */
  async createAUser(req: Request, res: Response, _next: NextFunction) {
    const data = req.body
    if (!await authService.verificationCode(data.code, data.email)) {
      resHandler(res, 401, false, 'verificationCodeVerificationError')
      return
    }
    const result = await userService.createANewUser(data.email, data.password)
    if (result === 'registrationFailed') {
      resHandler(res, 401, false, 'registrationFailed')
    }
    else if (result === 'emailHasBeenRegistered') {
      resHandler(res, 401, false, 'emailHasBeenRegistered')
    }
    else {
      redisZero.del(data.email)
      resHandler(res, 200, true, 'registeredSuccessfully')
    }
  },
}
export default userController
