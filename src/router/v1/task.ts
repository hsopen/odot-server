import express from 'express'
import taskController from '../../controllers/taskController'
import { getUserIdFromToken } from './middleware/authMiddleware'

const router = express.Router()

/**
 * 修改任务
 */
router.post('/modifyTask',getUserIdFromToken,taskController.modifyTask)

/**
 * 创建新任务
 */
router.post('/createTask', getUserIdFromToken, taskController.createTask)

export default router
