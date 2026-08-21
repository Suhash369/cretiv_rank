import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';

export interface EmailLogEntry {
  id: string;
  type: 'INVITATION' | 'RESULT' | 'TEST';
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  sentAt: Date;
  success: boolean;
  previewUrl?: string | false;
  error?: string;
  mode?: string;
}

// In-memory store for recent email logs
const emailLogsStore: EmailLogEntry[] = [];
let cachedTransporter: nodemailer.Transporter | null = null;
let transporterMode: 'CUSTOM_SMTP' | 'ETHEREAL_TEST' = 'ETHEREAL_TEST';

async function getTransporter(): Promise<{ transporter: nodemailer.Transporter; mode: 'CUSTOM_SMTP' | 'ETHEREAL_TEST' }> {
  if (cachedTransporter) {
    return { transporter: cachedTransporter, mode: transporterMode };
  }

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    transporterMode = 'CUSTOM_SMTP';
    const isGmail = host.includes('gmail');
    
    cachedTransporter = nodemailer.createTransport({
      ...(isGmail
        ? { service: 'gmail' }
        : { host, port, secure: port === 465 }),
      auth: { user, pass },
      connectionTimeout: 10000, // 10s connection timeout
      greetingTimeout: 10000,
      socketTimeout: 15000,
      tls: {
        rejectUnauthorized: false,
      },
    });
    console.log(`📧 Email Service: Configured custom SMTP transporter (${isGmail ? 'Gmail Service' : `${host}:${port}`})`);
  } else {
    // Fallback to Ethereal Test Account
    transporterMode = 'ETHEREAL_TEST';
    try {
      const testAccount = await nodemailer.createTestAccount();
      cachedTransporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log(`📧 Email Service: Configured Ethereal Test Account (${testAccount.user})`);
    } catch (err) {
      console.warn('⚠️ Email Service: Could not create Ethereal test account. Creating fallback mock transporter.');
      cachedTransporter = nodemailer.createTransport({
        jsonTransport: true,
      });
    }
  }

  return { transporter: cachedTransporter, mode: transporterMode };
}

function getFromAddress(): string {
  return process.env.SMTP_FROM || '"CretivRank Assessment Platform" <no-reply@cretivrank.internal>';
}

function logEmail(entry: Omit<EmailLogEntry, 'id' | 'sentAt'>) {
  const newEntry: EmailLogEntry = {
    id: uuidv4(),
    sentAt: new Date(),
    ...entry,
  };
  emailLogsStore.unshift(newEntry);
  if (emailLogsStore.length > 100) {
    emailLogsStore.pop();
  }
  return newEntry;
}

async function sendMailViaHttpApi(toEmail: string, subject: string, html: string) {
  const resendKey = process.env.RESEND_API_KEY;
  const sendgridKey = process.env.SENDGRID_API_KEY || (process.env.SMTP_PASS?.startsWith('SG.') ? process.env.SMTP_PASS : undefined);

  if (resendKey) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.SMTP_FROM || 'CretivRank <onboarding@resend.dev>',
        to: [toEmail],
        subject,
        html,
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Resend HTTP API failed: ${errText}`);
    }
    return { success: true, mode: 'RESEND_HTTP_API' };
  }

  if (sendgridKey) {
    const fromAddr = process.env.SMTP_USER && process.env.SMTP_USER !== 'apikey' ? process.env.SMTP_USER : 'recruitment@cretivrank.com';
    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sendgridKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: toEmail }] }],
        from: { email: fromAddr, name: 'CretivRank Recruitment' },
        subject,
        content: [{ type: 'text/html', value: html }],
      }),
    });
    if (!res.ok && res.status !== 202) {
      const errText = await res.text();
      throw new Error(`SendGrid HTTP API failed: ${errText}`);
    }
    return { success: true, mode: 'SENDGRID_HTTP_API' };
  }

  return null;
}

export const emailService = {
  async getStatusAndLogs() {
    const { mode } = await getTransporter();
    const httpMode = process.env.RESEND_API_KEY
      ? 'RESEND_HTTP_API'
      : process.env.SENDGRID_API_KEY || process.env.SMTP_PASS?.startsWith('SG.')
      ? 'SENDGRID_HTTP_API'
      : mode;

    return {
      status: 'ACTIVE',
      mode: httpMode,
      configuredFrom: getFromAddress(),
      recentLogs: emailLogsStore,
    };
  },

  async sendTestEmail(toEmail: string) {
    const from = getFromAddress();
    const subject = 'Test Email — CretivRank Email System';

    const html = `
      <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 32px; border-radius: 8px; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366f1; margin-top: 0;">🚀 CretivRank Email System Test</h2>
        <p style="font-size: 15px; line-height: 1.5; color: #cbd5e1;">
          This is a test message generated by CretivRank by Cretivra to verify your email delivery configuration.
        </p>
        <div style="background-color: #1e293b; padding: 16px; border-radius: 6px; margin: 20px 0; border: 1px solid #334155;">
          <p style="margin: 4px 0; font-size: 13px; color: #94a3b8;"><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          <p style="margin: 4px 0; font-size: 13px; color: #94a3b8;"><strong>Recipient:</strong> ${toEmail}</p>
        </div>
        <p style="font-size: 12px; color: #64748b;">CretivRank Enterprise Platform &copy; ${new Date().getFullYear()}</p>
      </div>
    `;

    // Try HTTP API first (Resend / SendGrid API) to bypass cloud port 587 timeouts
    try {
      const httpResult = await sendMailViaHttpApi(toEmail, subject, html);
      if (httpResult) {
        const logged = logEmail({
          type: 'TEST',
          recipientEmail: toEmail,
          subject,
          success: true,
          mode: httpResult.mode,
        });
        return { success: true, mode: httpResult.mode, log: logged };
      }
    } catch (httpErr: any) {
      console.warn('HTTP API email failed, trying Nodemailer SMTP fallback:', httpErr.message);
    }

    const { transporter, mode } = await getTransporter();

    try {
      const info = await transporter.sendMail({
        from,
        to: toEmail,
        subject,
        html,
      });

      const previewUrl = mode === 'ETHEREAL_TEST' ? nodemailer.getTestMessageUrl(info) : false;
      const logged = logEmail({
        type: 'TEST',
        recipientEmail: toEmail,
        subject,
        success: true,
        previewUrl,
        mode,
      });

      return { success: true, messageId: info.messageId, previewUrl, log: logged };
    } catch (err: any) {
      cachedTransporter = null;
      let errMsg = err.message || 'SMTP Connection Error';
      if (errMsg.includes('timeout') || errMsg.includes('ETIMEDOUT')) {
        errMsg = `Connection timeout: Cloud host (Vercel/Render) blocked SMTP port 587/465. Please set RESEND_API_KEY or SENDGRID_API_KEY in Vercel settings for HTTP delivery. (${err.message})`;
      }
      const logged = logEmail({
        type: 'TEST',
        recipientEmail: toEmail,
        subject,
        success: false,
        error: errMsg,
        mode,
      });
      throw new Error(errMsg);
    }
  },

  async sendInvitationEmail(params: {
    candidateName: string;
    candidateEmail: string;
    assessmentName: string;
    jobRole: string;
    token: string;
    expiresAt: Date;
    invitationUrl: string;
  }) {
    const from = getFromAddress();
    const subject = `Assessment Invitation: ${params.assessmentName} (${params.jobRole})`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #090d16; color: #e2e8f0; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: #0f172a; border: 1px solid #1e293b; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
          .header { background: linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%); padding: 28px 24px; text-align: center; }
          .header h1 { margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
          .header p { margin: 6px 0 0 0; color: #e0e7ff; font-size: 13px; opacity: 0.9; }
          .content { padding: 32px 28px; }
          .badge { display: inline-block; background: rgba(99, 102, 241, 0.15); border: 1px solid rgba(99, 102, 241, 0.3); color: #818cf8; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 16px; }
          .button-container { text-align: center; margin: 32px 0; }
          .btn { background: #4f46e5; color: #ffffff !important; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.4); }
          .details-card { background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 20px; margin: 24px 0; }
          .detail-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 13.5px; }
          .detail-label { color: #94a3b8; }
          .detail-val { color: #f1f5f9; font-weight: 600; }
          .footer { background: #0b1120; border-top: 1px solid #1e293b; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>CretivRank Assessment Invitation</h1>
            <p>Secure Recruitment & Proctoring Platform</p>
          </div>
          <div class="content">
            <div class="badge">Official Assessment Notice</div>
            <h2 style="color: #ffffff; margin-top: 0; font-size: 20px;">Hello, ${params.candidateName}</h2>
            <p style="color: #cbd5e1; line-height: 1.6; font-size: 14px;">
              You have been invited to complete an online recruitment assessment for the position of <strong>${params.jobRole}</strong>.
            </p>

            <div class="details-card">
              <div class="detail-row">
                <span class="detail-label">Assessment:</span>
                <span class="detail-val">${params.assessmentName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Position:</span>
                <span class="detail-val">${params.jobRole}</span>
              </div>
              <div class="detail-row" style="margin-bottom:0;">
                <span class="detail-label">Access Link Expiry:</span>
                <span class="detail-val" style="color: #f43f5e;">${new Date(params.expiresAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div class="button-container">
              <a href="${params.invitationUrl}" class="btn" target="_blank">Start Online Assessment</a>
            </div>

            <div style="background: rgba(245, 158, 11, 0.1); border-left: 4px solid #f59e0b; padding: 14px 16px; border-radius: 4px; margin-top: 24px;">
              <p style="margin: 0; color: #fbbf24; font-size: 12.5px; font-weight: 600;">🔒 Assessment Integrity & Environment Rules:</p>
              <ul style="margin: 8px 0 0 0; padding-left: 20px; color: #cbd5e1; font-size: 12px; line-height: 1.5;">
                <li>Must be completed on a Desktop/Laptop with a working webcam and microphone.</li>
                <li>Full-screen mode and face proctoring signals will be strictly active during the exam.</li>
                <li>This link is single-use and cryptographically tied to your email account.</li>
              </ul>
            </div>
          </div>
          <div class="footer">
            <p style="margin: 0;">If the button above does not work, copy and paste this link into your browser:</p>
            <p style="margin: 6px 0; font-family: monospace; color: #818cf8; word-break: break-all;">${params.invitationUrl}</p>
            <p style="margin: 12px 0 0 0; color: #475569;">CretivRank Enterprise Platform &copy; ${new Date().getFullYear()}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Try HTTP API first (Resend / SendGrid API) to bypass cloud port 587 timeouts
    try {
      const httpResult = await sendMailViaHttpApi(params.candidateEmail, subject, html);
      if (httpResult) {
        const logged = logEmail({
          type: 'INVITATION',
          recipientEmail: params.candidateEmail,
          recipientName: params.candidateName,
          subject,
          success: true,
          mode: httpResult.mode,
        });
        return { success: true, mode: httpResult.mode, log: logged };
      }
    } catch (httpErr: any) {
      console.warn('HTTP API invitation email failed, trying Nodemailer SMTP fallback:', httpErr.message);
    }

    const { transporter, mode } = await getTransporter();

    try {
      const info = await transporter.sendMail({
        from,
        to: params.candidateEmail,
        subject,
        html,
      });

      const previewUrl = mode === 'ETHEREAL_TEST' ? nodemailer.getTestMessageUrl(info) : false;
      const logged = logEmail({
        type: 'INVITATION',
        recipientEmail: params.candidateEmail,
        recipientName: params.candidateName,
        subject,
        success: true,
        previewUrl,
        mode,
      });

      return { success: true, messageId: info.messageId, previewUrl, log: logged };
    } catch (err: any) {
      cachedTransporter = null;
      let errMsg = err.message || 'SMTP Connection Error';
      if (errMsg.includes('timeout') || errMsg.includes('ETIMEDOUT')) {
        errMsg = `Connection timeout: Cloud host (Vercel/Render) blocked SMTP port 587/465. Please set RESEND_API_KEY or SENDGRID_API_KEY in Vercel settings for HTTP delivery. (${err.message})`;
      }
      logEmail({
        type: 'INVITATION',
        recipientEmail: params.candidateEmail,
        recipientName: params.candidateName,
        subject,
        success: false,
        error: errMsg,
        mode,
      });
      throw new Error(errMsg);
    }
  },

  async sendResultEmail(params: {
    candidateName: string;
    candidateEmail: string;
    assessmentName: string;
    score: number;
    maxScore: number;
    percentage: number;
    accuracy: number;
    decision?: string;
  }) {
    const subject = `Assessment Evaluation Summary: ${params.assessmentName}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #090d16; color: #e2e8f0; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: #0f172a; border: 1px solid #1e293b; border-radius: 12px; overflow: hidden; }
          .header { background: #1e1b4b; border-b: 1px solid #312e81; padding: 24px; text-align: center; }
          .header h1 { margin: 0; color: #818cf8; font-size: 20px; font-weight: 700; }
          .content { padding: 28px; }
          .score-card { background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
          .score-num { font-size: 36px; font-weight: 800; color: #38bdf8; margin: 8px 0; }
          .footer { background: #0b1120; border-top: 1px solid #1e293b; padding: 16px; text-align: center; font-size: 12px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Assessment Results Recorded</h1>
          </div>
          <div class="content">
            <h3 style="color: #ffffff; margin-top: 0;">Hello ${params.candidateName},</h3>
            <p style="color: #cbd5e1; font-size: 14px; line-height: 1.5;">
              Your submission for <strong>${params.assessmentName}</strong> has been processed and stored securely.
            </p>
            <div class="score-card">
              <div style="font-size: 12px; color: #94a3b8; text-transform: uppercase; font-weight: 700;">Overall Score</div>
              <div class="score-num">${params.percentage}%</div>
              <div style="font-size: 13px; color: #cbd5e1;">${params.score} / ${params.maxScore} Total Points (${params.accuracy}% Accuracy)</div>
              ${
                params.decision
                  ? `<div style="margin-top: 14px; padding: 8px; background: rgba(99,102,241,0.2); border-radius: 6px; color: #a5b4fc; font-weight: 600; font-size: 13px;">Status: ${params.decision}</div>`
                  : ''
              }
            </div>
            <p style="color: #94a3b8; font-size: 13px;">Our recruitment team will review your proctoring logs & verification interview performance for next steps.</p>
          </div>
          <div class="footer">
            CretivRank Assessment Platform &copy; ${new Date().getFullYear()}
          </div>
        </div>
      </body>
      </html>
    `;

    // Try HTTP API first (Resend / SendGrid API) to bypass cloud port 587 timeouts
    try {
      const httpResult = await sendMailViaHttpApi(params.candidateEmail, subject, html);
      if (httpResult) {
        const logged = logEmail({
          type: 'RESULT',
          recipientEmail: params.candidateEmail,
          recipientName: params.candidateName,
          subject,
          success: true,
          mode: httpResult.mode,
        });
        return { success: true, mode: httpResult.mode, log: logged };
      }
    } catch (httpErr: any) {
      console.warn('HTTP API result email failed, trying Nodemailer SMTP fallback:', httpErr.message);
    }

    const { transporter, mode } = await getTransporter();
    const from = getFromAddress();

    try {
      const info = await transporter.sendMail({
        from,
        to: params.candidateEmail,
        subject,
        html,
      });

      const previewUrl = mode === 'ETHEREAL_TEST' ? nodemailer.getTestMessageUrl(info) : false;
      const logged = logEmail({
        type: 'RESULT',
        recipientEmail: params.candidateEmail,
        recipientName: params.candidateName,
        subject,
        success: true,
        previewUrl,
        mode,
      });

      return { success: true, messageId: info.messageId, previewUrl, log: logged };
    } catch (err: any) {
      logEmail({
        type: 'RESULT',
        recipientEmail: params.candidateEmail,
        recipientName: params.candidateName,
        subject,
        success: false,
        error: err.message,
        mode,
      });
      throw err;
    }
  },
};
