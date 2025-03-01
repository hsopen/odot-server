import { v7 as uuidv7 } from 'uuid'
import logger from '../utils/logger'
import prisma from '../utils/prisma'

const taskService = {
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
    remark?: string,
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
