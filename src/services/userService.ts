import { createHash, randomBytes } from 'node:crypto'
import { PrismaClient } from '@prisma/client'
import { v7 as uuidv7 } from 'uuid'
import logger from '../utils/logger'

const prisma = new PrismaClient()
const userService = {
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
