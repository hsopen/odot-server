import type { NextFunction, Request, Response } from 'express'
import multer from 'multer'
import taskService from '../services/taskService'
import { resHandler } from '../utils/resHandler'

const taskController = {

  async uploadTaskAttachment(req: Request, res: Response, _next: NextFunction) {
    const storage = multer.memoryStorage()
    const upload = multer({ storage })

    // 处理文件上传
    upload.single('file')(req, res, async (err) => {
      if (err) {
        return resHandler(res, 400, false, 'Error uploading file')
      }

      // 获取文件 buffer 和原始文件名
      const fileBuffer = req.file?.buffer
      const originalFileName = req.file?.originalname
      const taskId = req.body.taskId // 从 form-data 获取 taskId
      if (!taskId) {
        return resHandler(res, 404, false, 'taskIdIsEmpty')
      }
      // 验证是否获取到了必要的数据
      if (!fileBuffer || !originalFileName) {
        return resHandler(res, 400, false, 'No file uploaded')
      }
      if (!taskId) {
        return resHandler(res, 400, false, 'Task ID is required')
      }

      // 调用业务逻辑上传附件
      try {
        await taskService.uploadAttachment(res.locals.userId, taskId, fileBuffer, originalFileName)
        return resHandler(res, 200, true, 'File uploaded successfully')
      }
      catch (error) {
        console.error('Error uploading attachment:', error)
        return resHandler(res, 500, false, 'Error processing the attachment')
      }
    })
  },

  /**
   * 获取今日的预定任务
   * @param req
   * @param res
   * @param _next
   */
  async getTodayTasks(req: Request, res: Response, _next: NextFunction) {
    try {
      const { todayCompleted, todayIncomplete } = await taskService.getTodayTasks(res.locals.userId, req.query.timeZone as string)
      resHandler(res, 200, true, 'successFetched', { todayCompleted, todayIncomplete })
    }
    catch {
      resHandler(res, 500, false, 'failedToRetrieve')
    }
  },

  /**
   * 修改任务完成状态
   * @param req
   * @param res
   * @param _next
   */
  async updateTaskStatus(req: Request, res: Response, _next: NextFunction) {
    const result = await taskService.updateTaskStatus(res.locals.userId, req.body.taskId, req.body.status)
    if (!result) {
      resHandler(res, 500, false, 'modificationFailed')
      return
    }
    resHandler(res, 200, true, 'modifySuccess')
  },

  /**
   * 获取所有任务
   * @param req
   * @param res
   * @param _next
   */
  async getAllTasks(req: Request, res: Response, _next: NextFunction) {
    const result = await taskService.getAllTasks(res.locals.userId, req.query.cursor as string)
    if (result === 'queryFailed') {
      resHandler(res, 500, false, 'fetchFailure')
    }
    else {
      resHandler(res, 200, true, '获取成功', result)
    }
  },

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
      req.body.tag,
      req.body.scheduled_task_time,
      req.body.rrule,
    )
    if (result === 'modificationFailed') {
      resHandler(res, 500, false, 'modificationFailed')
    }
    else if (result === 'noSuchTask') {
      resHandler(res, 404, false, 'noSuchTask')
    }
    else {
      resHandler(res, 200, true, 'modifySuccess', result)
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
