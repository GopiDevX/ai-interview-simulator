/**
 * Personalized Learning Path Generator
 * Generates a structured 4-week preparation plan by diagnosing:
 * - Candidate's resume skills
 * - Target Company Job Description
 * - Interview performance weak spots
 */
class LearningPathService {
  /**
   * Generate 4-week time-boxed curriculum
   */
  generatePath({ targetRole = 'Full Stack Developer', targetCompany = 'Google', weakTopics = [], currentReadiness = 65 }) {
    const defaultWeak = weakTopics && weakTopics.length > 0
      ? weakTopics
      : ['System Design & Microservices', 'SQL Indexing & Normalization', 'Concurrency & Deadlocks']

    const weeks = [
      {
        weekNumber: 1,
        title: 'Core Fundamentals & Algorithmic Foundations',
        focus: 'Data Structures, Arrays, Strings, Hash Maps, and Two Pointers',
        targetCompanyRelevance: `Crucial for Round 1 Online Coding Assessment at ${targetCompany}.`,
        practiceQuestions: [
          { title: 'Two Sum (Optimal HashMap)', difficulty: 'Easy', timeBudgetMinutes: 20 },
          { title: 'Longest Substring Without Repeating Characters', difficulty: 'Medium', timeBudgetMinutes: 35 },
          { title: 'LRU Cache Design', difficulty: 'Medium', timeBudgetMinutes: 45 }
        ],
        milestoneCheck: 'Score >= 70% in 1 timed algorithmic mock session.'
      },
      {
        weekNumber: 2,
        title: `Targeted Gap Remediation: ${defaultWeak[0] || 'Database Internals'}`,
        focus: `Deep dive into detected weak spot: ${defaultWeak[0] || 'Database Normalization and ACID'}.`,
        targetCompanyRelevance: `Directly targeted in technical screening rounds.`,
        practiceQuestions: [
          { title: 'Explain database transaction isolation levels (Read Committed vs Serializable)', difficulty: 'Medium', timeBudgetMinutes: 25 },
          { title: 'Design a high-throughput caching tier using Redis', difficulty: 'Hard', timeBudgetMinutes: 40 }
        ],
        milestoneCheck: 'Complete 1 AI Technical round with >= 7.5 rubric score.'
      },
      {
        weekNumber: 3,
        title: `System Architecture & Scalability: ${defaultWeak[1] || 'Distributed Systems'}`,
        focus: 'Rate limiting, horizontal scaling, message queues (Kafka), and database sharding.',
        targetCompanyRelevance: `Standard ${targetCompany} System Design bar.`,
        practiceQuestions: [
          { title: 'Design a distributed rate limiter handling 100K requests/min', difficulty: 'Hard', timeBudgetMinutes: 45 },
          { title: 'Explain microservices idempotency and outbox pattern', difficulty: 'Medium', timeBudgetMinutes: 30 }
        ],
        milestoneCheck: 'Book 1 live mock session with an Alumni Mentor.'
      },
      {
        weekNumber: 4,
        title: 'Behavioral STAR Mastery & Full Company Simulation',
        focus: 'Leadership principles, conflict resolution, production incident response, and mock interview drills.',
        targetCompanyRelevance: `${targetCompany} Cultural fit and hiring manager rounds.`,
        practiceQuestions: [
          { title: 'Describe a significant engineering mistake and how you resolved it', difficulty: 'Medium', timeBudgetMinutes: 20 },
          { title: 'Walk through your most complex technical decision and trade-offs', difficulty: 'Medium', timeBudgetMinutes: 25 }
        ],
        milestoneCheck: 'Attain Tier 1 Ready tier (Readiness Score >= 80).'
      }
    ]

    return {
      targetRole,
      targetCompany,
      startingReadinessScore: currentReadiness,
      targetReadinessScore: 85,
      estimatedWeeks: 4,
      diagnosedWeaknesses: defaultWeak,
      weeks
    }
  }
}

module.exports = new LearningPathService()
