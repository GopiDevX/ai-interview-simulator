let GoogleGenAI
try {
  GoogleGenAI = require('@google/genai').GoogleGenAI
} catch {
  GoogleGenAI = null
}
const { TOOL_DEFINITIONS, executeTool } = require('./copilotTools')

class CopilotService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY
  }

  /**
   * Process a message from user, selecting and running tools under caller JWT
   * @param {string} message - User query e.g. "What drives am I eligible for?"
   * @param {Object} user - JWT user object
   * @param {Object} confirmation - Optional confirmation flag or pending action
   */
  async chatWithCopilot(message, user, confirmation = null) {
    // 1. If this is a confirmation for a pending write action, execute immediately
    if (confirmation && confirmation.confirmed && confirmation.pendingAction) {
      const { toolName, args } = confirmation.pendingAction
      const toolResult = await executeTool(toolName, args, user, true)
      return {
        reply: toolResult.message || 'Action executed successfully.',
        toolCalled: toolName,
        toolResult,
        requiresConfirmation: false
      }
    }

    // 2. Offline / Fast Tool Classifier heuristic (ensures instant response without waiting or if offline)
    const lower = message.toLowerCase()
    let chosenTool = null
    let chosenArgs = {}

    if (
      lower.includes('eligible') ||
      lower.includes('placement drive') ||
      (lower.includes('drive') && (lower.includes('apply') || lower.includes('sit for') || lower.includes('which') || lower.includes('what')))
    ) {
      chosenTool = 'get_my_eligible_drives'
    } else if (
      lower.includes('weak') ||
      lower.includes('topic') ||
      lower.includes('improve') ||
      lower.includes('gap') ||
      lower.includes('need to improve')
    ) {
      chosenTool = 'get_my_weak_topics'
    } else if (lower.includes('book') || lower.includes('schedule') || lower.includes('slot') || lower.includes('session with a')) {
      chosenTool = 'book_mock_interview'
      chosenArgs.topic = 'Mock Technical Interview'
    } else if (lower.includes('alumni') || lower.includes('mentor')) {
      chosenTool = 'find_alumni'
      const companies = ['google', 'microsoft', 'amazon', 'accenture', 'tcs', 'infosys']
      const foundCo = companies.find(c => lower.includes(c))
      if (foundCo) chosenArgs.company = foundCo
    } else if (lower.includes('cohort') || lower.includes('heatmap') || lower.includes('stats') || lower.includes('batch performing')) {
      chosenTool = 'get_cohort_stats'
    }

    if (chosenTool) {
      const toolResult = await executeTool(chosenTool, chosenArgs, user, false)

      if (toolResult.status === 'confirmation_required') {
        return {
          reply: toolResult.message,
          toolCalled: chosenTool,
          toolResult,
          requiresConfirmation: true,
          pendingAction: toolResult.pendingAction
        }
      }

      // Format helpful reply from tool result
      let reply = `Here are the results for **${chosenTool.replace(/_/g, ' ')}**:`
      if (chosenTool === 'get_my_eligible_drives') {
        if (toolResult.eligibleDrives?.length > 0) {
          reply = `You are currently eligible for **${toolResult.eligibleDriveCount}** placement drive(s):\n` +
            toolResult.eligibleDrives.map(d => `• **${d.company}** (${d.role}) — CTC: ${d.package || 'Competitive'}, Deadline: ${new Date(d.deadline).toLocaleDateString()}`).join('\n')
        } else {
          reply = `No active drives currently match your CGPA / branch criteria.`
        }
      } else if (chosenTool === 'get_my_weak_topics') {
        reply = `Based on your interview history, your readiness tier is **${toolResult.readinessTier}** (${toolResult.readinessScore}%).\n` +
          `Identified areas needing practice: **${toolResult.detectedWeakTopics.join(', ')}**.\n` +
          `Recommendation: ${toolResult.recommendedAction}.`
      } else if (chosenTool === 'find_alumni') {
        if (toolResult.mentors?.length > 0) {
          reply = `Found **${toolResult.matchCount}** verified alumni mentors:\n` +
            toolResult.mentors.map(m => `• **${m.name}** at **${m.company}** (${m.role}) — Skills: ${m.expertiseTags?.join(', ')}`).join('\n')
        } else {
          reply = `No verified alumni mentors found matching "${args.company || 'criteria'}".`
        }
      } else if (chosenTool === 'get_cohort_stats') {
        reply = `Cohort summary: Enrolled Students: **${toolResult.overview.totalStudents}**, Active Drives: **${toolResult.overview.totalActiveDrives}**, Offers: **${toolResult.overview.totalOffers}**.`
      }

      return {
        reply,
        toolCalled: chosenTool,
        toolResult,
        requiresConfirmation: false
      }
    }

    // Default conversational response
    return {
      reply: `I am your Placement Copilot. You can ask me:\n• *"What drives am I eligible for?"*\n• *"What are my weak topics?"*\n• *"Find alumni mentors at Google"*\n• *"Book a mock interview with a mentor"*`,
      toolCalled: null,
      toolResult: null,
      requiresConfirmation: false
    }
  }
}

module.exports = new CopilotService()
