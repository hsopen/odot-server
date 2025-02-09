import type { Response } from 'express'

export function resHandler(res: Response, statusCode: number, status: boolean, msg: string, data?: any) {
  res.status(statusCode).json({ status, msg, data })
}
