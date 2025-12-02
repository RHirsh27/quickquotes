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
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms of Service</h1>
        <p className="text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="prose prose-lg max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              By accessing and using Quotd ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these Terms of Service, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Description of Service</h2>
            <p className="text-gray-700 leading-relaxed">
              Quotd is a software-as-a-service platform that enables tradespeople and service professionals to create, manage, and send professional quotes and invoices to their customers. The Service includes features such as PDF generation, customer management, payment processing, and related tools.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Subscription and Payment</h2>
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                <strong>3.1 Subscription Plans:</strong> Quotd offers various subscription plans with different features and user limits. You may upgrade, downgrade, or cancel your subscription at any time through your account settings.
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>3.2 Payment Terms:</strong> Subscription fees are billed in advance on a monthly or annual basis, depending on your selected plan. All fees are non-refundable except as required by law.
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>3.3 Platform Fees:</strong> Quotd charges a platform fee (currently 1%) on payments processed through the Service. This fee is non-refundable and is automatically deducted from payments received.
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>3.4 Price Changes:</strong> We reserve the right to modify subscription fees at any time. Price changes will be communicated to you at least 30 days in advance and will take effect at the start of your next billing cycle.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Subscription Cancellation Policy</h2>
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                <strong>4.1 Cancellation Notice:</strong> You may cancel your subscription at any time by providing at least 30 days written notice through your account settings or by contacting support.
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>4.2 Effect of Cancellation:</strong> Upon cancellation, your subscription will remain active until the end of your current billing period. You will continue to have access to all features until that time.
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>4.3 No Refunds:</strong> Subscription fees and platform fees are non-refundable. No refunds will be provided for partial billing periods, unused features, or any other reason except as required by applicable law.
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>4.4 Data Retention:</strong> After cancellation, you may export your data for up to 30 days. After this period, we reserve the right to delete your account and all associated data.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. No Warranty</h2>
            <p className="text-gray-700 leading-relaxed">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING, BUT NOT LIMITED TO, IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE, OR THAT DEFECTS WILL BE CORRECTED.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Limitation of Liability</h2>
            <p className="text-gray-700 leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, QUOTD SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES RESULTING FROM YOUR USE OF THE SERVICE.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. User Responsibilities</h2>
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                <strong>7.1 Account Security:</strong> You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>7.2 Compliance:</strong> You agree to use the Service in compliance with all applicable laws and regulations. You are solely responsible for the content of quotes, invoices, and communications sent through the Service.
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>7.3 Prohibited Uses:</strong> You may not use the Service for any illegal or unauthorized purpose, or in any way that violates these Terms of Service.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Intellectual Property</h2>
            <p className="text-gray-700 leading-relaxed">
              The Service and its original content, features, and functionality are owned by Quotd and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws. You retain ownership of all content you create using the Service, but grant us a license to use, store, and process such content as necessary to provide the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Termination</h2>
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason, including if you breach these Terms of Service. Upon termination, your right to use the Service will immediately cease.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Changes to Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to modify or replace these Terms of Service at any time. If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect. Your continued use of the Service after any changes constitutes acceptance of the new Terms of Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Contact Information</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have any questions about these Terms of Service, please contact us at support@quotd.app.
            </p>
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

