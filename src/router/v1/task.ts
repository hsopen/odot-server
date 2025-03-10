import express from 'express'
import taskController from '../../controllers/taskController'
import { getUserIdFromToken } from './middleware/authMiddleware'

const router = express.Router()

/**
 * 获取附件预签名链接
 */
router.post('/downloadAttachment', getUserIdFromToken, taskController.downloadAttachment)

/**
 * 删除附件
 */
router.post('/deleteTaskAttachment', getUserIdFromToken, taskController.deleteTaskAttachment)

/**
 * 上传附件
 */
router.put('/uploadTaskAttachment', getUserIdFromToken, taskController.uploadTaskAttachment)

/**
 * 获取今日任务
 */
router.get('/getTodayTasks', getUserIdFromToken, taskController.getTodayTasks)

/**
 * 修改任务完成状态
 */
router.post('/updateTaskStatus', getUserIdFromToken, taskController.updateTaskStatus)

/**
 * 获取所有任务
 */
router.get('/getAllTasks', getUserIdFromToken, taskController.getAllTasks)

/**
 * 修改任务
 */
router.post('/modifyTask', getUserIdFromToken, taskController.modifyTask)

/**
 * 创建新任务
 */
router.post('/createTask', getUserIdFromToken, taskController.createTask)

export default router
