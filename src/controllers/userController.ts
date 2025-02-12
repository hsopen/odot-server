import type { NextFunction, Request, Response } from 'express'
import authService from '../services/authService'
import userService from '../services/userService'
import { resHandler } from '../utils/resHandler'

const userController = {
  async createAUser(req: Request, res: Response, _next: NextFunction) {
    const data = req.body
    if (!await authService.verificationCode(data.email, data.code)) {
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
      resHandler(res, 200, false, 'registeredSuccessfully')
    }
  },
}
export default userController
