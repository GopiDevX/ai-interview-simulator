import { useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Editor from '@monaco-editor/react'
import toast from 'react-hot-toast'
import { interviewApi } from '../api/interview.js'
import Button from '../components/ui/Button.jsx'
import Badge from '../components/ui/Badge.jsx'

const LANGUAGES = [
  { id: 'javascript', label: 'JavaScript' },
  { id: 'python', label: 'Python' },
  { id: 'java', label: 'Java' },
  { id: 'cpp', label: 'C++' },
]

const STARTERS = {
  javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function solution(nums, target) {
  // Write your solution here
  
}`,
  python: `def solution(nums, target):
    # Write your solution here
    pass`,
  java: `class Solution {
    public int[] solution(int[] nums, int target) {
        // Write your solution here
        return new int[]{};
    }
}`,
  cpp: `#include <vector>
using namespace std;

class Solution {
public:
    vector<int> solution(vector<int>& nums, int target) {
        // Write your solution here
        return {};
    }
};`
}

export default function CodingRound() {
  const { sessionId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  const [language, setLanguage] = useState('javascript')
  const [code, setCode] = useState(STARTERS.javascript)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [evaluation, setEvaluation] = useState(null)
  const [question, setQuestion] = useState(null)
  const [timeLeft, setTimeLeft] = useState(30 * 60) // 30 minutes

  // Load question from session or location state
  useEffect(() => {
    const qpFromState = location.state?.questionPlan || location.state?.sessionData?.questionPlan
    if (qpFromState?.codingQuestion) {
      setQuestion(qpFromState.codingQuestion)
      return
    }
    // Fetch from API
    interviewApi.getSession(sessionId)
      .then(({ data }) => {
        if (data.questionPlan?.codingQuestion) setQuestion(data.questionPlan.codingQuestion)
      })
      .catch(() => {
        // Use fallback question
        setQuestion({
          title: 'Two Sum',
          description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
          examples: [{ input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'nums[0] + nums[1] = 9' }],
          constraints: ['2 <= nums.length <= 10^4', 'Only one valid answer exists.'],
          difficulty: 'Easy'
        })
      })
  }, [sessionId])

  // Countdown timer
  useEffect(() => {
    if (submitted) return
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          toast.error('Time\'s up! Auto-submitting...')
          handleSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [submitted])

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  const handleLanguageChange = (lang) => {
    setLanguage(lang)
    setCode(STARTERS[lang] || STARTERS.javascript)
  }

  const handleSubmit = async () => {
    if (submitting || submitted) return
    if (!code.trim()) return toast.error('Please write some code first')
    setSubmitting(true)
    try {
      const questionText = question
        ? `${question.title}: ${question.description}`
        : 'Coding problem'

      const { data } = await interviewApi.evaluateCode({
        sessionId,
        question: questionText,
        code,
        language
      })
      setEvaluation(data)
      setSubmitted(true)
      toast.success('Code submitted! See your results below.')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  const handleFinish = async () => {
    try {
      await interviewApi.endInterview(sessionId)
      navigate(`/report/${sessionId}`)
    } catch {
      navigate(`/report/${sessionId}`)
    }
  }

  const difficultyColor = { Easy: 'green', Medium: 'amber', Hard: 'red' }

  return (
    <div className="h-screen flex flex-col bg-[#0F172A] pt-16">
      {/* Top Bar */}
      <div className="flex-shrink-0 border-b border-white/5 bg-[#0F172A]/90 backdrop-blur px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <span className="text-blue-400 text-sm">💻</span>
          </div>
          <div>
            <p className="text-white font-semibold text-sm">Coding Round</p>
            <p className="text-slate-500 text-xs">Submit your solution before time runs out</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className={`font-mono text-lg font-bold tabular-nums ${
            timeLeft < 300 ? 'text-red-400' : timeLeft < 600 ? 'text-amber-400' : 'text-slate-300'
          }`}>
            ⏱ {formatTime(timeLeft)}
          </div>
          {submitted ? (
            <Button onClick={handleFinish} size="sm">
              View Report →
            </Button>
          ) : (
            <Button onClick={handleSubmit} loading={submitting} size="sm">
              Submit Solution
            </Button>
          )}
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Problem Statement */}
        <div className="w-[42%] border-r border-white/5 overflow-y-auto p-6 space-y-5">
          {question ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              <div className="flex items-start justify-between gap-3">
                <h1 className="text-xl font-bold text-white">{question.title}</h1>
                {question.difficulty && (
                  <Badge variant={difficultyColor[question.difficulty] || 'blue'}>
                    {question.difficulty}
                  </Badge>
                )}
              </div>

              <p className="text-slate-300 text-sm leading-relaxed">{question.description}</p>

              {question.examples?.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-white font-semibold text-sm">Examples</h3>
                  {question.examples.map((ex, i) => (
                    <div key={i} className="bg-white/5 border border-white/8 rounded-xl p-4 space-y-2 font-mono text-sm">
                      <div><span className="text-slate-500">Input: </span><span className="text-slate-200">{ex.input}</span></div>
                      <div><span className="text-slate-500">Output: </span><span className="text-green-400">{ex.output}</span></div>
                      {ex.explanation && (
                        <div className="text-slate-400 text-xs">{ex.explanation}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {question.constraints?.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-white font-semibold text-sm">Constraints</h3>
                  <ul className="space-y-1">
                    {question.constraints.map((c, i) => (
                      <li key={i} className="text-slate-400 text-sm font-mono flex gap-2">
                        <span className="text-blue-400">•</span> {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Evaluation results */}
              {evaluation && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border-t border-white/5 pt-5 space-y-4"
                >
                  <h3 className="text-white font-semibold">Evaluation Results</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="glass-card p-3 text-center">
                      <div className={`text-2xl font-bold ${
                        evaluation.score >= 7 ? 'text-green-400' :
                        evaluation.score >= 5 ? 'text-yellow-400' : 'text-red-400'
                      }`}>{evaluation.score}/10</div>
                      <div className="text-slate-500 text-xs mt-1">Score</div>
                    </div>
                    <div className="glass-card p-3 text-center">
                      <div className={`text-lg font-bold ${evaluation.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                        {evaluation.isCorrect ? '✓ Correct' : '✗ Issues'}
                      </div>
                      <div className="text-slate-500 text-xs mt-1">Result</div>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-xl p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Time Complexity:</span>
                      <span className="text-blue-400 font-mono">{evaluation.timeComplexity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Space Complexity:</span>
                      <span className="text-blue-400 font-mono">{evaluation.spaceComplexity}</span>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-slate-300 text-sm leading-relaxed">{evaluation.feedback}</p>
                  </div>

                  {evaluation.improvements?.length > 0 && (
                    <div className="space-y-2">
                      {evaluation.improvements.map((imp, i) => (
                        <div key={i} className="flex gap-2 text-sm text-amber-400">
                          <span>→</span><span>{imp}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <Button onClick={handleFinish} fullWidth>
                    🎉 View Full Report
                  </Button>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
            </div>
          )}
        </div>

        {/* Right: Code Editor */}
        <div className="flex-1 flex flex-col">
          {/* Language selector */}
          <div className="flex-shrink-0 border-b border-white/5 px-4 py-2 flex items-center gap-2">
            {LANGUAGES.map(lang => (
              <button
                key={lang.id}
                onClick={() => !submitted && handleLanguageChange(lang.id)}
                disabled={submitted}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${
                  language === lang.id
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                } disabled:opacity-50`}
              >
                {lang.label}
              </button>
            ))}
          </div>

          {/* Monaco Editor */}
          <div className="flex-1">
            <Editor
              height="100%"
              language={language}
              value={code}
              onChange={(val) => !submitted && setCode(val || '')}
              theme="vs-dark"
              options={{
                fontSize: 14,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                lineNumbers: 'on',
                readOnly: submitted,
                padding: { top: 16, bottom: 16 },
                renderLineHighlight: 'all',
                cursorBlinking: 'smooth',
                smoothScrolling: true,
                roundedSelection: true,
              }}
            />
          </div>

          {/* Bottom action bar */}
          {!submitted && (
            <div className="flex-shrink-0 border-t border-white/5 px-4 py-3 flex items-center justify-between">
              <p className="text-slate-500 text-xs">
                Shift+Enter for new line · Write clean, readable code
              </p>
              <Button onClick={handleSubmit} loading={submitting} size="sm">
                Submit Solution →
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
