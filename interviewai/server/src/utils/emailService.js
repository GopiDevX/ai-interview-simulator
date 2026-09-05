const { Resend } = require('resend')

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

const sendReportEmail = async (userEmail, userName, report, role) => {
  if (!resend) {
    console.warn('RESEND_API_KEY not found. Skipping email report.')
    return
  }

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="background-color: #0f172a; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: #fff; margin: 0;">AI Interview Scorecard</h1>
      </div>
      
      <div style="padding: 30px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0 0 8px 8px;">
        <p style="font-size: 16px;">Hi ${userName},</p>
        <p style="font-size: 16px;">Here is the scorecard for your recent mock interview for the <strong>${role}</strong> position.</p>

        <div style="background-color: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
          <h2 style="margin-top: 0; color: #64748b; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Final Score</h2>
          <div style="font-size: 48px; font-weight: bold; color: ${report.overallScore >= 70 ? '#10b981' : '#f59e0b'};">
            ${report.overallScore}/100
          </div>
          <p style="margin-bottom: 0; font-size: 16px; font-weight: 500; color: #334155;">
            Suggestion: <strong>${report.hiringSuggestion}</strong>
          </p>
        </div>

        <h3 style="color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">Top Strengths</h3>
        <ul style="padding-left: 20px;">
          ${report.strengths.map(s => `<li style="margin-bottom: 8px; color: #10b981;">${s}</li>`).join('')}
        </ul>

        <h3 style="color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; margin-top: 30px;">Areas for Improvement</h3>
        <ul style="padding-left: 20px;">
          ${report.improvements.map(i => `<li style="margin-bottom: 8px; color: #f59e0b;">${i}</li>`).join('')}
        </ul>

        <p style="font-size: 14px; color: #64748b; margin-top: 40px; text-align: center;">
          Log in to your dashboard to view the full detailed breakdown and access recommended resources.
        </p>
      </div>
    </div>
  `

  try {
    const data = await resend.emails.send({
      from: 'AI Interview Platform <onboarding@resend.dev>', // Resend's default testing domain
      to: userEmail,
      subject: `Your Interview Scorecard: ${role}`,
      html: htmlContent,
    })
    console.log('Report email sent successfully:', data.id)
  } catch (error) {
    console.error('Failed to send report email:', error)
  }
}

module.exports = { sendReportEmail }
