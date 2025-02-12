import { sendVerificationCode } from '../utils/email' // 导入单例邮件服务实例
import logger from '../utils/logger'
import { redisZero } from '../utils/redis'

const authService = {

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

  async verificationCode(email: string, code: string): Promise<boolean> {
    const codeValue = await redisZero.get(email)
    return codeValue === code
  },
}

export default authService
