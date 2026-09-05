const express = require('express')
const { register, login, refresh, getMe, googleAuth } = require('../controllers/authController')
const { authenticateToken } = require('../middleware/auth')
const { validate } = require('../middleware/validate')
const { registerSchema, loginSchema, refreshSchema } = require('../validations/authSchemas')

const router = express.Router()

router.post('/register', validate(registerSchema), register)
router.post('/login', validate(loginSchema), login)
router.post('/refresh', validate(refreshSchema), refresh)
router.post('/google', googleAuth)
router.get('/me', authenticateToken, getMe)

module.exports = router
