import type { NextFunction, Request, Response } from 'express'
import taskService from '../services/taskService'
import { resHandler } from '../utils/resHandler'

const taskController = {

  /**
   * 创建任务控制器
   * @param req
   * @param res
   * @param _next
   */
  async createTask(req: Request, res: Response, _next: NextFunction) {
    if (await taskService.createTask(res.locals.userId, req.body.title, req.body.priority, req.body.remark)) {
      resHandler(res, 200, true, 'creationSuccess')
      return
    }
    resHandler(res, 500, false, 'creationFailed')
  },
}

export default taskController
