import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext.jsx'

const features = [
  { icon: '🧠', title: 'AI-Personalized Questions', desc: 'Questions generated from your actual resume using intelligent analysis — not a generic question bank.' },
  { icon: '💬', title: 'Real-Time Interview Chat', desc: 'Engage in a live conversation with Alex, your AI interviewer, via a realistic streaming chat interface.' },
  { icon: '💻', title: 'Coding Assessment', desc: 'Tackle a coding problem in Monaco Editor with instant AI evaluation of your solution quality.' },
  { icon: '📊', title: 'Detailed Performance Report', desc: 'Get a comprehensive report with scores, radar chart analysis, strengths, and tailored improvement tips.' },
  { icon: '⚡', title: 'Instant Feedback', desc: 'Each answer is scored and evaluated in real-time so you know exactly where you stand.' },
  { icon: '🎯', title: 'Role & Company Specific', desc: 'Tailor your prep for specific companies like Google, Amazon, or any target company you choose.' },
]

const steps = [
  { step: '01', title: 'Upload Your Resume', desc: 'Upload your PDF resume and let our AI analyze your experience and skills.' },
  { step: '02', title: 'Choose Your Target', desc: 'Select the role and company you\'re interviewing for.' },
  { step: '03', title: 'Start Interviewing', desc: 'Chat with your AI interviewer and complete the coding round.' },
  { step: '04', title: 'Get Your Report', desc: 'Receive a detailed scorecard with personalized feedback and improvement tips.' },
]

export default function Landing() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen hero-bg">
      {/* Hero */}
      <section className="pt-32 pb-20 px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-4xl mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-sm font-medium mb-8"
          >
            <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            AI-Powered Mock Interviews
          </motion.div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-tight mb-6">
            Ace Your Next
            <br />
            <span className="gradient-text">Technical Interview</span>
          </h1>

          <p className="text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto mb-10">
            Practice with an AI interviewer that analyzes your resume, asks personalized questions, 
            evaluates your answers in real-time, and gives you a detailed performance report.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to={user ? '/setup' : '/register'}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold text-lg transition-all glow-blue shadow-xl shadow-blue-500/30"
              >
                Start Practicing Free →
              </motion.button>
            </Link>
            <Link to={user ? '/dashboard' : '/login'}>
              <motion.button
                whileHover={{ scale: 1.03 }}
                className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-semibold text-lg transition-all"
              >
                {user ? 'Go to Dashboard' : 'Sign In'}
              </motion.button>
            </Link>
          </div>
        </motion.div>

        {/* Hero Visual */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-16 max-w-3xl mx-auto"
        >
          <div className="glass-card p-1 glow-blue">
            <div className="bg-[#1a2744] rounded-2xl p-6 space-y-4">
              {/* Fake chat UI preview */}
              <div className="flex items-center gap-3 pb-4 border-b border-white/5">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-sm font-bold">AI</div>
                <div>
                  <p className="text-white font-medium text-sm">Alex — Senior Technical Interviewer</p>
                  <p className="text-green-400 text-xs flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-green-400 rounded-full" />Live Interview</p>
                </div>
                <div className="ml-auto text-slate-400 text-xs font-mono">23:41</div>
              </div>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs text-white font-bold flex-shrink-0">AI</div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-2.5 max-w-sm">
                    <p className="text-slate-200 text-sm">I see you've worked on a React microservices project. Can you walk me through how you handled state management across multiple services?</p>
                  </div>
                </div>
                <div className="flex gap-3 justify-end">
                  <div className="bg-blue-500 rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-sm">
                    <p className="text-white text-sm">We used Redux Toolkit with a normalized state structure. For cross-service communication we set up a shared event bus using Redis pub/sub...</p>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-slate-600 flex items-center justify-center text-xs text-white font-bold flex-shrink-0">You</div>
                </div>
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs text-white font-bold flex-shrink-0">AI</div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-2.5 flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Everything You Need to Prepare</h2>
            <p className="text-slate-400 max-w-xl mx-auto">A complete interview preparation platform powered by AI</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="glass-card p-6 card-hover"
              >
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-white font-semibold mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">How It Works</h2>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400 font-bold text-lg flex items-center justify-center mx-auto mb-4">
                  {step.step}
                </div>
                <h3 className="text-white font-semibold mb-2">{step.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute right-0 top-1/2 text-slate-600 text-xl">→</div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to Ace Your Interview?</h2>
          <p className="text-slate-400 mb-8">Start practicing in under 2 minutes. No credit card required.</p>
          <Link to={user ? '/setup' : '/register'}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="px-10 py-4 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold text-lg transition-all glow-blue shadow-xl shadow-blue-500/30"
            >
              Get Started Free →
            </motion.button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-4 text-center text-slate-500 text-sm">
        <p>© 2024 InterviewAI. Built with ❤️ for job seekers everywhere.</p>
      </footer>
    </div>
  )
}
