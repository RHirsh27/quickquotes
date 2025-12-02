import { resend, DEFAULT_FROM_EMAIL } from './resend'

/**
 * Generate HTML for payment received email
 */
function generatePaymentReceivedEmailHTML({
  amount,
  invoiceNumber,
  customerName,
  companyName = 'Quotd',
}: {
  amount: number
  invoiceNumber: string
  customerName: string
  companyName?: string
}) {
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount / 100)

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
    <h1 style="color: #2563eb; margin: 0 0 10px 0; font-size: 24px;">
      💰 Payment Received!
    </h1>
    <p style="margin: 0; font-size: 16px; color: #666;">
      You just got paid ${formattedAmount}
    </p>
  </div>

  <div style="background-color: #fff; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
    <p style="margin: 0 0 15px 0; font-size: 16px;">
      Great news! A payment has been successfully processed for your invoice.
    </p>

    <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #666;">Invoice Number:</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600;">#${invoiceNumber}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #666;">Customer:</td>
          <td style="padding: 8px 0; text-align: right;">${customerName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #666;">Amount:</td>
          <td style="padding: 8px 0; text-align: right; font-size: 20px; font-weight: bold; color: #10b981;">
            ${formattedAmount}
          </td>
        </tr>
      </table>
    </div>

    <p style="margin: 0 0 15px 0; font-size: 14px; color: #666;">
      The payment has been processed and will be deposited to your connected bank account according to your payout schedule.
    </p>

    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
      <p style="margin: 0; font-size: 12px; color: #999;">
        This is an automated notification from ${companyName}
      </p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

function generatePaymentReceivedEmailText({
  amount,
  invoiceNumber,
  customerName,
}: {
  amount: number
  invoiceNumber: string
  customerName: string
}) {
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount / 100)

  return `
Payment Received!

You just got paid ${formattedAmount}

Invoice Number: #${invoiceNumber}
Customer: ${customerName}
Amount: ${formattedAmount}

The payment has been processed and will be deposited to your connected bank account according to your payout schedule.

This is an automated notification from Quotd.
  `.trim()
}

/**
 * Generate HTML for invoice receipt email
 */
function generateInvoiceReceiptEmailHTML({
  invoiceNumber,
  amount,
  companyName,
  companyEmail,
  companyPhone,
  paymentDate,
}: {
  invoiceNumber: string
  amount: number
  companyName: string
  companyEmail?: string
  companyPhone?: string
  paymentDate: string
}) {
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount / 100)

  const formattedDate = new Date(paymentDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
    <h1 style="color: #10b981; margin: 0 0 10px 0; font-size: 24px;">
      ✓ Payment Receipt
    </h1>
    <p style="margin: 0; font-size: 16px; color: #666;">
      Thank you for your payment
    </p>
  </div>

  <div style="background-color: #fff; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
    <p style="margin: 0 0 15px 0; font-size: 16px;">
      This email confirms that your payment has been successfully processed.
    </p>

    <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #666;">Invoice Number:</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600;">#${invoiceNumber}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #666;">Amount Paid:</td>
          <td style="padding: 8px 0; text-align: right; font-size: 20px; font-weight: bold; color: #10b981;">
            ${formattedAmount}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #666;">Payment Date:</td>
          <td style="padding: 8px 0; text-align: right;">${formattedDate}</td>
        </tr>
      </table>
    </div>

    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0 0 10px 0; font-weight: bold; font-size: 14px;">Service Provider:</p>
      <p style="margin: 0 0 5px 0; font-size: 14px;">${companyName}</p>
      ${companyEmail ? `<p style="margin: 0 0 5px 0; font-size: 14px; color: #666;">${companyEmail}</p>` : ''}
      ${companyPhone ? `<p style="margin: 0; font-size: 14px; color: #666;">${companyPhone}</p>` : ''}
    </div>

    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
      <p style="margin: 0; font-size: 12px; color: #999;">
        This receipt is for your records. If you have any questions, please contact ${companyName}.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

function generateInvoiceReceiptEmailText({
  invoiceNumber,
  amount,
  companyName,
  companyEmail,
  companyPhone,
  paymentDate,
}: {
  invoiceNumber: string
  amount: number
  companyName: string
  companyEmail?: string
  companyPhone?: string
  paymentDate: string
}) {
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount / 100)

  return `
Payment Receipt

Thank you for your payment!

Invoice Number: #${invoiceNumber}
Amount Paid: ${formattedAmount}
Payment Date: ${new Date(paymentDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })}

Service Provider:
${companyName}
${companyEmail ? companyEmail + '\n' : ''}${companyPhone || ''}

This receipt is for your records. If you have any questions, please contact ${companyName}.
  `.trim()
}

/**
 * Generate HTML for quote viewed email
 */
function generateQuoteViewedEmailHTML({
  quoteNumber,
  customerName,
  viewedAt,
  companyName = 'Quotd',
}: {
  quoteNumber: string
  customerName: string
  viewedAt: string
  companyName?: string
}) {
  const formattedDate = new Date(viewedAt).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px; margin-bottom: 20px;">
    <h1 style="color: #2563eb; margin: 0 0 10px 0; font-size: 24px;">
      👀 Quote Opened
    </h1>
    <p style="margin: 0; font-size: 16px; color: #666;">
      Customer just opened Quote #${quoteNumber}
    </p>
  </div>

  <div style="background-color: #fff; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
    <p style="margin: 0 0 15px 0; font-size: 16px;">
      Great news! Your customer has opened the quote you sent them.
    </p>

    <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #666;">Quote Number:</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600;">#${quoteNumber}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #666;">Customer:</td>
          <td style="padding: 8px 0; text-align: right;">${customerName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #666;">Viewed At:</td>
          <td style="padding: 8px 0; text-align: right;">${formattedDate}</td>
        </tr>
      </table>
    </div>

    <p style="margin: 0 0 15px 0; font-size: 14px; color: #666;">
      This is a positive sign! Your customer is reviewing your quote. Consider following up if you haven't heard back within a few days.
    </p>

    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
      <p style="margin: 0; font-size: 12px; color: #999;">
        This is an automated notification from ${companyName}
      </p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

function generateQuoteViewedEmailText({
  quoteNumber,
  customerName,
  viewedAt,
}: {
  quoteNumber: string
  customerName: string
  viewedAt: string
}) {
  return `
Quote Opened

Customer just opened Quote #${quoteNumber}

Quote Number: #${quoteNumber}
Customer: ${customerName}
Viewed At: ${new Date(viewedAt).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })}

This is a positive sign! Your customer is reviewing your quote. Consider following up if you haven't heard back within a few days.

This is an automated notification from Quotd.
  `.trim()
}

/**
 * Send payment received email to team owner
 */
export async function sendPaymentReceivedEmail({
  to,
  amount,
  invoiceNumber,
  customerName,
  companyName,
}: {
  to: string
  amount: number // in cents
  invoiceNumber: string
  customerName: string
  companyName?: string
}) {
  if (!resend) {
    console.warn('[Email] Resend not configured. Skipping payment received email.')
    return { success: false, error: 'Email service not configured' }
  }

  try {
    const html = generatePaymentReceivedEmailHTML({
      amount,
      invoiceNumber,
      customerName,
      companyName,
    })

    const text = generatePaymentReceivedEmailText({
      amount,
      invoiceNumber,
      customerName,
    })

    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM_EMAIL,
      to,
      subject: `Payment Received: $${(amount / 100).toFixed(2)} for Invoice #${invoiceNumber}`,
      html,
      text,
    })

    if (error) {
      console.error('[Email] Error sending payment received email:', error)
      return { success: false, error: error.message }
    }

    console.log('[Email] Payment received email sent successfully:', data?.id)
    return { success: true, id: data?.id }
  } catch (error: any) {
    console.error('[Email] Error sending payment received email:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Send invoice receipt email to customer
 */
export async function sendInvoiceReceiptEmail({
  to,
  invoiceNumber,
  amount,
  companyName,
  companyEmail,
  companyPhone,
  paymentDate,
}: {
  to: string
  invoiceNumber: string
  amount: number // in cents
  companyName: string
  companyEmail?: string
  companyPhone?: string
  paymentDate: string
}) {
  if (!resend) {
    console.warn('[Email] Resend not configured. Skipping invoice receipt email.')
    return { success: false, error: 'Email service not configured' }
  }

  try {
    const html = generateInvoiceReceiptEmailHTML({
      invoiceNumber,
      amount,
      companyName,
      companyEmail,
      companyPhone,
      paymentDate,
    })

    const text = generateInvoiceReceiptEmailText({
      invoiceNumber,
      amount,
      companyName,
      companyEmail,
      companyPhone,
      paymentDate,
    })

    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM_EMAIL,
      to,
      subject: `Receipt for Invoice #${invoiceNumber}`,
      html,
      text,
    })

    if (error) {
      console.error('[Email] Error sending invoice receipt email:', error)
      return { success: false, error: error.message }
    }

    console.log('[Email] Invoice receipt email sent successfully:', data?.id)
    return { success: true, id: data?.id }
  } catch (error: any) {
    console.error('[Email] Error sending invoice receipt email:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Send quote viewed email to team owner
 */
export async function sendQuoteViewedEmail({
  to,
  quoteNumber,
  customerName,
  viewedAt,
  companyName,
}: {
  to: string
  quoteNumber: string
  customerName: string
  viewedAt: string
  companyName?: string
}) {
  if (!resend) {
    console.warn('[Email] Resend not configured. Skipping quote viewed email.')
    return { success: false, error: 'Email service not configured' }
  }

  try {
    const html = generateQuoteViewedEmailHTML({
      quoteNumber,
      customerName,
      viewedAt,
      companyName,
    })

    const text = generateQuoteViewedEmailText({
      quoteNumber,
      customerName,
      viewedAt,
    })

    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM_EMAIL,
      to,
      subject: `Quote #${quoteNumber} Opened by ${customerName}`,
      html,
      text,
    })

    if (error) {
      console.error('[Email] Error sending quote viewed email:', error)
      return { success: false, error: error.message }
    }

    console.log('[Email] Quote viewed email sent successfully:', data?.id)
    return { success: true, id: data?.id }
  } catch (error: any) {
    console.error('[Email] Error sending quote viewed email:', error)
    return { success: false, error: error.message }
  }
}
