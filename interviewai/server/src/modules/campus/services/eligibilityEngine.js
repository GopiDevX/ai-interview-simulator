const StudentProfile = require('../models/StudentProfile')
const Drive = require('../models/Drive')

/**
 * Eligibility Engine
 * Evaluates student profiles against structured drive criteria:
 * - Minimum CGPA
 * - Maximum allowable backlogs
 * - Allowed branches (e.g. ['CSE', 'IT'])
 * - Target graduation batch year
 */
class EligibilityEngine {
  /**
   * Check single student against drive rules
   * @param {Object} student - StudentProfile
   * @param {Object} rules - Drive eligibility rules
   * @returns {{ isEligible: boolean, reasons: string[] }}
   */
  evaluateStudent(student, rules = {}) {
    const reasons = []
    const minCgpa = rules.minCgpa !== undefined ? rules.minCgpa : 0
    const maxBacklogs = rules.maxBacklogs !== undefined ? rules.maxBacklogs : 0
    const allowedBranches = rules.allowedBranches || []
    const targetBatchYear = rules.batchYear

    // 1. CGPA check
    if (student.cgpa < minCgpa) {
      reasons.push(`CGPA (${student.cgpa}) is below the required threshold of ${minCgpa}`)
    }

    // 2. Backlogs check
    if (student.backlogs > maxBacklogs) {
      reasons.push(`Active backlogs (${student.backlogs}) exceed maximum allowed (${maxBacklogs})`)
    }

    // 3. Branch / Department check
    if (allowedBranches.length > 0) {
      const studentDept = (student.department || '').toUpperCase()
      const normalizedAllowed = allowedBranches.map(b => b.toUpperCase())
      if (!normalizedAllowed.includes(studentDept)) {
        reasons.push(`Branch '${student.department}' is not in eligible branches [${allowedBranches.join(', ')}]`)
      }
    }

    // 4. Batch Year check
    if (targetBatchYear && student.batchYear !== targetBatchYear) {
      reasons.push(`Batch year (${student.batchYear}) does not match drive requirement (${targetBatchYear})`)
    }

    return {
      isEligible: reasons.length === 0,
      reasons
    }
  }

  /**
   * Compute all eligible students for a drive
   * @param {string} driveId
   * @param {string} institutionId
   * @returns {Promise<{ eligibleCount: number, eligibleStudents: Array, inEligibleCount: number }>}
   */
  async computeEligiblePool(driveId, institutionId) {
    const drive = await Drive.findOne({ driveId, institutionId })
    if (!drive) throw new Error('Drive not found')

    const students = await StudentProfile.find({ institutionId })
    const eligibleStudents = []
    let inEligibleCount = 0

    for (const student of students) {
      const evaluation = this.evaluateStudent(student, drive.eligibilityRules)
      if (evaluation.isEligible) {
        eligibleStudents.push({
          studentProfileId: student._id.toString(),
          rollNumber: student.rollNumber,
          name: student.name,
          email: student.email,
          department: student.department,
          cgpa: student.cgpa,
          readinessScore: student.readinessScore,
          readinessTier: student.readinessTier
        })
      } else {
        inEligibleCount++
      }
    }

    // Update drive cached count
    drive.totalEligible = eligibleStudents.length
    await drive.save().catch(() => null)

    return {
      eligibleCount: eligibleStudents.length,
      eligibleStudents,
      inEligibleCount
    }
  }
}

module.exports = new EligibilityEngine()
