import dotenv from 'dotenv'
import env from 'env-var'

dotenv.config()

export default {
  PORT: env.get('PORT').required().asPortNumber(),
  SMTP_USER: env.get('SMTP_USER').required().asString(),
  SMTP_PASSWORD: env.get('SMTP_PASSWORD').required().asString(),
  SMTP_HOST: env.get('SMTP_HOST').required().asString(),
  SMTP_PORT: env.get('SMTP_PORT').required().asPortNumber(),
  SMTP_SECURE: env.get('SMTP_SECURE').required().asBoolStrict(),
}
