import Redis from 'ioredis'
import getEnv from './getEnv'

/**
 * 存储注册验证码
 */
const redisZero = new Redis({
  host: getEnv.REDIS_HOST,
  port: getEnv.REDIS_PORT,
  username: getEnv.REDIS_USERNAME,
  password: getEnv.REDIS_PASSWORD,
  db: 0,
  tls: getEnv.REDIS_TLS,
})

/**
 * 注册验证码api请求速率控制
 */
const redisOne = new Redis({
  host: getEnv.REDIS_HOST,
  port: getEnv.REDIS_PORT,
  username: getEnv.REDIS_USERNAME,
  password: getEnv.REDIS_PASSWORD,
  db: 1,
  tls: getEnv.REDIS_TLS,
})

/**
 * 存储修改密码验证验证码
 */
const redisTwo = new Redis({
  host: getEnv.REDIS_HOST,
  port: getEnv.REDIS_PORT,
  username: getEnv.REDIS_USERNAME,
  password: getEnv.REDIS_PASSWORD,
  db: 2,
  tls: getEnv.REDIS_TLS,
})

export { redisOne, redisTwo, redisZero }
