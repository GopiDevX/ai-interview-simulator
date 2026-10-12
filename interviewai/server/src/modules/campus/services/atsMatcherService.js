const ragService = require('../../../services/ragService')

/**
 * ATS and Job Description Matching Service
 * Uses semantic embeddings and keyword extraction to score a candidate's resume
 * against a company's Job Description, highlighting exact skill gaps and strengths.
 */
class AtsMatcherService {
  /**
   * Score resume text against a Job Description
   * @param {string} resumeText
   * @param {string} jdText
   * @param {string[]} requiredSkills
   * @returns {Promise<{ matchScore: number, matchedSkills: string[], missingSkills: string[], explanation: string }>}
   */
  async matchResumeToJd(resumeText = '', jdText = '', requiredSkills = []) {
    if (!resumeText || !jdText) {
      return {
        matchScore: 0,
        matchedSkills: [],
        missingSkills: requiredSkills || [],
        explanation: 'Insufficient resume or job description content to perform ATS matching.'
      }
    }

    const normResume = resumeText.toLowerCase()
    const normJd = jdText.toLowerCase()

    // 1. Skill Extraction & Overlap
    const standardTechKeywords = [
      'react', 'nodejs', 'javascript', 'typescript', 'python', 'java', 'c++',
      'mongodb', 'postgresql', 'mysql', 'redis', 'docker', 'kubernetes', 'aws',
      'azure', 'gcp', 'git', 'rest', 'graphql', 'ci/cd', 'microservices',
      'html', 'css', 'tailwind', 'redux', 'express', 'spring boot', 'kafka'
    ]

    const targetSkills = requiredSkills && requiredSkills.length > 0
      ? requiredSkills.map(s => s.toLowerCase().trim())
      : standardTechKeywords.filter(kw => normJd.includes(kw))

    const matchedSkills = []
    const missingSkills = []

    for (const skill of targetSkills) {
      // Check word boundary match in resume
      const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
      if (regex.test(normResume)) {
        matchedSkills.push(skill)
      } else {
        missingSkills.push(skill)
      }
    }

    const keywordMatchRatio = targetSkills.length > 0
      ? matchedSkills.length / targetSkills.length
      : 0.5

    // 2. Semantic Embedding Cosine Similarity between Resume Summary & JD Core
    let semanticSimilarity = 0.6
    try {
      const resumeSnippet = resumeText.slice(0, 1200)
      const jdSnippet = jdText.slice(0, 1200)
      const [resumeVec, jdVec] = await ragService.embedChunks([resumeSnippet, jdSnippet])
      if (resumeVec && jdVec) {
        semanticSimilarity = Math.max(0, ragService.cosineSimilarity(resumeVec, jdVec))
      }
    } catch {
      semanticSimilarity = 0.65
    }

    // 3. Composite ATS Score (60% Skill Match, 40% Semantic Alignment)
    const rawScore = (keywordMatchRatio * 0.60) + (semanticSimilarity * 0.40)
    const matchScore = Math.min(100, Math.round(rawScore * 100))

    // 4. Generate Explainable Summary
    let explanation = `Resume aligns with ${matchedSkills.length} of ${targetSkills.length} target competencies (${matchScore}% match). `
    if (missingSkills.length > 0) {
      explanation += `Key gaps detected: Candidate has not demonstrated experience in [${missingSkills.slice(0, 5).join(', ')}].`
    } else {
      explanation += `Excellent coverage across all core technical requirements stated in the job description.`
    }

    return {
      matchScore,
      matchedSkills,
      missingSkills,
      explanation
    }
  }
}

module.exports = new AtsMatcherService()
