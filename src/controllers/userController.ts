import type { NextFunction, Request, Response } from 'express'
import multer from 'multer'
import authService from '../services/authService'
import userService from '../services/userService'
import logger from '../utils/logger'
import { redisZero } from '../utils/redis'
import { resHandler } from '../utils/resHandler'

const userController = {

  /**
   * 获取用户邮箱控制器
   * @param req
   * @param res
   * @param _next
   */
  async getUserEmail(req: Request, res: Response, _next: NextFunction) {
    const result = await userService.getUserEmail(res.locals.userId)
    if (!result) {
      resHandler(res, 500, true, 'failedToGetUserEmail')
    }
    resHandler(res, 200, true, 'getUserEmailSuccess', { email: result })
  },

  /**
   * 获取用户昵称控制器
   * @param req
   * @param res
   * @param _next
   */
  async getNickname(req: Request, res: Response, _next: NextFunction) {
    const result = await userService.getUserNickname(res.locals.userId)
    if (!result) {
      resHandler(res, 500, true, 'failedToGetUserNickname')
    }
    resHandler(res, 200, true, 'getUsernameSuccess', { nickname: result })
  },

  /**
   * 获取头像预签名控制器
   * @param req
   * @param res
   * @param _next
   * @returns void
   */
  async getAvatarPresignedUrl(req: Request, res: Response, _next: NextFunction): Promise<void> {
    const result: string | null = await userService.getUserAvatarPresignedUrl(res.locals.userId)
    if (result === null) {
      resHandler(res, 500, false, 'errorGettingPresignedUrl')
      return
    }
    resHandler(res, 200, true, 'fetchPresignedUrlSuccess', { url: result })
  },

  /**
   * 上传头像
   * @param req
   * @param res
   * @param _next
   */
  async uploadAvatar(req: Request, res: Response, _next: NextFunction) {
    const storage = multer.memoryStorage()
    const upload = multer({ storage })
    upload.single('avatar')(req, res, async (err) => {
      if (err) {
        return resHandler(res, 400, false, 'Error uploading file')
      }

      // 获取上传的文件数据
      const fileBuffer = req.file?.buffer

      if (!fileBuffer) {
        return resHandler(res, 400, false, 'noFileUploaded')
      }
      try {
        // 上传文件到 OSS
        const result = await userService.uploadUserAvatar(res.locals.userId, fileBuffer)
        if (result === 'fileTypeMismatch') {
          return resHandler(res, 500, false, 'fileTypeMismatch')
        }
        else if (result === 'imageSizeDoesNotMeetDimensions') {
          return resHandler(res, 500, false, 'imageSizeDoesNotMeetDimensions')
        }
        else if (result === 'imageUploadFailed') {
          return resHandler(res, 500, false, 'imageUploadFailed')
        }
        else {
          return resHandler(res, 200, true, 'avatarUploadSuccess')
        }
      }
      catch (error) {
        logger.error('Error uploading avatar:', error)
        return resHandler(res, 500, false, 'avatarUploadError')
      }
    })
  },

  /**
   * 注销用户控制器
   * @param req
   * @param res
   * @param _next
   * @returns 空
   */
  async deactivateUser(req: Request, res: Response, _next: NextFunction) {
    if (await authService.verificationCode(req.body.code, res.locals.userEmail)) {
      if (await userService.deactivateUser(res.locals.userId, req.body.password)) {
        resHandler(res, 200, true, 'accountDeletionSuccess')
        return
      }
      resHandler(res, 401, false, 'passwordError')
      return
    }
    resHandler(res, 401, false, 'verificationCodeError')
  },

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
