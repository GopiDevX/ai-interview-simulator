import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useDropzone } from 'react-dropzone'
import toast from 'react-hot-toast'
import { interviewApi } from '../api/interview.js'
import Button from '../components/ui/Button.jsx'

const ROLES = ['Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Data Engineer', 'DevOps Engineer', 'Mobile Developer', 'Machine Learning Engineer', 'Product Manager']
const COMPANIES = ['Google', 'Amazon', 'Microsoft', 'Meta', 'Apple', 'Netflix', 'Uber', 'Airbnb', 'Stripe', 'Startup']
const TYPES = [
  { id: 'technical', label: 'Technical Only', desc: 'Focus on tech questions', icon: '💻' },
  { id: 'behavioral', label: 'Technical + Behavioral', desc: 'Balanced mix', icon: '⚖️' },
  { id: 'full', label: 'Full Interview', desc: 'Complete experience', icon: '🎯' },
]

export default function Setup() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [resume, setResume] = useState(null)
  const [role, setRole] = useState('')
  const [company, setCompany] = useState('')
  const [interviewType, setInterviewType] = useState('full')
  const [loading, setLoading] = useState(false)

  const onDrop = useCallback((accepted) => {
    if (accepted[0]) setResume(accepted[0])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
    onDropRejected: () => toast.error('Please upload a PDF under 5MB')
  })

  const handleStart = async () => {
    if (!role) return toast.error('Please select a role')
    if (!company) return toast.error('Please select a company')
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('role', role)
      formData.append('company', company)
      formData.append('interviewType', interviewType)
      if (resume) formData.append('resume', resume)

      const { data } = await interviewApi.start(formData)
      toast.success('Interview session created! Good luck 🍀')
      navigate(`/interview/${data.sessionId}`, { state: { questionPlan: data.questionPlan } })
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error('Free tier limit reached! Redirecting to upgrade...')
        navigate('/pricing')
      } else {
        toast.error(err.response?.data?.error || 'Failed to start interview')
      }
    } finally {
      setLoading(false)
    }
  }

  const canProceedStep1 = step > 1
  const canProceedStep2 = step > 2 || (role && company)

  const steps = [
    { num: 1, label: 'Resume' },
    { num: 2, label: 'Role & Company' },
    { num: 3, label: 'Interview Type' },
    { num: 4, label: 'Start' },
  ]

  return (
    <div className="min-h-screen hero-bg pt-20 px-4 pb-12 flex items-center justify-center">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="text-4xl font-display font-bold text-white mb-3">Set Up Your Interview</h1>
          <p className="text-slate-400 font-medium">Configure your personalized mock interview</p>
        </motion.div>

        {/* Step Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center gap-2">
              <button
                onClick={() => s.num < step && setStep(s.num)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  step === s.num ? 'bg-electric-blue text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]' :
                  step > s.num ? 'bg-electric-emerald/20 text-electric-emerald cursor-pointer hover:bg-electric-emerald/30' :
                  'bg-white/5 text-slate-500 hover:bg-white/10'
                }`}
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  step > s.num ? 'bg-electric-emerald text-navy-dark' : 
                  step === s.num ? 'bg-white text-electric-blue' : 'bg-white/10'
                }`}>
                  {step > s.num ? '✓' : s.num}
                </span>
                <span className="hidden sm:block uppercase tracking-wider">{s.label}</span>
              </button>
              {i < steps.length - 1 && (
                <div className={`w-8 h-1 rounded-full ${step > s.num ? 'bg-electric-emerald' : 'bg-white/10'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="glass-card p-8">
          <AnimatePresence mode="wait">
            {/* Step 1: Resume Upload */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl font-semibold text-white mb-1">Upload Your Resume</h2>
                  <p className="text-slate-400 text-sm">PDF format, up to 5MB. Optional but recommended for personalized questions.</p>
                </div>

                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer transition-all duration-300 relative overflow-hidden group ${
                    isDragActive ? 'border-electric-cyan bg-electric-cyan/10 scale-[1.02]' :
                    resume ? 'border-electric-emerald/50 bg-electric-emerald/5' :
                    'border-white/10 hover:border-electric-cyan/50 hover:bg-white/5'
                  }`}
                >
                  {isDragActive && <div className="absolute inset-0 bg-gradient-to-r from-electric-cyan/20 to-electric-blue/20 blur-3xl -z-10" />}
                  
                  <input {...getInputProps()} />
                  {resume ? (
                    <div className="space-y-4">
                      <div className="text-5xl drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]">📄</div>
                      <div>
                        <p className="text-electric-emerald font-bold text-lg">{resume.name}</p>
                        <p className="text-slate-400 text-sm mt-1">{(resume.size / 1024).toFixed(0)} KB • PDF</p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setResume(null) }}
                        className="text-red-400 hover:text-red-300 hover:bg-red-400/10 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all"
                      >
                        Remove File
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="w-20 h-20 bg-gradient-to-br from-electric-blue/20 to-electric-purple/20 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform shadow-[0_0_30px_rgba(59,130,246,0.15)]">
                        <span className="text-4xl">📤</span>
                      </div>
                      <div>
                        <p className="text-slate-200 font-bold text-lg mb-1">
                          {isDragActive ? 'Drop your resume right here' : 'Drag & drop your resume'}
                        </p>
                        <p className="text-slate-400 text-sm">or click to browse · PDF only · Max 5MB</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="ghost" onClick={() => setStep(2)} className="flex-1">
                    Skip (use generic questions)
                  </Button>
                  <Button onClick={() => setStep(2)} className="flex-1" disabled={!resume}>
                    Continue →
                  </Button>
                </div>
                {!resume && (
                  <p className="text-center text-slate-500 text-xs">You can skip this step and still get a great interview experience</p>
                )}
              </motion.div>
            )}

            {/* Step 2: Role & Company */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl font-semibold text-white mb-1">Target Role & Company</h2>
                  <p className="text-slate-400 text-sm">Questions will be tailored to your specific target.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Target Role *</label>
                    <input
                      value={role}
                      onChange={e => setRole(e.target.value)}
                      placeholder="e.g. Frontend Developer"
                      className="input-field mb-2"
                      list="roles-list"
                    />
                    <datalist id="roles-list">
                      {ROLES.map(r => <option key={r} value={r} />)}
                    </datalist>
                    <div className="flex flex-wrap gap-2">
                      {ROLES.slice(0, 5).map(r => (
                        <button
                          key={r}
                          onClick={() => setRole(r)}
                          className={`text-xs font-semibold tracking-wide px-4 py-2 rounded-xl border transition-all ${
                            role === r
                              ? 'bg-electric-blue/20 border-electric-blue/50 text-electric-cyan shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                              : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-300'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Target Company *</label>
                    <input
                      value={company}
                      onChange={e => setCompany(e.target.value)}
                      placeholder="e.g. Google"
                      className="input-field mb-2"
                      list="companies-list"
                    />
                    <datalist id="companies-list">
                      {COMPANIES.map(c => <option key={c} value={c} />)}
                    </datalist>
                    <div className="flex flex-wrap gap-2">
                      {COMPANIES.slice(0, 6).map(c => (
                        <button
                          key={c}
                          onClick={() => setCompany(c)}
                          className={`text-xs font-semibold tracking-wide px-4 py-2 rounded-xl border transition-all ${
                            company === c
                              ? 'bg-electric-blue/20 border-electric-blue/50 text-electric-cyan shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                              : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-300'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="secondary" onClick={() => setStep(1)} className="flex-1">← Back</Button>
                  <Button onClick={() => setStep(3)} className="flex-1" disabled={!role || !company}>Continue →</Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Interview Type */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl font-semibold text-white mb-1">Interview Format</h2>
                  <p className="text-slate-400 text-sm">Choose the type of interview you'd like to practice.</p>
                </div>

                <div className="space-y-3">
                  {TYPES.map(type => (
                    <button
                      key={type.id}
                      onClick={() => setInterviewType(type.id)}
                      className={`w-full p-5 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                        interviewType === type.id
                          ? 'bg-electric-blue/10 border-electric-blue/50 shadow-[0_0_30px_rgba(59,130,246,0.15)]'
                          : 'bg-white/5 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-colors ${
                          interviewType === type.id ? 'bg-electric-blue/20 text-white' : 'bg-white/5 text-slate-400'
                        }`}>
                          {type.icon}
                        </div>
                        <div>
                          <p className={`font-bold text-lg ${interviewType === type.id ? 'text-electric-cyan' : 'text-white'}`}>
                            {type.label}
                          </p>
                          <p className="text-slate-400 text-sm mt-0.5">{type.desc}</p>
                        </div>
                        {interviewType === type.id && (
                          <div className="ml-auto w-6 h-6 rounded-full bg-electric-cyan flex items-center justify-center shadow-[0_0_10px_rgba(6,182,212,0.5)]">
                            <svg className="w-4 h-4 text-navy-dark" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="secondary" onClick={() => setStep(2)} className="flex-1">← Back</Button>
                  <Button onClick={() => setStep(4)} className="flex-1">Continue →</Button>
                </div>
              </motion.div>
            )}

            {/* Step 4: Confirm & Start */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl font-semibold text-white mb-1">Ready to Begin?</h2>
                  <p className="text-slate-400 text-sm">Review your setup and start the interview when ready.</p>
                </div>

                <div className="space-y-3 bg-white/5 rounded-xl p-5">
                  {[
                    { label: 'Resume', value: resume ? resume.name : 'Using generic questions', icon: '📄' },
                    { label: 'Role', value: role, icon: '💼' },
                    { label: 'Company', value: company, icon: '🏢' },
                    { label: 'Format', value: TYPES.find(t => t.id === interviewType)?.label, icon: '🎯' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-3">
                      <span className="text-lg">{item.icon}</span>
                      <span className="text-slate-400 text-sm w-20">{item.label}:</span>
                      <span className="text-white text-sm font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-electric-cyan/10 border border-electric-cyan/20 rounded-2xl p-5 shadow-[0_0_20px_rgba(6,182,212,0.1)]">
                  <p className="text-electric-cyan text-sm leading-relaxed">
                    <span className="text-lg mr-2">💡</span>
                    <strong>Pro Tip:</strong> Treat this like a real interview — take your time, think before answering, and elaborate on your responses with specific examples.
                  </p>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button variant="secondary" onClick={() => setStep(3)} className="flex-1 py-4 font-bold">← Back</Button>
                  <Button 
                    onClick={handleStart} 
                    loading={loading} 
                    className="flex-[2] py-4 bg-gradient-to-r from-electric-blue to-electric-cyan hover:from-blue-500 hover:to-cyan-400 border-0 glow-blue text-white font-bold text-lg"
                  >
                    🚀 Launch Interview
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
