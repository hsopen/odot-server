import type { NextFunction, Request, Response } from 'express'
import taskService from '../services/taskService'
import { resHandler } from '../utils/resHandler'

const taskController = {

  /**
   * 修改任务控制器
   * @param req 
   * @param res 
   * @param _next 
   */
  async modifyTask(req: Request, res: Response, _next: NextFunction) {
    const result = await taskService.modifyTask(
      res.locals.userId,
      req.body.taskId,
      req.body.title,
      req.body.priority,
      req.body.remark,
    )
    if (result === 'modificationFailed') {
      resHandler(res, 500, false, 'modificationFailed')
      return
    }else if(result === 'noSuchTask'){
      resHandler(res,404,false,'noSuchTask')
      return
    }else{
      resHandler(res,200,true,'modifySuccess',result)
    }
  },

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
