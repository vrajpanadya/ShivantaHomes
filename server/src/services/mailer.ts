// // import { env } from '../config/env';

// // /**
// //  * Optional email delivery via Resend. When credentials are not configured
// //  * the mail is logged to the console so the flow still works in development.
// //  */
// // export async function sendMail(to: string, subject: string, text: string): Promise<boolean> {
// //   if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
// //     console.log(`[mail] (not configured) to=${to} subject="${subject}"\n${text}`);
// //     return false;
// //   }
// //   try {
// //     const res = await fetch('https://api.resend.com/emails', {
// //       method: 'POST',
// //       headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
// //       body: JSON.stringify({ from: env.EMAIL_FROM, to: [to], subject, text }),
// //     });
// //     return res.ok;
// //   } catch (err) {
// //     console.error('[mail] send failed', err);
// //     return false;
// //   }
// // }

// // export function notifyAdminNewEnquiry(enquiry: { fullName: string; mobile: string; enquiryType: string }) {
// //   return sendMail(
// //     env.ADMIN_EMAIL,
// //     `New enquiry from ${enquiry.fullName} (${enquiry.enquiryType})`,
// //     `A new ${enquiry.enquiryType} enquiry was received.\nName: ${enquiry.fullName}\nMobile: ${enquiry.mobile}`
// //   );
// // }
// import { env } from '../config/env';

// /**
//  * Optional email delivery via Resend. When credentials are not configured
//  * the mail is logged to the console so the flow still works in development.
//  */
// export async function sendMail(to: string, subject: string, text: string, html?: string): Promise<boolean> {
//   if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
//     console.log(`[mail] (not configured) to=${to} subject="${subject}"\n${text}`);
//     return false;
//   }
//   try {
//     const res = await fetch('https://api.resend.com/emails', {
//       method: 'POST',
//       headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
//       body: JSON.stringify({ from: env.EMAIL_FROM, to: [to], subject, text, ...(html ? { html } : {}) }),
//     });
//     return res.ok;
//   } catch (err) {
//     console.error('[mail] send failed', err);
//     return false;
//   }
// }

// const esc = (v: unknown) =>
//   String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

// /** Normalizes an Indian mobile number to a bare 10-digit string for tel:/wa.me links. */
// function digitsOnly(mobile: string) {
//   return String(mobile ?? '').replace(/\D/g, '').slice(-10);
// }

// function row(label: string, value: string) {
//   if (!value) return '';
//   return `
//     <tr>
//       <td style="padding:10px 0;border-bottom:1px solid #eee;color:#8a7a6d;font-size:13px;width:130px;vertical-align:top;">${label}</td>
//       <td style="padding:10px 0;border-bottom:1px solid #eee;color:#2b241f;font-size:14px;font-weight:600;vertical-align:top;">${value}</td>
//     </tr>`;
// }

// function enquiryEmailHtml(enquiry: {
//   fullName: string;
//   mobile: string;
//   email?: string;
//   enquiryType: string;
//   preferredVisitDate?: Date | string | null;
//   message?: string;
//   createdAt?: Date | string | null;
// }) {
//   const visitDate = enquiry.preferredVisitDate ? new Date(enquiry.preferredVisitDate).toLocaleDateString('en-IN') : '';
//   const submittedAt = new Date(enquiry.createdAt ?? Date.now()).toLocaleString('en-IN', {
//     day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
//   });
//   const siteUrl = env.CLIENT_URL.replace(/\/$/, '');
//   const dashboardUrl = `${siteUrl}/admin/enquiries`;
//   const logoUrl = `${siteUrl}/media/logo.png`;
//   const tenDigit = digitsOnly(enquiry.mobile);
//   const callHref = `tel:+91${tenDigit}`;
//   const waHref = `https://wa.me/91${tenDigit}`;

//   return `<!DOCTYPE html>
// <html>
// <head>
// <meta charset="utf-8" />
// <meta name="viewport" content="width=device-width, initial-scale=1.0" />
// <title>New Enquiry — Shivanta Homes</title>
// <style>
//   @media only screen and (max-width: 480px) {
//     .container { width: 100% !important; border-radius: 0 !important; }
//     .stack-td { display: block !important; width: 100% !important; box-sizing: border-box !important; }
//     .btn-gap { height: 10px !important; line-height: 10px !important; }
//     .pad-mobile { padding-left: 18px !important; padding-right: 18px !important; }
//   }
// </style>
// </head>
// <body style="margin:0;padding:0;background:#f4efe9;">
//   <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4efe9;">
//     <tr>
//       <td align="center" style="padding:32px 12px;">
//         <table role="presentation" class="container" width="560" cellpadding="0" cellspacing="0" style="width:560px;max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #ece4da;font-family:Georgia,'Times New Roman',serif;">

//           <!-- Branded header -->
//           <tr>
//             <td class="pad-mobile" align="center" style="background:#ffffff;padding:28px 32px 18px 32px;border-bottom:1px solid #ece4da;">
//               <img src="${logoUrl}" alt="Shivanta Homes" width="220" style="display:block;width:220px;max-width:60%;height:auto;margin:0 auto 14px auto;" />
//               <div style="color:#2b241f;font-size:17px;font-family:Georgia,'Times New Roman',serif;">New Enquiry Received</div>
//             </td>
//           </tr>

//           <!-- New Enquiry badge -->
//           <tr>
//             <td class="pad-mobile" style="padding:20px 32px 0 32px;">
//               <span style="display:inline-block;background:#eef6ec;color:#3f8a4f;font-size:11px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;padding:6px 12px;border-radius:20px;">
//                 ● New Enquiry
//               </span>
//               <span style="float:right;color:#a89c8f;font-size:12px;font-family:Arial,sans-serif;">${esc(submittedAt)}</span>
//             </td>
//           </tr>

//           <!-- Details card -->
//           <tr>
//             <td class="pad-mobile" style="padding:20px 32px 4px 32px;">
//               <table role="presentation" width="100%" style="border-collapse:collapse;">
//                 ${row('Name', esc(enquiry.fullName))}
//                 ${row('Mobile', esc(enquiry.mobile))}
//                 ${row('Email', esc(enquiry.email))}
//                 ${row('Enquiry Type', esc(enquiry.enquiryType))}
//                 ${row('Preferred Visit', esc(visitDate))}
//               </table>
//             </td>
//           </tr>

//           ${enquiry.message ? `
//           <!-- Message -->
//           <tr>
//             <td class="pad-mobile" style="padding:16px 32px 4px 32px;">
//               <div style="color:#8a7a6d;font-size:13px;margin-bottom:6px;">Message</div>
//               <div style="background:#f8f4ef;border:1px solid #ece4da;border-radius:8px;padding:14px 16px;color:#2b241f;font-size:14px;line-height:1.5;">
//                 ${esc(enquiry.message)}
//               </div>
//             </td>
//           </tr>` : ''}

//           <!-- Call / WhatsApp buttons -->
//           <tr>
//             <td class="pad-mobile" style="padding:24px 32px 0 32px;">
//               <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
//                 <tr>
//                   <td class="stack-td" width="50%" style="padding-right:6px;">
//                     <a href="${callHref}" style="display:block;text-align:center;background:#a3745a;color:#ffffff;text-decoration:none;font-family:Arial,sans-serif;font-size:13px;font-weight:bold;letter-spacing:0.5px;padding:13px 10px;border-radius:8px;">
//                       📞 Direct Call
//                     </a>
//                   </td>
//                   <td class="btn-gap" width="12" style="font-size:0;line-height:0;">&nbsp;</td>
//                   <td class="stack-td" width="50%" style="padding-left:6px;">
//                     <a href="${waHref}" style="display:block;text-align:center;background:#25d366;color:#ffffff;text-decoration:none;font-family:Arial,sans-serif;font-size:13px;font-weight:bold;letter-spacing:0.5px;padding:13px 10px;border-radius:8px;">
//                       💬 WhatsApp
//                     </a>
//                   </td>
//                 </tr>
//               </table>
//             </td>
//           </tr>

//           <!-- Dashboard link -->
//           <tr>
//             <td class="pad-mobile" align="center" style="padding:16px 32px 28px 32px;">
//               <a href="${dashboardUrl}" style="color:#a3745a;font-family:Arial,sans-serif;font-size:12px;text-decoration:underline;">
//                 View full enquiry in Dashboard
//               </a>
//             </td>
//           </tr>

//           <tr>
//             <td style="background:#f8f4ef;padding:14px 32px;border-top:1px solid #ece4da;">
//               <div style="color:#a89c8f;font-family:Arial,sans-serif;font-size:11px;text-align:center;">
//                 Automated notification from the Shivanta Homes website
//               </div>
//             </td>
//           </tr>

//         </table>
//       </td>
//     </tr>
//   </table>
// </body>
// </html>`;
// }

// export function notifyAdminNewEnquiry(enquiry: {
//   fullName: string;
//   mobile: string;
//   email?: string;
//   enquiryType: string;
//   preferredVisitDate?: Date | string | null;
//   message?: string;
//   createdAt?: Date | string | null;
// }) {
//   return sendMail(
//     env.ADMIN_EMAIL,
//     `New enquiry from ${enquiry.fullName} (${enquiry.enquiryType})`,
//     `A new ${enquiry.enquiryType} enquiry was received.\nName: ${enquiry.fullName}\nMobile: ${enquiry.mobile}${enquiry.email ? `\nEmail: ${enquiry.email}` : ''}${enquiry.message ? `\nMessage: ${enquiry.message}` : ''}`,
//     enquiryEmailHtml(enquiry)
//   );
// }
import { env } from '../config/env';
import fs from 'fs';
import path from 'path';

/**
 * Optional email delivery via Resend. When credentials are not configured
 * the mail is logged to the console so the flow still works in development.
 */
export async function sendMail(
  to: string,
  subject: string,
  text: string,
  html?: string,
  attachments?: { filename: string; content: string; content_id: string }[]
): Promise<boolean> {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    console.log(`[mail] (not configured) to=${to} subject="${subject}"\n${text}`);
    return false;
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: env.EMAIL_FROM,
        to: [to],
        subject,
        text,
        ...(html ? { html } : {}),
        ...(attachments?.length ? { attachments } : {}),
      }),
    });
    return res.ok;
  } catch (err) {
    console.error('[mail] send failed', err);
    return false;
  }
}

/**
 * The logo is sent as a CID (Content-ID) inline attachment — Gmail and most
 * email clients strip base64 data-URI images from the HTML body, so the
 * logo must travel as a real attachment referenced via `cid:` in the markup.
 * Read once at startup and cached as base64.
 */
const LOGO_CONTENT_ID = 'shivanta-homes-logo';
const LOGO_BASE64 = (() => {
  try {
    const logoPath = path.join(process.cwd(), 'public', 'media', 'logo.png');
    return fs.readFileSync(logoPath).toString('base64');
  } catch {
    console.warn('[mail] logo.png not found for email template — header will show text only');
    return '';
  }
})();

const esc = (v: unknown) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

/** Normalizes an Indian mobile number to a bare 10-digit string for tel:/wa.me links. */
function digitsOnly(mobile: string) {
  return String(mobile ?? '').replace(/\D/g, '').slice(-10);
}

function row(label: string, value: string) {
  if (!value) return '';
  return `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #eee;color:#8a7a6d;font-size:13px;width:130px;vertical-align:top;">${label}</td>
      <td style="padding:10px 0;border-bottom:1px solid #eee;color:#2b241f;font-size:14px;font-weight:600;vertical-align:top;">${value}</td>
    </tr>`;
}

function enquiryEmailHtml(enquiry: {
  fullName: string;
  mobile: string;
  email?: string;
  enquiryType: string;
  preferredVisitDate?: Date | string | null;
  message?: string;
  createdAt?: Date | string | null;
}) {
  const visitDate = enquiry.preferredVisitDate ? new Date(enquiry.preferredVisitDate).toLocaleDateString('en-IN') : '';
  const submittedAt = new Date(enquiry.createdAt ?? Date.now()).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
  const siteUrl = env.CLIENT_URL.replace(/\/$/, '');
  const dashboardUrl = `${siteUrl}/admin/enquiries`;
  const tenDigit = digitsOnly(enquiry.mobile);
  const callHref = `tel:+91${tenDigit}`;
  const waHref = `https://wa.me/91${tenDigit}`;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>New Enquiry — Shivanta Homes</title>
<style>
  @media only screen and (max-width: 480px) {
    .container { width: 100% !important; border-radius: 0 !important; }
    .stack-td { display: block !important; width: 100% !important; box-sizing: border-box !important; }
    .btn-gap { height: 10px !important; line-height: 10px !important; }
    .pad-mobile { padding-left: 18px !important; padding-right: 18px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:#f4efe9;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4efe9;">
    <tr>
      <td align="center" style="padding:32px 12px;">
        <table role="presentation" class="container" width="560" cellpadding="0" cellspacing="0" style="width:560px;max-width:560px;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #ece4da;font-family:Georgia,'Times New Roman',serif;">

          <!-- Branded header -->
          <tr>
            <td class="pad-mobile" align="center" style="background:#ffffff;padding:28px 32px 18px 32px;border-bottom:1px solid #ece4da;">
              ${LOGO_BASE64
                ? `<img src="cid:${LOGO_CONTENT_ID}" alt="Shivanta Homes" width="220" style="display:block;width:220px;max-width:60%;height:auto;margin:0 auto 14px auto;" />`
                : `<div style="color:#a3745a;font-size:22px;font-family:Georgia,'Times New Roman',serif;letter-spacing:1px;margin-bottom:10px;">SHIVANTA <span style="color:#2b241f;">HOMES</span></div>`}
              <div style="color:#2b241f;font-size:17px;font-family:Georgia,'Times New Roman',serif;">New Enquiry Received</div>
            </td>
          </tr>

          <!-- New Enquiry badge -->
          <tr>
            <td class="pad-mobile" style="padding:20px 32px 0 32px;">
              <span style="display:inline-block;background:#eef6ec;color:#3f8a4f;font-size:11px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;padding:6px 12px;border-radius:20px;">
                ● New Enquiry
              </span>
              <span style="float:right;color:#a89c8f;font-size:12px;font-family:Arial,sans-serif;">${esc(submittedAt)}</span>
            </td>
          </tr>

          <!-- Details card -->
          <tr>
            <td class="pad-mobile" style="padding:20px 32px 4px 32px;">
              <table role="presentation" width="100%" style="border-collapse:collapse;">
                ${row('Name', esc(enquiry.fullName))}
                ${row('Mobile', esc(enquiry.mobile))}
                ${row('Email', esc(enquiry.email))}
                ${row('Enquiry Type', esc(enquiry.enquiryType))}
                ${row('Preferred Visit', esc(visitDate))}
              </table>
            </td>
          </tr>

          ${enquiry.message ? `
          <!-- Message -->
          <tr>
            <td class="pad-mobile" style="padding:16px 32px 4px 32px;">
              <div style="color:#8a7a6d;font-size:13px;margin-bottom:6px;">Message</div>
              <div style="background:#f8f4ef;border:1px solid #ece4da;border-radius:8px;padding:14px 16px;color:#2b241f;font-size:14px;line-height:1.5;">
                ${esc(enquiry.message)}
              </div>
            </td>
          </tr>` : ''}

          <!-- Call / WhatsApp buttons -->
          <tr>
            <td class="pad-mobile" style="padding:24px 32px 0 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td class="stack-td" width="50%" style="padding-right:6px;">
                    <a href="${callHref}" style="display:block;text-align:center;background:#a3745a;color:#ffffff;text-decoration:none;font-family:Arial,sans-serif;font-size:13px;font-weight:bold;letter-spacing:0.5px;padding:13px 10px;border-radius:8px;">
                      📞 Direct Call
                    </a>
                  </td>
                  <td class="btn-gap" width="12" style="font-size:0;line-height:0;">&nbsp;</td>
                  <td class="stack-td" width="50%" style="padding-left:6px;">
                    <a href="${waHref}" style="display:block;text-align:center;background:#25d366;color:#ffffff;text-decoration:none;font-family:Arial,sans-serif;font-size:13px;font-weight:bold;letter-spacing:0.5px;padding:13px 10px;border-radius:8px;">
                      💬 WhatsApp
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Dashboard link -->
          <tr>
            <td class="pad-mobile" align="center" style="padding:16px 32px 28px 32px;">
              <a href="${dashboardUrl}" style="color:#a3745a;font-family:Arial,sans-serif;font-size:12px;text-decoration:underline;">
                View full enquiry in Dashboard
              </a>
            </td>
          </tr>

          <tr>
            <td style="background:#f8f4ef;padding:14px 32px;border-top:1px solid #ece4da;">
              <div style="color:#a89c8f;font-family:Arial,sans-serif;font-size:11px;text-align:center;">
                Automated notification from the Shivanta Homes website
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function notifyAdminNewEnquiry(enquiry: {
  fullName: string;
  mobile: string;
  email?: string;
  enquiryType: string;
  preferredVisitDate?: Date | string | null;
  message?: string;
  createdAt?: Date | string | null;
}) {
  return sendMail(
    env.ADMIN_EMAIL,
    `New enquiry from ${enquiry.fullName} (${enquiry.enquiryType})`,
    `A new ${enquiry.enquiryType} enquiry was received.\nName: ${enquiry.fullName}\nMobile: ${enquiry.mobile}${enquiry.email ? `\nEmail: ${enquiry.email}` : ''}${enquiry.message ? `\nMessage: ${enquiry.message}` : ''}`,
    enquiryEmailHtml(enquiry),
    LOGO_BASE64 ? [{ filename: 'logo.png', content: LOGO_BASE64, content_id: LOGO_CONTENT_ID }] : undefined
  );
}
