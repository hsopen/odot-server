import type { NextFunction, Request, Response } from 'express'
import multer from 'multer'
import taskService from '../services/taskService'
import { resHandler } from '../utils/resHandler'

const taskController = {

  async searchTasks(req: Request, res: Response, _next: NextFunction) {
    try {
      const query = req.query.q as string
      const cursor = req.query.cursor as string | undefined
      const take = req.query.take ? Number(req.query.take) : 10

      // Validate query parameter
      if (!query || typeof query !== 'string' || query.trim().length === 0) {
        return resHandler(res, 400, false, 'searchQueryRequired')
      }

      // Call the service layer
      const result = await taskService.searchTasks(
        res.locals.userId,
        query.trim(),
        cursor,
        take,
      )

      // Return the search results
      resHandler(res, 200, true, 'searchSuccess', {
        tasks: result.tasks,
        nextCursor: result.nextCursor,
        count: result.count,
      })
    }
    catch (error) {
      console.error('Search tasks failed:', error)
      resHandler(res, 500, false, 'searchFailed')
    }
  },

  /**
   * 获取指定日期范围内的任务控制器
   * @param req
   * @param res
   * @param _next
   */
  async getTasksByDateRange(req: Request, res: Response, _next: NextFunction) {
    try {
    // 从请求中获取开始日期、结束日期和时区
      const startDate = new Date(req.query.startDate as string)
      const endDate = new Date(req.query.endDate as string)
      const timeZone = req.query.timeZone as string || 'UTC'

      // 验证日期格式是否正确
      if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        return resHandler(res, 400, false, 'invalidDateFormat')
      }

      // 验证开始日期是否早于或等于结束日期
      if (startDate > endDate) {
        return resHandler(res, 400, false, 'startDateAfterEndDate')
      }

      // 调用服务层方法获取日期范围内的任务
      const result = await taskService.getTasksByDateRange(
        res.locals.userId,
        startDate,
        endDate,
        timeZone,
      )

      // 处理可能的错误情况
      if (result.error) {
        return resHandler(res, 500, false, 'fetchFailure', { error: result.error })
      }

      // 返回成功结果
      resHandler(res, 200, true, 'successFetched', result)
    }
    catch (error) {
      console.error('获取日期范围内的任务失败:', error)
      resHandler(res, 500, false, 'fetchFailure')
    }
  },

  async retrieveImportantTasks(req: Request, res: Response, _next: NextFunction) {
    try {
      const result = await taskService.retrieveImportantTasks(res.locals.userId, req.query.cursor as string)
      resHandler(res, 200, true, 'successAcquired', result)
    }
    catch {
      resHandler(res, 500, false, 'getFailure')
    }
  },

  /**
   * 获取下载附件
   * @param req
   * @param res
   * @param _next
   */
  async downloadAttachment(req: Request, res: Response, _next: NextFunction) {
    try {
      const result = await taskService.downloadAttachment(res.locals.userId, req.body.filePath)
      resHandler(res, 200, true, 'getDownloadLinkSuccess', result)
    }
    catch {
      resHandler(res, 500, false, 'downloadFailed')
    }
  },

  /**
   * 删除附件
   * @param req
   * @param res
   * @param _next
   */
  async deleteTaskAttachment(req: Request, res: Response, _next: NextFunction) {
    try {
      const result = await taskService.deleteTaskAttachment(res.locals.userId, req.body.taskId, req.body.filePath)
      resHandler(res, 200, true, 'deletionSuccessful', result)
    }
    catch {
      resHandler(res, 500, false, 'deleteError')
    }
  },

  /**
   * 上传文件api
   * @param req
   * @param res
   * @param _next
   */
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
      const originalFileName = decodeURIComponent(req.file?.originalname as string)
      const taskId = req.body.taskId // 从 form-data 获取 taskId
      // 验证是否获取到了必要的数据
      if (!fileBuffer || !originalFileName) {
        return resHandler(res, 400, false, 'No file uploaded')
      }
      if (!taskId) {
        return resHandler(res, 400, false, 'Task ID is required')
      }

      // 调用业务逻辑上传附件
      try {
        const result = await taskService.uploadAttachment(res.locals.userId, taskId, fileBuffer, originalFileName)
        return resHandler(res, 200, true, 'File uploaded successfully', { taskId, result })
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
    const result = await taskService.getAllTasks(res.locals.userId, req.query.cursor as string, Number(req.query.take))
    if (result === 'queryFailed') {
      resHandler(res, 500, false, 'fetchFailure')
    }
    else {
      resHandler(res, 200, true, 'successObtained', result)
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
    if (await taskService.createTask(res.locals.userId, req.body.title, req.body.priority, req.body.scheduled_task_time)) {
      resHandler(res, 200, true, 'creationSuccess')
      return
    }
    resHandler(res, 500, false, 'creationFailed')
  },
}

export default taskController
