import { createHash } from 'node:crypto'
import { Prisma } from '@prisma/client'
import jwt from 'jsonwebtoken'
import { sendVerificationCode } from '../utils/email'
import getEnv from '../utils/getEnv'
import logger from '../utils/logger'
import prisma from '../utils/prisma'
import { redisZero } from '../utils/redis'
import { generateHashPassword } from './userService'

const authService = {

  /**
   * 忘记密码后修改密码
   * @param email 用户邮箱
   * @param password 用户新密码
   * @returns 成功or失败
   */
  async changePasswordAfterForgot(email: string, password: string) {
    try {
      const result = await prisma.user.findUnique({ where: { email }, select: { salt: true } })
      if (result) {
        const passwordHash = generateHashPassword(result.salt + password)
        await prisma.user.update({ where: { email }, data: { password: passwordHash, certification_information_modification_time: new Date() } })
        return 'modificationSucceeded'
      }
      return 'noSuchUser'
    }
    catch (err) {
      logger.error(err)
      return 'queryError'
    }
  },

  /**
   * 生成jwt
   * @param email 邮箱地址
   */
  async generateJwtToken(email: string): Promise<string> {
    try {
      const { id } = await prisma.user.findUniqueOrThrow({ where: { email }, select: { id: true } })
      return jwt.sign({ id, email }, getEnv.JWT_SECRET_KEY, { expiresIn: getEnv.JWT_EXPIRATION_TIME })
    }
    catch (err) {
      logger.error(err)
      return 'generateJwtError'
    }
  },

  /**
   * 登录认证
   * @param email 电子邮件地址
   * @param password 账户密码
   */
  async login(email: string, password: string): Promise<
    'loginSuccessfully' |
    'loginFailed' |
    'incorrectAccountOrPassword'
  > {
    try {
      const result = await prisma.user.findUnique({ where: { email } })
      if (!result) {
        return 'incorrectAccountOrPassword'
      }
      const str: string = result.salt + password
      const hashPassword: string = createHash('sha256').update(str).digest('hex')
      if (!(hashPassword === result.password)) {
        return 'incorrectAccountOrPassword'
      }
      return 'loginSuccessfully'
    }
    catch (err) {
      logger.error(err)
      return 'loginFailed'
    }
  },
  /**
   * 发送验证码
   * @param email
   */
  async sendVerificationCode(email: string) {
    // 生成6位数字验证码
    const code: string = Math.floor(100000 + Math.random() * 900000).toString()
    try {
      await sendVerificationCode(email, code)
      logger.info(`验证码已发送至 ${email}`)
      return code
    }
    catch (err) {
      logger.error('邮件发送失败:', err)
      throw new Error('emailSendFailed') // 向上抛出统一错误
    }
  },

  /**
   * 检查验证码
   * @param code 验证码
   * @param email
   * @param id
   */
  async verificationCode(code: string, email?: string, id?: string): Promise<boolean> {
    if (email) {
      const codeValue = await redisZero.get(email)
      return codeValue === code
    }
    else {
      try {
        const result = await prisma.user.findUniqueOrThrow({ where: { id }, select: { email: true } })
        const codeValue = await redisZero.get(result.email)
        return codeValue === code
      }
      catch (err) {
        logger.error(err)
        return false
      }
    }
  },
}

export default authService
