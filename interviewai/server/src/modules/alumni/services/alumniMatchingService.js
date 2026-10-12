const ragService = require('../../../services/ragService')
const AlumniProfile = require('../models/AlumniProfile')

/**
 * Mentor Matching Service
 * Computes semantic similarity between student career aspirations & goals
 * and alumni expertise, returning a ranked recommendation list with explanations.
 */
class AlumniMatchingService {
  /**
   * Find best mentor matches for a student's stated goals
   * @param {string} studentGoals - e.g. "Seeking SDE 1 roles at Google, focusing on System Design and Distributed Caching"
   * @param {string} institutionId
   * @param {number} topK
   */
  async matchMentors(studentGoals, institutionId, topK = 5) {
    const mongoose = require('mongoose')
    let verifiedAlumni = []

    if (mongoose.connection.readyState === 1) {
      try {
        verifiedAlumni = await AlumniProfile.find({
          institutionId,
          isVerified: true
        }).maxTimeMS(2000).lean()
      } catch (e) {
        verifiedAlumni = []
      }
    }

    if (!verifiedAlumni || verifiedAlumni.length === 0) {
      const { inMemoryAlumni } = require('./inMemoryAlumniStore')
      verifiedAlumni = inMemoryAlumni.filter(a => a.isVerified)
    }

    if (!verifiedAlumni || verifiedAlumni.length === 0) {
      return []
    }

    if (!studentGoals || studentGoals.trim().length === 0) {
      return verifiedAlumni.slice(0, topK).map(a => ({
        alumni: a,
        matchScore: 75,
        explanation: 'Top-rated verified alumni in Software Engineering.'
      }))
    }

    // Embed student goals
    const [goalEmbedding] = await ragService.embedChunks([studentGoals])
    if (!goalEmbedding) {
      return verifiedAlumni.slice(0, topK).map(a => ({ alumni: a, matchScore: 70, explanation: 'Matched by domain.' }))
    }

    // Embed alumni profiles representation
    const profileTexts = verifiedAlumni.map(a => {
      const tags = (a.expertiseTags || []).join(', ')
      return `Alumni: ${a.name}. Company: ${a.company}. Role: ${a.role}. Domain: ${a.domain}. Expertise: ${tags}. Bio: ${a.bio || ''}`
    })

    const alumniEmbeddings = await ragService.embedChunks(profileTexts)

    const scored = verifiedAlumni.map((alumnus, idx) => {
      const aVec = alumniEmbeddings[idx]
      let similarity = aVec ? ragService.cosineSimilarity(goalEmbedding, aVec) : 0.5

      // Slight boost if target company name is explicitly mentioned in student goals
      if (studentGoals.toLowerCase().includes(alumnus.company.toLowerCase())) {
        similarity = Math.min(1.0, similarity + 0.15)
      }

      const matchScore = Math.round(Math.max(0, similarity) * 100)

      // Generate explainable reason
      const sharedKeywords = (alumnus.expertiseTags || []).filter(tag =>
        studentGoals.toLowerCase().includes(tag.toLowerCase())
      )

      let explanation = `Matched at ${alumnus.company} in ${alumnus.role}. `
      if (sharedKeywords.length > 0) {
        explanation += `Direct expertise overlap on [${sharedKeywords.join(', ')}].`
      } else {
        explanation += `High semantic correlation with candidate's target role trajectory.`
      }

      return {
        alumni: alumnus,
        matchScore,
        explanation
      }
    })

    scored.sort((a, b) => b.matchScore - a.matchScore)
    return scored.slice(0, topK)
  }
}

module.exports = new AlumniMatchingService()
