import nodemailer from 'nodemailer'
import getEnv from '../utils/getEnv'
import logger from '../utils/logger'

interface MailOptions {
  from?: string
  to: string
  subject: string
  text?: string
  html?: string
}

// 创建邮件传输器
const transporter = nodemailer.createTransport({
  host: getEnv.SMTP_HOST,
  secure: getEnv.SMTP_SECURE,
  port: getEnv.SMTP_PORT,
  auth: {
    user: getEnv.SMTP_USER,
    pass: getEnv.SMTP_PASSWORD,
  },
})

/**
 * 通用邮件发送方法
 * @param mailOptions 邮件配置选项
 */
async function sendMail(mailOptions: MailOptions): Promise<void> {
  const from = mailOptions.from || getEnv.SMTP_USER
  const formattedFrom = `ODOT Team <${from}>`

  try {
    const info = await transporter.sendMail({
      ...mailOptions,
      from: formattedFrom,
    })
    logger.info(`Message sent: ${info.messageId}`)
  }
  catch (error) {
    logger.error('Error occurred while sending email:', error)
    throw error
  }
}

/**
 * 发送验证码邮件
 * @param email 收件人邮箱地址
 * @param code 验证码
 */
async function sendVerificationCode(email: string, code: string): Promise<void> {
  await sendMail({
    to: email,
    subject: '您的验证码',
    text: `您的验证码是：${code}\n\n该验证码5分钟内有效。`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">账户验证码</h2>
        <p>您的验证码是：<strong style="font-size: 1.2em;">${code}</strong></p>
        <p style="color: #6b7280; font-size: 0.9em;">该验证码5分钟内有效，请勿泄露给他人。</p>
      </div>
    `,
  })
}

export { sendVerificationCode }
