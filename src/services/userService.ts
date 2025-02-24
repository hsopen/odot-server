import { createHash, randomBytes } from 'node:crypto'
import { PrismaClient } from '@prisma/client'
import { v7 as uuidv7 } from 'uuid'
import logger from '../utils/logger'

const prisma = new PrismaClient()
const userService = {

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
function generateHashPassword(str: string): string {
  return createHash('sha256').update(str).digest('hex')
}

export default userService
