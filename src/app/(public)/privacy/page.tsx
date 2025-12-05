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
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
        <div className="text-gray-600 mb-8 space-y-1">
          <p><strong>Effective Date:</strong> {new Date().toLocaleDateString()}</p>
          <p><strong>Last Updated:</strong> {new Date().toLocaleDateString()}</p>
        </div>

        <div className="prose prose-lg max-w-none space-y-8">
          <section>
            <p className="text-gray-700 leading-relaxed">
              Welcome to Quotd ("we," "our," or "us"). We respect your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, and share information about you when you use our website, mobile application, and services (collectively, the "Service").
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Information We Collect</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">A. Information You Provide</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li><strong>Account Data:</strong> Name, email address, phone number, business name, and password.</li>
                  <li><strong>Billing Data:</strong> Credit card information and billing address (processed securely by Stripe).</li>
                  <li><strong>Customer Data:</strong> Information about your clients (names, addresses, phone numbers) that you input into the Service to create quotes and schedules.</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">B. Information Collected Automatically</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li><strong>Usage Data:</strong> Log files, device information, IP address, and browser type.</li>
                  <li><strong>Location Data:</strong> If you enable location services for scheduling features, we collect your precise location data.</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. How We Use Your Information</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We use your data to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Provide, maintain, and improve the Service.</li>
              <li>Process payments and facilitate financial transactions.</li>
              <li>Send you technical notices, updates, and security alerts.</li>
              <li><strong>AI Features:</strong> We may use anonymized data to improve our smart scheduling and quoting algorithms.</li>
              <li><strong>SMS/Email:</strong> Send appointment reminders and quotes to your customers on your behalf.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Sharing of Information</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We do not sell your personal data. We share data only with:
            </p>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Service Providers:</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li><strong>Stripe:</strong> For payment processing and identity verification.</li>
                  <li><strong>Twilio/Resend:</strong> For sending SMS and email notifications.</li>
                  <li><strong>Anthropic/OpenAI:</strong> For AI-assisted features (e.g., smart drafting).</li>
                </ul>
              </div>
              <p className="text-gray-700 leading-relaxed">
                <strong>Legal Compliance:</strong> If required by law, subpoena, or legal process.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Data Security</h2>
            <p className="text-gray-700 leading-relaxed">
              We implement industry-standard security measures, including encryption and secure server infrastructure, to protect your data. However, no method of transmission over the Internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Your Rights</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              You have the right to:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Access the personal data we hold about you.</li>
              <li>Request correction or deletion of your data.</li>
              <li>Opt-out of marketing communications.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Contact Us</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have questions about this policy, please contact us at:
            </p>
            <div className="mt-4 space-y-1 text-gray-700">
              <p><strong>Email:</strong> support@quotd.app</p>
              <p><strong>Address:</strong> [Your Company Address]</p>
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

