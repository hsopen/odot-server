import type { NextFunction, Request, Response } from 'express'
import authService from '../services/authService'
import userService from '../services/userService'
import { redisZero } from '../utils/redis'
import { resHandler } from '../utils/resHandler'

const userController = {
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
      redisZero.del(res.locals.email)
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
      resHandler(res, 200, false, 'registeredSuccessfully')
    }
  },
}
export default userController
