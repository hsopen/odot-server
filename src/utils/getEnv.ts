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

  REDIS_HOST: env.get('REDIS_HOST').required().asString(),
  REDIS_PORT: env.get('REDIS_PORT').required().asPortNumber(),
  REDIS_USERNAME: env.get('REDIS_USERNAME').required().asString(),
  REDIS_PASSWORD: env.get('REDIS_PASSWORD').required().asString(),
  REDID_TLS: env.get('REDID_TLS').required().asJsonObject(),

  EMAIL_EXPIRATION_TIME: env.get('EMAIL_EXPIRATION_TIME').required().asInt(),
  VERIFICATION_CODE_SENDING_INTERVAL: env.get('VERIFICATION_CODE_SENDING_INTERVAL').required().asInt(),
}
