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
  REDIS_TLS: env.get('REDIS_TLS').required().asJsonObject(),

  EMAIL_EXPIRATION_TIME: env.get('EMAIL_EXPIRATION_TIME').required().asInt(),
  VERIFICATION_CODE_SENDING_INTERVAL: env.get('VERIFICATION_CODE_SENDING_INTERVAL').required().asInt(),
  JWT_SECRET_KEY: env.get('JWT_SECRET_KEY').required().asString(),
  JWT_EXPIRATION_TIME: env.get('JWT_EXPIRATION_TIME').required().asInt(),
  JWT_TOKEN_COOKIE_MAX_AGE: env.get('JWT_TOKEN_COOKIE_MAX_AGE').required().asInt(),
  COOKIE_HTTP_ONLY: env.get('COOKIE_HTTP_ONLY').required().asBoolStrict(),
  COOKIE_SECURE: env.get('COOKIE_SECURE').required().asBoolStrict(),
  COOKIE_SAME_SITE: env.get('COOKIE_SAME_SITE').required().asEnum(['strict', 'lax', 'none']),

  S3_ID: env.get('S3_ID').required().asString(),
  S3_SECRET: env.get('S3_SECRET').required().asString(),
  S3_REGION: env.get('S3_REGION').required().asString(),
  S3_BUCKET: env.get('S3_BUCKET').required().asString(),

  CORS: env.get('CORS').required().asUrlString(),
}
