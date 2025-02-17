import type { NextFunction, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'
import getEnv from '../../../utils/getEnv'
import logger from '../../../utils/logger'

interface JwtPayload {
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
      res.status(401).json({ message: '未提供 token，请先登录' })
      return
    }

    // 验证 token
    const decoded = jwt.verify(token, getEnv.JWT_SECRET_KEY) as JwtPayload
    logger.debug('Decoded JWT payload:', decoded)

    // 提取 JWT 签发时间
    const jwtIssueTime = decoded.iat // JWT 签发时间（秒，UTC 时间）

    // 查询用户的密码修改时间
    const prisma = new PrismaClient()
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: decoded.id },
      select: {
        password_modification_time: true,
      },
    })

    // 如果用户没有密码修改时间，直接通过
    if (!user.password_modification_time) {
      res.locals.userId = decoded.id
      logger.info(`Authenticated user: ${decoded.id}`)
      next()
      return
    }

    // 将密码修改时间转换为 Unix 时间戳（秒，UTC 时间）
    const passwordModificationTime = Math.floor(user.password_modification_time.getTime() / 1000)
    // 对比 JWT 签发时间和密码修改时间
    if (jwtIssueTime < passwordModificationTime) {
      logger.warn(`Token issued before password modification for user: ${decoded.id}`)
      res.status(401).json({
        message: 'token 无效，请重新登录',
        code: 'TOKEN_INVALID_AFTER_PASSWORD_CHANGE',
      })
      return
    }

    // 验证通过，将用户 ID 存储在 res.locals 中
    res.locals.userId = decoded.id
    logger.info(`Authenticated user: ${decoded.id}`)

    next()
  }
  catch (error) {
    logger.error('JWT verification failed:', error)

    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        message: 'token 已过期',
        code: 'TOKEN_EXPIRED',
      })
      return
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        message: '无效的 token',
        code: 'INVALID_TOKEN',
      })
      return
    }

    res.status(500).json({
      message: '服务器验证 token 失败',
      code: 'SERVER_ERROR',
    })
  }
}
