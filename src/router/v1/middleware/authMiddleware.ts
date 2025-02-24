import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import getEnv from '../../../utils/getEnv'
import logger from '../../../utils/logger'
import prisma from '../../../utils/prisma'
import { resHandler } from '../../../utils/resHandler'

interface JwtPayload {
  email: string
  id: string
  iat: number
}

export async function getUserIdFromToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // 调试日志
    logger.debug('Cookies:', req.headers.cookie)

    // 从 Cookie 解析 token
    const cookies = req.headers.cookie?.split(';').map(c => c.trim()) || []
    const tokenCookie = cookies.find(c => c.startsWith('token='))
    const token = tokenCookie?.split('=')[1]
    if (!token) {
      logger.warn('No token found in cookies')
      return resHandler(res, 401, false, '未提供 token，请先登录')
    }

    // 验证 token
    const decoded = jwt.verify(token, getEnv.JWT_SECRET_KEY) as JwtPayload
    logger.debug('Decoded JWT payload:', decoded)

    // 提取 JWT 签发时间
    const jwtIssueTime = decoded.iat // JWT 签发时间（秒，UTC 时间）

    // 查询用户的密码修改时间
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: decoded.id },
      select: {
        certification_information_modification_time: true,
      },
    })

    // 将密码修改时间转换为 Unix 时间戳（秒，UTC 时间）
    const passwordModificationTime = Math.floor(user.certification_information_modification_time.getTime() / 1000)
    // 对比 JWT 签发时间和密码修改时间
    if (jwtIssueTime < passwordModificationTime) {
      logger.warn(`Token issued before password modification for user: ${decoded.id}`)
      return resHandler(res, 401, false, 'tokenIsInvalidPleaseLogInAgain')
    }

    // 验证通过，将用户 ID 存储在 res.locals 中
    res.locals.userId = decoded.id
    res.locals.email = decoded.email

    next()
  }
  catch (error) {
    logger.error('JWT verification failed:', error)

    if (error instanceof jwt.TokenExpiredError) {
      return resHandler(res, 401, false, 'tokenHasExpired')
    }

    if (error instanceof jwt.JsonWebTokenError) {
      return resHandler(res, 401, false, 'invalidToken')
    }

    return resHandler(res, 500, false, 'serverVerificationTokenFailed')
  }
}
