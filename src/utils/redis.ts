import Redis from 'ioredis'
import getEnv from './getEnv'

// 配置 Redis 连接信息
const redisZero = new Redis({
  host: getEnv.REDIS_HOST,
  port: getEnv.REDIS_PORT,
  username: getEnv.REDIS_USERNAME,
  password: getEnv.REDIS_PASSWORD,
  db: 0,
  tls: getEnv.REDID_TLS,
})

const redisOne = new Redis({
  host: getEnv.REDIS_HOST,
  port: getEnv.REDIS_PORT,
  username: getEnv.REDIS_USERNAME,
  password: getEnv.REDIS_PASSWORD,
  db: 1,
  tls: getEnv.REDID_TLS,
})

export { redisOne, redisZero }
