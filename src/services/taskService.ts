import { v7 as uuidv7 } from 'uuid'
import logger from '../utils/logger'
import prisma from '../utils/prisma'

const taskService = {


  /**
   * 获取用户所有任务
   * @param userId 用户id
   * @returns 
   */
  async getAllTasks(userId:string){
    try{
      const result  = await prisma.task.findMany({where:{own_user_id:userId}})
      return result
    }catch(err){
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
   * @returns 
   */
  async modifyTask(userId: string, taskId: string, title: string, priority: -2 | -1 | 0 | 1 | 2 = 0, remark: string) {
    try {
      const result = await prisma.task.findUnique({ where: { id: taskId,}, select: {own_user_id:true} })
      if (result && result.own_user_id !== userId) {
        return 'noSuchTask'
      }
      const data = await prisma.task.update({ where: { id: taskId }, data: { title, priority, remark } })
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
