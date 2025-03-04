import { v7 as uuidv7 } from 'uuid'
import logger from '../utils/logger'
import prisma from '../utils/prisma'

const taskService = {

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
  async getAllTasks(userId: string) {
    try {
      const result = await prisma.task.findMany({ where: { own_user_id: userId } })
      return result
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
