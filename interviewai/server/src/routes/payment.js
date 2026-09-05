const express = require('express')
const { createCheckoutSession } = require('../controllers/paymentController')
const { authenticateToken } = require('../middleware/auth')

const router = express.Router()

router.post('/create-checkout-session', authenticateToken, createCheckoutSession)

module.exports = router
