import type { NextFunction, Request, Response } from 'express'
import { body, validationResult } from 'express-validator'

export const emailValidator = [
  body('email')
    .isEmail()
    .withMessage('请提供有效的邮箱地址'),
]

/**
 * 捕获req中的错误
 * @param req
 * @param res
 * @param next
 */
export function handleValidationErrors(req: Request, res: Response, next: NextFunction): void {
  const errors = validationResult(req)

  // 如果有验证错误，返回自定义格式的错误响应
  if (!errors.isEmpty()) {
    res.status(400).json({
      status: false,
      msg: 'Form Format Error',
      data: errors.array(),
    })
    return
  }

  // 如果没有错误，继续执行后续的中间件或控制器
  next()
}
