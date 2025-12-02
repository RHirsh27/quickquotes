import Link from 'next/link'
import { Button } from '@/components/ui'

export const metadata = {
  title: 'Privacy Policy | Quotd',
  description: 'Privacy Policy for Quotd - Instant Estimates for Trades',
}

export default function PrivacyPage() {
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
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
        <p className="text-gray-600 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="prose prose-lg max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-700 leading-relaxed">
              Quotd ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Service. Please read this Privacy Policy carefully. If you do not agree with the terms of this Privacy Policy, please do not access the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">2.1 Information You Provide</h3>
                <p className="text-gray-700 leading-relaxed">
                  We collect information that you provide directly to us, including:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li>Account information (name, email address, phone number, company name)</li>
                  <li>Business information (address, tax ID, payment preferences)</li>
                  <li>Customer data (names, contact information, addresses)</li>
                  <li>Quote and invoice data (line items, pricing, notes)</li>
                  <li>Payment information (processed securely through Stripe)</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">2.2 Automatically Collected Information</h3>
                <p className="text-gray-700 leading-relaxed">
                  We automatically collect certain information when you use the Service, including:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li>Device information (IP address, browser type, operating system)</li>
                  <li>Usage data (pages visited, features used, time spent)</li>
                  <li>Cookies and similar tracking technologies</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Provide, maintain, and improve the Service</li>
              <li>Process transactions and send related information</li>
              <li>Send you technical notices, updates, and support messages</li>
              <li>Respond to your comments, questions, and requests</li>
              <li>Monitor and analyze trends, usage, and activities</li>
              <li>Detect, prevent, and address technical issues and security threats</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Data Storage and Security</h2>
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                <strong>4.1 Data Storage:</strong> Your data is stored securely on Supabase, a cloud database platform that provides enterprise-grade security and compliance. All data is encrypted in transit and at rest.
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>4.2 Security Measures:</strong> We implement appropriate technical and organizational measures to protect your information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure.
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>4.3 Payment Processing:</strong> Payment information is processed securely through Stripe, a PCI-compliant payment processor. We do not store your full payment card details on our servers.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Sharing and Disclosure</h2>
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                <strong>5.1 We Do Not Sell Your Data:</strong> We do not sell, trade, or rent your personal information to third parties. Your data is used solely to provide and improve the Service.
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>5.2 Service Providers:</strong> We may share your information with trusted third-party service providers who assist us in operating the Service, including:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Supabase:</strong> For secure database storage and authentication</li>
                <li><strong>Stripe:</strong> For payment processing and subscription management</li>
                <li><strong>Vercel:</strong> For hosting and infrastructure</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                These service providers are contractually obligated to protect your information and use it only for the purposes we specify.
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>5.3 Legal Requirements:</strong> We may disclose your information if required by law or in response to valid requests by public authorities.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Your Rights and Choices</h2>
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                You have the right to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Access and receive a copy of your personal data</li>
                <li>Rectify inaccurate or incomplete data</li>
                <li>Request deletion of your personal data</li>
                <li>Object to processing of your personal data</li>
                <li>Request restriction of processing</li>
                <li>Data portability (export your data)</li>
                <li>Withdraw consent at any time</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                To exercise these rights, please contact us at support@quotd.app.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Cookies and Tracking Technologies</h2>
            <p className="text-gray-700 leading-relaxed">
              We use cookies and similar tracking technologies to track activity on the Service and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Data Retention</h2>
            <p className="text-gray-700 leading-relaxed">
              We retain your personal information for as long as necessary to provide the Service and fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law. When you cancel your account, we will retain your data for up to 30 days to allow for data export, after which it will be deleted.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Children's Privacy</h2>
            <p className="text-gray-700 leading-relaxed">
              The Service is not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If you become aware that a child has provided us with personal information, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. International Data Transfers</h2>
            <p className="text-gray-700 leading-relaxed">
              Your information may be transferred to and processed in countries other than your country of residence. These countries may have data protection laws that differ from those in your country. We take appropriate safeguards to ensure your information receives an adequate level of protection.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Changes to This Privacy Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contact Us</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us at support@quotd.app.
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

