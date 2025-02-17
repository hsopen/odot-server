import type { NextFunction, Request, Response } from 'express'
import { body, validationResult } from 'express-validator'

export const emailValidator = [
  body('email')
    .isEmail()
    .withMessage('please provide a valid email address'),
]

export const passwordValidator = [
  body('password')
    .isLength({ min: 6, max: 32 })
    .withMessage('please provide a valid password'),
]

export const rememberToLogInValidator = [
  body('remember')
    .isBoolean()
    .withMessage('please provide true or false'),
]

/**
 * 捕获req中的错误
 * @param req
 * @param res
 * @param next
 */
export function handleValidationErrors(req: Request, res: Response, next: NextFunction): void {
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    // 处理嵌套错误结构
    const errorData = errors.array().reduce((acc: Record<string, string>, error) => {
      if (error.type === 'field') { // 标准字段校验错误
        acc[error.path] = error.msg
      }
      // 可以继续处理其他类型错误
      return acc
    }, {})

    res.status(400).json({
      status: false,
      msg: 'Form Format Error',
      data: errorData,
    })
    return
  }
  next()
}
