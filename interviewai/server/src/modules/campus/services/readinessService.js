const Institution = require('../models/Institution')
const StudentProfile = require('../models/StudentProfile')

/**
 * Transparent Readiness Score Engine
 * Computes a weighted, auditable readiness score per student from:
 * 1. Mock Interview Performance (average score across technical/behavioral rounds)
 * 2. Coding Sandbox Performance (code score & problem completions)
 * 3. Resume & Skill Match alignment
 * 4. Completion Consistency (timely submission of faculty assignments & practice drills)
 * 
 * Weights are completely visible and customizable by the placement officer.
 */
class ReadinessService {
  /**
   * Calculate readiness score for a student
   * @param {Object} studentProfile - StudentProfile document
   * @param {Object} customWeights - Optional overrides
   * @returns {{ readinessScore: number, tier: string, breakdown: Object, weightsUsed: Object }}
   */
  async computeStudentReadiness(studentProfile, customWeights = null) {
    let weights = customWeights

    if (!weights && studentProfile.institutionId) {
      try {
        const inst = await Institution.findOne({ institutionId: studentProfile.institutionId })
        if (inst && inst.readinessWeights) {
          weights = inst.readinessWeights
        }
      } catch { /* use defaults */ }
    }

    const defaultWeights = {
      mockScore: 0.35,
      codeScore: 0.30,
      resumeJDMatch: 0.20,
      consistency: 0.15
    }
    const finalWeights = weights || defaultWeights

    // Extract raw components (normalized to 0 - 100)
    const breakdown = studentProfile.readinessBreakdown || {}
    const mockAvg = Math.min(100, Math.max(0, breakdown.mockAvg || (studentProfile.mockCount > 0 ? 70 : 0)))
    const codeScore = Math.min(100, Math.max(0, breakdown.codeScore || (studentProfile.codingProblemCount > 0 ? 65 : 0)))
    const resumeJDMatch = Math.min(100, Math.max(0, breakdown.resumeJDMatch || (studentProfile.skills?.length > 3 ? 75 : 50)))
    const consistencyScore = Math.min(100, Math.max(0, breakdown.consistencyScore || (studentProfile.verifiedByFaculty ? 85 : 60)))

    // Compute transparent weighted sum
    const rawScore = (
      (mockAvg * finalWeights.mockScore) +
      (codeScore * finalWeights.codeScore) +
      (resumeJDMatch * finalWeights.resumeJDMatch) +
      (consistencyScore * finalWeights.consistency)
    )

    const readinessScore = Math.round(rawScore)

    // Determine Tier
    let tier = 'Unassessed'
    if (studentProfile.mockCount > 0 || breakdown.mockAvg > 0) {
      if (readinessScore >= 80) {
        tier = 'Tier 1 Ready'
      } else if (readinessScore >= 65) {
        tier = 'Tier 2 Ready'
      } else {
        tier = 'Needs Training'
      }
    }

    return {
      readinessScore,
      tier,
      breakdown: {
        mockAvg,
        codeScore,
        resumeJDMatch,
        consistencyScore
      },
      weightsUsed: finalWeights
    }
  }

  /**
   * Update student document with fresh readiness calculations
   */
  async updateAndSaveStudentReadiness(studentProfileId) {
    const student = await StudentProfile.findById(studentProfileId)
    if (!student) return null

    const result = await this.computeStudentReadiness(student)
    student.readinessScore = result.readinessScore
    student.readinessTier = result.tier
    student.readinessBreakdown = result.breakdown
    await student.save()

    return student
  }
}

module.exports = new ReadinessService()
