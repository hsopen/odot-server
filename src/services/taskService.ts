import type { Buffer } from 'node:buffer'
import crypto from 'node:crypto'
import { Prisma } from '@prisma/client'
import { endOfDay, startOfDay } from 'date-fns'
import { fromZonedTime, toZonedTime } from 'date-fns-tz'
import { v7 as uuidv7 } from 'uuid'
import logger from '../utils/logger'
import prisma from '../utils/prisma'
import s3Service from './S3Service'

const taskService = {

  /**
   * 搜索任务
   * @param userId 用户id
   * @param query 查询字符串
   * @param cursor 上一个任务id
   * @param take 一次多少个
   */
  async searchTasks(
    userId: string,
    query: string,
    cursor?: string,
    take: number = 10,
  ): Promise<{
      tasks: any[]
      nextCursor: string | null
      count: number
    }> {
    try {
      if (!query.trim()) {
        return {
          tasks: [],
          nextCursor: null,
          count: 0,
        }
      }

      // 创建搜索条件数组
      const searchConditions: Prisma.taskWhereInput[] = [
        { title: { contains: query, mode: 'insensitive' } },
        { remark: { contains: query, mode: 'insensitive' } },
        { tag: { has: query } }, // 检查标签数组中是否包含查询字符串
      ]

      // 查询匹配的任务
      const result = await prisma.task.findMany({
        where: {
          AND: [
            { own_user_id: userId },
            {
              OR: searchConditions,
            },
          ],
        },
        cursor: cursor ? { id: cursor } : undefined,
        take,
        skip: cursor ? 1 : 0,
        orderBy: {
          creation_time: 'desc',
        },
      })

      // 获取总匹配数
      const count = await prisma.task.count({
        where: {
          AND: [
            { own_user_id: userId },
            {
              OR: searchConditions,
            },
          ],
        },
      })

      return {
        tasks: result,
        nextCursor: result.length > 0 ? result[result.length - 1].id : null,
        count,
      }
    }
    catch (err) {
      logger.error('搜索任务失败:', err)
      return {
        tasks: [],
        nextCursor: null,
        count: 0,
      }
    }
  },

  /**
   * 获取指定日期范围内的任务
   * @param userId 用户id
   * @param startDate 开始日期
   * @param endDate 结束日期
   * @param timeZone 时区
   * @returns 返回指定日期范围内的任务记录
   */
  async getTasksByDateRange(userId: string, startDate: Date, endDate: Date, timeZone: string) {
    try {
      // 将输入的日期转换为传入时区的时间
      const zonedStartDate = toZonedTime(startDate, timeZone)
      const zonedEndDate = toZonedTime(endDate, timeZone)

      // 获取传入时区的开始日期的开始时间和结束日期的结束时间
      const startOfDayZoned = startOfDay(zonedStartDate)
      const endOfDayZoned = endOfDay(zonedEndDate)

      // 将时区时间转换为 UTC 时间，以便与数据库中的 timestamptz 字段比较
      const startOfDayUTC = fromZonedTime(startOfDayZoned, timeZone)
      const endOfDayUTC = fromZonedTime(endOfDayZoned, timeZone)

      // 查询指定日期范围内的任务记录
      const tasks = await prisma.task.findMany({
        where: {
          own_user_id: userId,
          scheduled_task_time: {
            gte: startOfDayUTC.toISOString(),
            lte: endOfDayUTC.toISOString(),
          },
        },
        select: {
          id: true,
          title: true,
          scheduled_task_time: true,
          status: true,
          priority: true,
        },
        orderBy: [
          {
            scheduled_task_time: 'asc',
          },
          {
            priority: 'desc',
          },
        ],
      })

      return {
        tasks,
        count: tasks.length,
      }
    }
    catch (err) {
      logger.error('获取日期范围内的任务失败:', err)
      return {
        tasks: [],
        count: 0,
        error: '查询失败',
      }
    }
  },

  async retrieveImportantTasks(userId: string, cursor?: string, take: number = 10) {
    const result = await prisma.task.findMany({
      where: {
        own_user_id: userId,
        status: false,
        priority: {
          gt: 0, // 筛选 priority 大于 0 的任务
        },
      },
      orderBy: [
        {
          priority: 'desc', // 1. priority 从大到小排序
        },
        {
          scheduled_task_time: {
            sort: 'asc', // 2. scheduled_task_time 从旧到新排序
            nulls: 'last', // 将 null 值放在最后
          },
        },
        {
          creation_time: 'asc', // 3. creation_time 从旧到新排序
        },
      ],
      cursor: cursor ? { id: cursor } : undefined,
      take, // 每次获取的记录数
      skip: cursor ? 1 : 0, // 如果提供了 cursor，则跳过该记录
    })

    return {
      tasks: result,
      nextCursor: result.length > 0 ? result[result.length - 1].id : null,
    }
  },

  /**
   * 下载任务附件
   * @param userId 用户id
   * @param filePath
   * @returns 返回结果
   */
  async downloadAttachment(userId: string, filePath: string) {
    const reFilePath = `${userId}/${filePath.includes('/') ? filePath.split('/').slice(1).join('/') : filePath}`
    const result = await s3Service.getFileSignature(reFilePath)
    return result
  },

  /**
   * 删除任务附件
   * @param userId 用户id
   * @param taskId 任务id
   * @param filePath 文件路径
   */
  async deleteTaskAttachment(userId: string, taskId: string, filePath: string) {
    // 删除 S3 中的文件
    await s3Service.deleteFile(filePath)

    // 获取当前的 attachments_path
    const task = await prisma.task.findUnique({
      where: { id: taskId, own_user_id: userId },
      select: { attachments_path: true },
    })

    if (!task) {
      throw new Error('Task not found')
    }

    // 确保 attachments_path 是数组
    let attachmentsPath: { attachmentsName: string, attachments_path: string }[] = []

    if (task.attachments_path && typeof task.attachments_path === 'object') {
      try {
        attachmentsPath = Array.isArray(task.attachments_path)
          ? task.attachments_path as { attachmentsName: string, attachments_path: string }[]
          : []
      }
      catch (error) {
        console.error('Error parsing attachments_path:', error)
      }
    }

    // 过滤掉匹配的文件路径
    const updatedAttachments = attachmentsPath.filter(
      attachment => attachment.attachments_path !== filePath,
    )

    // 更新数据库中的 attachments_path
    const resutl = await prisma.task.update({
      where: { id: taskId },
      data: { attachments_path: updatedAttachments.length ? updatedAttachments as any : Prisma.JsonNull },
    })
    return resutl
  },

  /**
   * 上传任务附件
   * @param userId 用户id
   * @param taskId 任务id
   * @param fileBuffer 文件
   * @param originalFileName 文件名字
   */
  async uploadAttachment(userId: string, taskId: string, fileBuffer: Buffer, originalFileName: string) {
    try {
      // 计算文件 MD5 值
      const md5 = crypto.createHash('md5').update(fileBuffer).digest('hex')

      // 生成文件路径
      const fileName = originalFileName || 'unknown_file'
      const path = `${userId}/tasks/${taskId}/${md5}_${fileName}`

      // 上传到 S3
      await s3Service.uploadFile(path, fileBuffer, 5 * 1024 * 1024)

      const newAttachment = {
        attachmentsName: fileName,
        attachments_path: path,
      }

      // 获取当前 attachments_path
      const task = await prisma.task.findUnique({
        where: { id: taskId, own_user_id: userId },
        select: { attachments_path: true },
      })

      let updatedAttachments = []

      // 如果 task 存在且 attachments_path 为空或者不是数组
      if (task?.attachments_path) {
        if (Array.isArray(task.attachments_path)) {
          // 处理 attachments_path 是数组的情况
          updatedAttachments = [...task.attachments_path, newAttachment]
        }
        else {
          // 处理 attachments_path 非数组的情况，初始化为数组并添加附件
          updatedAttachments = [newAttachment]
        }
      }
      else {
        // 如果 attachments_path 为 null 或 undefined，初始化为空数组并添加附件
        updatedAttachments = [newAttachment]
      }

      // 更新数据库
      await prisma.task.update({
        where: { id: taskId, own_user_id: userId },
        data: {
          attachments_path: updatedAttachments,
        },
      })

      return updatedAttachments
    }
    catch (error) {
      console.error('Error updating attachments:', error)
      return false
    }
  },

  // 获取当天的任务
  async getTodayTasks(userId: string, timeZone: string) {
    // 获取当前时间
    const now = new Date()

    // 将当前时间转换为传入时区的时间
    const zonedNow = toZonedTime(now, timeZone)

    // 获取传入时区的当天开始和结束时间
    const startOfDayZoned = startOfDay(zonedNow)
    const endOfDayZoned = endOfDay(zonedNow)

    // 将时区时间转换为 UTC 时间，以便与数据库中的 timestamptz 字段比较
    const startOfDayUTC = fromZonedTime(startOfDayZoned, timeZone)
    const endOfDayUTC = fromZonedTime(endOfDayZoned, timeZone)

    // 查询当天的记录
    const todayCompleted = await prisma.task.findMany({
      where: {
        own_user_id: userId,
        status: true,
        scheduled_task_time: {
          gte: startOfDayUTC.toISOString(),
          lte: endOfDayUTC.toISOString(),
        },
      },
    })

    const todayIncomplete = await prisma.task.findMany({
      where: {
        own_user_id: userId,
        status: false,
        scheduled_task_time: {
          gte: startOfDayUTC.toISOString(),
          lte: endOfDayUTC.toISOString(),
        },
      },
    })
    return { todayCompleted, todayIncomplete }
  },

  /**
   * 修改任务完成状态
   * @param userId 用户id
   * @param taskId 任务id
   * @param status 状态
   */
  async updateTaskStatus(userId: string, taskId: string, status: boolean): Promise<boolean> {
    try {
      await prisma.task.update({
        where: {
          id: taskId,
          own_user_id: userId,
        },
        data: {
          status,
        },
      })
      return true
    }
    catch (err) {
      logger.error(err)
      return false
    }
  },

  /**
   * 获取用户所有任务
   * @param userId 用户id
   */
  async getAllTasks(userId: string, cursor?: string, take: number = 10) {
    try {
      const result = await prisma.task.findMany({
        where: {
          own_user_id: userId,
        },
        cursor: cursor ? { id: cursor } : undefined, // 如果提供了cursor，则从该记录开始获取
        take, // 每次获取的记录数
        skip: cursor ? 1 : 0, // 如果提供了cursor，则跳过该记录
        orderBy: [
          {

            creation_time: 'desc',
          },
          {
            scheduled_task_time: 'asc',
          },
        ],
      })

      // 返回结果以及最后一个记录的id，用于下一次请求的cursor
      return {
        tasks: result,
        nextCursor: result.length > 0 ? result[result.length - 1].id : null,
      }
    }
    catch (err) {
      logger.error(err)
      return 'queryFailed'
    }
  },

  /**
   * 修改任务
   * @param userId 用户id
   * @param taskId 任务id
   * @param title 标题
   * @param priority 优先级
   * @param remark 备注
   * @param tag 任务标签
   */
  async modifyTask(
    userId: string,
    taskId: string,
    title: string,
    priority: -2 | -1 | 0 | 1 | 2 = 0,
    remark: string,
    tag: string[],
    scheduledTaskTime: Date,
    rrule: string,
  ) {
    try {
      const result = await prisma.task.findUnique({ where: { id: taskId }, select: { own_user_id: true } })
      if (result && result.own_user_id !== userId) {
        return 'noSuchTask'
      }
      const data = await prisma.task.update({
        where: {
          id: taskId,
        },
        data: {
          title,
          priority,
          remark,
          tag,
          update_time: new Date(),
          scheduled_task_time: scheduledTaskTime,
          rrule,
        },
      })
      return data
    }
    catch (err) {
      logger.error(err)
      return 'modificationFailed'
    }
  },

  /**
   * 创建任务
   * @param userId 用户id
   * @param title 标题
   * @param priority 任务优先级
   * @param remark 备注
   * @returns 成功或失败
   */
  async createTask(
    userId: string,
    title: string,
    priority: -2 | -1 | 0 | 1 | 2 = 0,
    scheduled_task_time: Date,
  ): Promise<boolean> {
    try {
      const id = uuidv7()
      await prisma.task.create({
        data: {
          id,
          own_user_id: userId,
          title,
          status: false,
          priority,
          creation_time: new Date(),
          update_time: new Date(),
          scheduled_task_time,
        },
      })
      return true
    }
    catch (err) {
      logger.error(err)
      return false
    }
  },
}
export default taskService
