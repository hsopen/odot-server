import type { NextFunction, Request, Response } from 'express'
import multer from 'multer'
import authService from '../services/authService'
import s3Service from '../services/S3Service'
import userService from '../services/userService'
import { redisZero } from '../utils/redis'
import { resHandler } from '../utils/resHandler'

const userController = {

  /**
   * 上传头像
   * @param req
   * @param res
   * @param _next
   */
  async uploadAvatar(req: Request, res: Response, _next: NextFunction) {
    // 使用 multer 配置来处理文件上传
    const storage = multer.memoryStorage() // 使用内存存储，不保存到磁盘
    const upload = multer({ storage }) // 配置上传方式

    // 使用 multer 中间件处理上传的文件
    upload.single('avatar')(req, res, async (err) => {
      if (err) {
        console.error('Error processing file upload:', err)
        return resHandler(res, 400, false, 'Error uploading file')
      }

      // 获取上传的文件数据
      const fileBuffer = req.file?.buffer

      if (!fileBuffer) {
        return resHandler(res, 400, false, 'No file uploaded')
      }

      try {
        // 获取当前用户的头像路径
        const avatarPath: string = `${res.locals.userId}/config/avatar.webp`

        // 上传文件到 OSS
        const result = await s3Service.uploadFile(avatarPath, fileBuffer)

        // 返回成功响应
        return resHandler(res, 200, true, 'Avatar uploaded successfully', result)
      }
      catch (error) {
        console.error('Error uploading avatar:', error)
        return resHandler(res, 500, false, 'Error uploading avatar')
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
