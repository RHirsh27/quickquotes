import Link from 'next/link'
import { Button } from '@/components/ui'

export const metadata = {
  title: 'Terms of Service | Quotd',
  description: 'Terms of Service for Quotd - Instant Estimates for Trades',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-extrabold text-gray-900" style={{ fontWeight: 800 }}>
              Quotd
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost">Log In</Button>
              </Link>
              <Link href="/signup?plan=CREW">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
        <div className="text-gray-600 mb-8 space-y-1">
          <p><strong>Effective Date:</strong> {new Date().toLocaleDateString()}</p>
        </div>

        <div className="prose prose-lg max-w-none space-y-8">
          <section>
            <p className="text-gray-700 leading-relaxed">
              Please read these Terms of Service ("Terms") carefully before using Quotd. By accessing or using the Service, you agree to be bound by these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Accounts</h2>
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                <strong>1.1 Eligibility:</strong> You must be at least 18 years old to use the Service.
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>1.2 Security:</strong> You are responsible for maintaining the confidentiality of your account credentials. You are responsible for all activities that occur under your account.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Subscriptions and Payments</h2>
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                <strong>2.1 Fees:</strong> You agree to pay all fees associated with your selected subscription plan (e.g., Starter, Growth, Pro).
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>2.2 Billing Cycle:</strong> Subscriptions are billed in advance on a monthly or annual basis.
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>2.3 Cancellation:</strong> You may cancel your subscription at any time via the Dashboard. Your access will continue until the end of the current billing period. <strong>We do not offer refunds for partial months.</strong>
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>2.4 Platform Fees:</strong> If you use Quotd Payments to collect money from your clients, we charge a platform fee (e.g., 1%) in addition to standard processing fees. This fee is deducted automatically from the transaction.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Acceptable Use</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              You agree not to use the Service to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Process payments for illegal goods or services.</li>
              <li>Send spam or unsolicited messages via our SMS/Email tools.</li>
              <li>Violate any applicable laws or regulations.</li>
              <li>Reverse engineer or attempt to extract the source code of the Service.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Intellectual Property</h2>
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                <strong>4.1 Your Content:</strong> You retain ownership of the data (quotes, customer lists) you upload. You grant us a license to use this data solely to provide the Service to you.
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>4.2 Our IP:</strong> Quotd, its logo, and the software are the exclusive property of [Your Company Name].
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Limitation of Liability</h2>
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed font-semibold">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, QUOTD SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY.
              </p>
              <p className="text-gray-700 leading-relaxed font-semibold">
                OUR TOTAL LIABILITY FOR ANY CLAIM ARISING OUT OF OR RELATING TO THESE TERMS OR THE SERVICE SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE PAST 12 MONTHS.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. SMS and Messaging</h2>
            <p className="text-gray-700 leading-relaxed">
              By using our Service to communicate with your customers, you represent that you have obtained all necessary consents from your customers to send them SMS and email messages in compliance with the TCPA and other applicable laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Changes to Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to modify these Terms at any time. We will provide notice of any material changes via email or the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Contact Information</h2>
            <div className="mt-4 space-y-1 text-gray-700">
              <p><strong>[Your Company Name]</strong></p>
              <p><strong>[Your Support Email]</strong></p>
            </div>
          </section>
        </div>

        {/* Back to Home */}
        <div className="mt-12 pt-8 border-t">
          <Link href="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

