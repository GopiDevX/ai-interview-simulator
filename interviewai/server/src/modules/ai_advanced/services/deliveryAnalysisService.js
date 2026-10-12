/**
 * Delivery Metrics Analysis Service
 * Evaluates candidate communication poise strictly as delivery metrics:
 * - Words Per Minute (WPM) pacing
 * - Filler-word frequency ('um', 'uh', 'like', 'basically')
 * - Pause duration patterns & fluency
 * - Client-side camera proxy ingestion (eye-contact & posture stability without streaming video)
 * 
 * NOTE: Explicitly avoids scientifically dubious "emotion recognition from faces",
 * framing all indicators as objective delivery and verbal clarity metrics.
 */
class DeliveryAnalysisService {
  constructor() {
    this.FILLER_WORDS = ['um', 'uh', 'like', 'basically', 'you know', 'actually', 'literally', 'sort of', 'kind of']
  }

  /**
   * Analyze audio transcription for delivery metrics
   * @param {string} transcript - Speech-to-text string
   * @param {number} durationSeconds - Duration in seconds
   * @param {Object} clientCameraProxy - Client-side MediaPipe delivery metrics (optional)
   */
  analyzeDelivery(transcript = '', durationSeconds = 60, clientCameraProxy = {}) {
    const safeDurationMin = Math.max(0.1, durationSeconds / 60)
    const words = transcript.trim().split(/\s+/).filter(w => w.length > 0)
    const totalWords = words.length

    // 1. Words Per Minute (WPM)
    const wpm = Math.round(totalWords / safeDurationMin)
    let pacingAssessment = 'Optimal'
    if (wpm < 110) pacingAssessment = 'Slow / Hesitant'
    else if (wpm > 165) pacingAssessment = 'Fast / Rushed'

    // 2. Filler-Word Count & Frequency
    const lower = transcript.toLowerCase()
    let fillerCount = 0
    const detectedFillers = {}

    for (const filler of this.FILLER_WORDS) {
      const regex = new RegExp(`\\b${filler}\\b`, 'gi')
      const matches = (lower.match(regex) || []).length
      if (matches > 0) {
        fillerCount += matches
        detectedFillers[filler] = matches
      }
    }

    const fillerRatePerMin = Number((fillerCount / safeDurationMin).toFixed(1))
    const fillerPercentage = totalWords > 0 ? Number(((fillerCount / totalWords) * 100).toFixed(1)) : 0

    let fillerAssessment = 'Clean'
    if (fillerPercentage > 6.0) fillerAssessment = 'High Filler Usage'
    else if (fillerPercentage > 3.0) fillerAssessment = 'Moderate Filler Usage'

    // 3. Fluency & Pause Pattern Proxy
    // Count ellipses or comma hesitation clusters
    const pauseCount = (transcript.match(/\.\.\.|—|,/g) || []).length
    const pauseDensity = Number((pauseCount / safeDurationMin).toFixed(1))

    // 4. Ingest Client-Side Camera Poise Proxy (computed client-side via MediaPipe)
    // Video NEVER leaves the browser. Only numerical stability float (0-100) is transmitted.
    const eyeContactProxy = clientCameraProxy.eyeContactStability !== undefined
      ? clientCameraProxy.eyeContactStability
      : 84 // Standard benchmark
    const postureStability = clientCameraProxy.postureStability !== undefined
      ? clientCameraProxy.postureStability
      : 88

    return {
      metrics: {
        totalWords,
        durationSeconds: Math.round(durationSeconds),
        wordsPerMinute: wpm,
        pacingAssessment,
        fillerCount,
        fillerRatePerMin,
        fillerPercentage,
        fillerAssessment,
        detectedFillers,
        pauseDensityPerMin: pauseDensity
      },
      clientSidePoiseProxy: {
        eyeContactPoiseScore: eyeContactProxy,
        postureStabilityScore: postureStability,
        privacyNote: 'Video frames never leave the client. Signals computed client-side via MediaPipe.'
      },
      actionableTips: [
        ...(wpm < 110 ? ['Practice pacing up slightly to maintain engaging conversational rhythm.'] : []),
        ...(wpm > 165 ? ['Take deliberate breaths before key technical points to avoid rushing your explanations.'] : []),
        ...(fillerPercentage > 4.0 ? [`Replace '${Object.keys(detectedFillers)[0] || 'um'}' with a brief 1-second pause while structuring your thoughts.`] : ['Great verbal clarity and minimal hesitation.'])
      ]
    }
  }
}

module.exports = new DeliveryAnalysisService()
