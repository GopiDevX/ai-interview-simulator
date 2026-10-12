const express = require('express')
const path = require('path')
const fs = require('fs')
const { authenticateToken } = require('../middleware/auth')
const Session = require('../models/mongo/Session')

const router = express.Router()
const UPLOADS_DIR = path.resolve(__dirname, '../../uploads')

/**
 * GET /api/uploads/:filename
 * Secure, authenticated download/view route for resumes and confidential docs.
 * Prevents unauthorized public viewing of student resumes.
 * Supports Authorization header or ?token= query parameter for browser viewing.
 */
router.get('/:filename', authenticateToken, async (req, res) => {
  try {
    const rawFilename = req.params.filename
    // Guard against directory traversal attacks
    const safeFilename = path.basename(rawFilename)
    if (!safeFilename || safeFilename.includes('..') || !/^[a-zA-Z0-9_\-\.]+$/.test(safeFilename)) {
      return res.status(400).json({ error: 'Invalid file parameter' })
    }

    const filePath = path.join(UPLOADS_DIR, safeFilename)

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' })
    }

    // Role-based & ownership authorization check
    const user = req.user
    const isStaffOrAdmin = ['admin', 'placement_officer', 'faculty', 'recruiter'].includes(user.role)

    if (!isStaffOrAdmin) {
      // Check if this resume belongs to one of the student's sessions
      const hasAccess = await Session.findOne({
        userId: user.id,
        $or: [
          { resumeUrl: { $regex: safeFilename } },
          { resumeUrl: `/uploads/${safeFilename}` }
        ]
      })

      if (!hasAccess) {
        return res.status(403).json({ error: 'Forbidden: You do not have permission to view this document.' })
      }
    }

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `inline; filename="${safeFilename}"`)
    res.setHeader('X-Content-Type-Options', 'nosniff')

    const fileStream = fs.createReadStream(filePath)
    fileStream.pipe(res)
  } catch (err) {
    console.error('[Uploads] Error serving protected file:', err)
    res.status(500).json({ error: 'Failed to retrieve document' })
  }
})

module.exports = router
