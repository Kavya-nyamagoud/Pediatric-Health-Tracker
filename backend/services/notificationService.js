// backend/services/notificationService.js
const nodemailer = require('nodemailer')

// 🔐 For real project: move these to .env
const EMAIL_USER = process.env.EMAIL_USER || 'your-email@example.com'
const EMAIL_PASS = process.env.EMAIL_PASS || 'your-email-password-or-app-pass'

// 1. Email transporter (Gmail / other SMTP)
const transporter = nodemailer.createTransport({
  service: 'gmail', // or 'hotmail', 'yahoo', custom SMTP etc.
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS
  }
})

async function sendEmail({ to, subject, text, html }) {
  if (!EMAIL_USER || !EMAIL_PASS) {
    console.log('📧 Email not configured – would send to:', to)
    console.log('Subject:', subject)
    console.log('Body:', text || html)
    return
  }

  const mailOptions = {
    from: EMAIL_USER,
    to,
    subject,
    text,
    html
  }

  await transporter.sendMail(mailOptions)
  console.log('✅ Email sent to', to)
}

// 2. SMS – stub (you can plug Twilio here if you want)
async function sendSms({ to, message }) {
  console.log('📱 [SMS stub] Would send SMS to:', to, '->', message)
  // If you configure Twilio, you would call twilioClient.messages.create(...) here
}

// 3. Helper: build growth-risk email text
function buildGrowthRiskEmail(child, riskLevel, recommendationText) {
  const subject = `Growth Alert for ${child.firstName} ${child.lastName} – ${riskLevel.toUpperCase()} risk`
  const text = `
Dear Parent,

Our Pediatric Health Tracker has detected a ${riskLevel.toUpperCase()} growth risk for your child ${child.firstName}.

Summary:
${recommendationText}

We recommend consulting your pediatrician for a detailed evaluation.

This is an automated message from the Pediatric Health Tracker system.
`
  return { subject, text }
}

module.exports = {
  sendEmail,
  sendSms,
  buildGrowthRiskEmail
}
