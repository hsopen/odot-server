import { endOfDay, startOfDay } from 'date-fns'
import { fromZonedTime, toZonedTime } from 'date-fns-tz'
import { v7 as uuidv7 } from 'uuid'
import logger from '../utils/logger'
import prisma from '../utils/prisma'

const taskService = {

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
            scheduled_task_time: 'asc',

          },
          {
            creation_time: 'asc',
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
  async modifyTask(userId: string, taskId: string, title: string, priority: -2 | -1 | 0 | 1 | 2 = 0, remark: string, tag: string[]) {
    try {
      const result = await prisma.task.findUnique({ where: { id: taskId }, select: { own_user_id: true } })
      if (result && result.own_user_id !== userId) {
        return 'noSuchTask'
      }
      const data = await prisma.task.update({ where: { id: taskId }, data: { title, priority, remark, tag, update_time: new Date() } })
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
    remark: string,
  ): Promise<boolean> {
    try {
      const id = uuidv7()
      await prisma.task.create({
        data: {
          id,
          own_user_id: userId,
          title,
          remark,
          status: false,
          priority,
          creation_time: new Date(),
          update_time: new Date(),
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
