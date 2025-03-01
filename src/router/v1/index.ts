import express from 'express'
import auth from './auth'
import task from './task'
import user from './user'

const router = express.Router()

router.use('/auth', auth)
router.use('/user', user)
router.use('/task', task)

export default router
