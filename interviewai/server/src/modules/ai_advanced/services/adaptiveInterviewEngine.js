/**
 * Adaptive Multi-Agent Interview Engine
 * - Elo-style Rating per skill topic (dynamically scales question difficulty)
 * - State machine dividing responsibilities across Interviewer, Evaluator, and Coach agents
 * - Knowledge gap detector generating targeted follow-up probes
 */
class AdaptiveInterviewEngine {
  constructor() {
    this.K_FACTOR = 32
  }

  /**
   * Update topic Elo score based on candidate answer performance
   * @param {number} currentElo - Current Elo (e.g. 1200)
   * @param {string} quality - 'weak' | 'average' | 'good' | 'excellent'
   * @returns {{ newElo: number, delta: number, recommendedDifficulty: string }}
   */
  updateTopicElo(currentElo = 1200, quality = 'good') {
    const qualityScores = {
      excellent: 1.0,
      good: 0.75,
      average: 0.50,
      weak: 0.15
    }
    const actualScore = qualityScores[quality] !== undefined ? qualityScores[quality] : 0.5

    // Expected score against a benchmark difficulty of 1200
    const expectedScore = 1 / (1 + Math.pow(10, (1200 - currentElo) / 400))
    const delta = Math.round(this.K_FACTOR * (actualScore - expectedScore))
    const newElo = Math.max(800, Math.min(1800, currentElo + delta))

    let recommendedDifficulty = 'Medium'
    if (newElo < 1150) recommendedDifficulty = 'Easy'
    else if (newElo > 1320) recommendedDifficulty = 'Hard'

    return {
      previousElo: currentElo,
      newElo,
      delta,
      recommendedDifficulty
    }
  }

  /**
   * Multi-Agent State Machine transition
   * States: 'INTERVIEWER_PROMPT' -> 'EVALUATOR_ASSESS' -> 'COACH_FEEDBACK' -> 'NEXT_ROUND'
   */
  processTurn({ currentState, candidateAnswer, topic, currentElo = 1200 }) {
    const lower = (candidateAnswer || '').toLowerCase()

    // 1. Evaluator Agent: Detect knowledge gaps
    const gaps = []
    if (lower.length < 80) {
      gaps.push('Answer lacks technical depth and elaboration.')
    }
    if (!lower.includes('because') && !lower.includes('trade-off') && !lower.includes('complexity') && !lower.includes('metric')) {
      gaps.push('Candidate did not state architectural trade-offs or measured impact.')
    }
    if (topic === 'System Design' && !lower.includes('scale') && !lower.includes('cache') && !lower.includes('database')) {
      gaps.push('Missing discussion of data persistence, throughput scaling, or caching layer.')
    }

    const quality = gaps.length === 0 ? 'excellent' : gaps.length === 1 ? 'good' : gaps.length === 2 ? 'average' : 'weak'
    const eloUpdate = this.updateTopicElo(currentElo, quality)

    // 2. Coach Agent: Actionable feedback & targeted follow-up
    let coachTip = ''
    let followUpProbe = null

    if (gaps.length > 0) {
      coachTip = `Coach Observation: Notice how you focused on the high-level concept. In senior interviews, always tie this back to: ${gaps[0]}`
      followUpProbe = `Can you specifically elaborate on how you handled the scaling bottlenecks and edge cases in that implementation?`
    } else {
      coachTip = `Strong response! You clearly articulated the rationale and trade-offs. Pushing difficulty up to ${eloUpdate.recommendedDifficulty}.`
    }

    return {
      agentRoles: {
        evaluator: {
          qualityAssessed: quality,
          gapsIdentified: gaps,
          eloUpdate
        },
        coach: {
          coachingTip: coachTip,
          suggestedFollowUp: followUpProbe
        },
        interviewer: {
          nextDifficulty: eloUpdate.recommendedDifficulty
        }
      },
      nextState: followUpProbe ? 'INTERVIEWER_FOLLOWUP' : 'NEXT_ROUND'
    }
  }
}

module.exports = new AdaptiveInterviewEngine()
