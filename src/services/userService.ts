import type { Buffer } from 'node:buffer'
import { createHash, randomBytes } from 'node:crypto'
import sharp from 'sharp'
import { v7 as uuidv7 } from 'uuid'
import logger from '../utils/logger'
import prisma from '../utils/prisma'
import s3Service from './S3Service'

const userService = {

  /**
   * 获取用户邮箱地址
   * @param id 用户id
   */
  async getUserEmail(id: string): Promise<string | null> {
    try {
      const result = await prisma.user.findUniqueOrThrow({ where: { id }, select: { email: true } })
      return result.email
    }
    catch (err) {
      logger.error(err)
      return null
    }
  },

  /**
   * 获取用户昵称
   * @param id 用户id
   */
  async getUserNickname(id: string): Promise<string | null> {
    try {
      const result = await prisma.user.findUniqueOrThrow({ where: { id }, select: { nickname: true } })
      return result.nickname
    }
    catch (err) {
      logger.error(err)
      return null
    }
  },
  /**
   * 生成用户预签名头像
   * @param id 用户id
   * @returns 预签名链接或null
   */
  async getUserAvatarPresignedUrl(id: string): Promise<string | null> {
    const filePath: string = `${id}/config/avatar.webp`
    const resutl: string | null = await s3Service.getFileSignature(filePath, 108000)
    return resutl
  },

  /**
   * 上传用户头像
   * @param id 用户id
   * @param fileBuffer 头像文件
   * @returns 返回上传结果
   */
  async uploadUserAvatar(id: string, fileBuffer: Buffer): Promise<
    'fileTypeMismatch' |
    'imageSizeDoesNotMeetDimensions' |
    'uploadSuccess' |
    'imageUploadFailed'
  > {
    const filePath: string = `${id}/config/avatar.webp`
    const image = sharp(fileBuffer)
    const metadata = await image.metadata()
    if (!(metadata.format === 'webp')) {
      return 'fileTypeMismatch'
    }
    if (metadata.width && metadata.height) {
      if (!(metadata.width === metadata.height)) {
        return 'imageSizeDoesNotMeetDimensions'
      }
    }
    else {
      return 'imageUploadFailed'
    }
    const result = await s3Service.uploadFile(filePath, fileBuffer, 5242880)
    if (!result) {
      return 'imageUploadFailed'
    }
    return 'uploadSuccess'
  },

  /**
   * 删除用户信息
   * @param id 用户id
   * @param password 用户密码
   * @returns 成功or失败
   */
  async deactivateUser(id: string, password: string) {
    try {
      const result = await prisma.user.findFirstOrThrow({ where: { id }, select: { salt: true, password: true } })
      password = generateHashPassword(result.salt + password)
      if (result.password === password) {
        await prisma.user.delete({ where: { id } })
        await prisma.task.deleteMany({ where: { own_user_id: id } })
        await s3Service.deleteFolder(`${id}/`)
        return true
      }
      return false
    }
    catch (err) {
      logger.error(err)
      return false
    }
  },

  /**
   * 修改用户昵称
   * @param id 用户id
   * @param nickname 新用户昵称
   * @returns 是否修改成功
   */
  async modifyNickname(id: string, nickname: string): Promise<boolean> {
    try {
      await prisma.user.update({ where: { id }, data: { nickname } })
      return true
    }
    catch (err) {
      logger.error(err)
      return false
    }
  },

  /**
   * 修改用户的邮箱
   * @param id 用户id
   * @param newEmail 新的邮箱地址
   */
  async modifyEmailAddress(id: string, newEmail: string, oldEmail: string): Promise<
    'newEmailSameAsOldEmail' |
    'modificationSuccess' |
    'updateFailed'
  > {
    try {
      if (oldEmail === newEmail) {
        return 'newEmailSameAsOldEmail'
      }
      await prisma.user.update({ where: { id }, data: { email: newEmail, certification_information_modification_time: new Date() } })
      return 'modificationSuccess'
    }
    catch (err) {
      logger.error(err)
      return 'modificationSuccess'
    }
  },

  /**
   * 修改密码
   * @param id
   * @param newPassword
   */
  async modifyPassword(id: string, newPassword: string) {
    try {
      const result = await prisma.user.findFirstOrThrow({ where: { id } })
      const newPasswordHash = generateHashPassword(result.salt + newPassword)
      await prisma.user.update({ where: { id }, data: { password: newPasswordHash, certification_information_modification_time: new Date() } })
    }
    catch (err) {
      logger.error(err)
    }
  },

  /**
   * 创建用户
   * @param email 用户邮箱地址
   * @param password 用户密码
   */
  async createANewUser(email: string, password: string): Promise<
    'registeredSuccessfully' |
    'registrationFailed' |
    'emailHasBeenRegistered'
  > {
    try {
      const salt = generateStr(32)
      const passwordHash = generateHashPassword(salt + password)
      const result = await prisma.user.findFirst({ where: { email } })
      if (result) {
        return 'emailHasBeenRegistered'
      }
      await prisma.user.create({
        data: {
          id: uuidv7(),
          email,
          salt,
          password: passwordHash,
          creation_time: new Date(),
          nickname: `用户-${generateStr(4)}`,
          certification_information_modification_time: new Date(),
        },
      })
      return 'registeredSuccessfully'
    }
    catch (err) {
      logger.error(err)
      return 'registrationFailed'
    }
  },
}

/**
 * 生成随机字符串
 * @param length 字符串长度
 */
function generateStr(length: number): string {
  const bytes = randomBytes(length)
  return bytes.toString('hex').slice(0, length)
}

/**
 * 获取密码hash
 * @param str
 */
export function generateHashPassword(str: string): string {
  return createHash('sha256').update(str).digest('hex')
}

export default userService
