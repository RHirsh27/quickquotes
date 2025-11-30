import Link from 'next/link'
import { Button } from '@/components/ui'
import { 
  FileText, 
  Users, 
  Send, 
  CheckCircle, 
  Zap, 
  Smartphone, 
  Mail, 
  MessageCircle,
  ArrowRight,
  Hammer,
  Clock,
  DollarSign
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-gray-900">
              QuickQuotes
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost">Log In</Button>
              </Link>
              <Link href="/login">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              The Fastest Way to Quote Trade Jobs
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Stop wrestling with paperwork. Send professional PDF estimates from your phone before you even leave the driveway.
            </p>
            <Link href="/login">
              <Button className="text-lg px-8 py-6 h-auto">
                Start Quoting for Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
          <div className="bg-gray-200 rounded-xl p-8 md:p-12 flex items-center justify-center min-h-[400px]">
            <div className="text-center text-gray-500">
              <Smartphone className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium">App Screenshot</p>
              <p className="text-sm mt-2">Mobile interface preview</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pain Points Section */}
      <section className="bg-gray-50 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
            Stop Losing Time and Money
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
              <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <Clock className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">No More Nightly Paperwork</h3>
              <p className="text-gray-600">
                Quote on-site, send instantly. No more spending hours at the kitchen table after a long day.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Look Professional</h3>
              <p className="text-gray-600">
                Send polished PDF estimates with your logo and branding. Build trust with customers instantly.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Get Paid Faster</h3>
              <p className="text-gray-600">
                Send quotes immediately while you're still on-site. Faster quotes mean faster approvals and payments.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
          How It Works
        </h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              1
            </div>
            <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-10 w-10 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Add Customer</h3>
            <p className="text-gray-600">
              Select an existing customer or add a new one on the spot. All their info is saved for next time.
            </p>
          </div>
          <div className="text-center">
            <div className="bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              2
            </div>
            <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Hammer className="h-10 w-10 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Add Line Items</h3>
            <p className="text-gray-600">
              Use your saved presets or add custom items. Calculate totals with tax in real-time.
            </p>
          </div>
          <div className="text-center">
            <div className="bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
              3
            </div>
            <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Send className="h-10 w-10 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Send PDF</h3>
            <p className="text-gray-600">
              One tap to send via text or email. Your customer gets a professional PDF estimate instantly.
            </p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-gray-50 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
            Everything You Need
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <FileText className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">PDF Generation</h3>
              <p className="text-gray-600 text-sm">
                Professional PDF estimates with your branding, ready to send or print.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <Users className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Customer History</h3>
              <p className="text-gray-600 text-sm">
                Keep track of all your customers and their quote history in one place.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <Zap className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">One-Tap Presets</h3>
              <p className="text-gray-600 text-sm">
                Save your common services and add them to quotes with a single tap.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <Smartphone className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Mobile-First</h3>
              <p className="text-gray-600 text-sm">
                Built for your phone. Quote jobs from anywhere, anytime.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <MessageCircle className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Text & Email</h3>
              <p className="text-gray-600 text-sm">
                Send quotes directly via text message or email with one tap.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <CheckCircle className="h-12 w-12 text-blue-600 mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">Real-Time Math</h3>
              <p className="text-gray-600 text-sm">
                Automatic calculations for subtotals, tax, and totals as you build quotes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
          Simple, Transparent Pricing
        </h2>
        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Free Plan */}
          <div className="bg-white border-2 border-gray-200 rounded-xl p-8 text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Free Forever</h3>
            <div className="text-4xl font-bold text-gray-900 mb-1">$0</div>
            <p className="text-gray-500 mb-6">per month</p>
            <ul className="text-left space-y-3 mb-8">
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2 flex-shrink-0" />
                <span className="text-gray-600">Up to 3 quotes per month</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2 flex-shrink-0" />
                <span className="text-gray-600">PDF generation</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2 flex-shrink-0" />
                <span className="text-gray-600">Customer management</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2 flex-shrink-0" />
                <span className="text-gray-600">Mobile app access</span>
              </li>
            </ul>
            <Link href="/login" className="block">
              <Button variant="outline" className="w-full">
                Get Started Free
              </Button>
            </Link>
          </div>

          {/* Pro Plan */}
          <div className="bg-blue-600 border-2 border-blue-600 rounded-xl p-8 text-center text-white relative">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <span className="bg-yellow-400 text-gray-900 px-4 py-1 rounded-full text-sm font-bold">
                POPULAR
              </span>
            </div>
            <h3 className="text-2xl font-bold mb-2">Pro</h3>
            <div className="text-4xl font-bold mb-1">$19</div>
            <p className="text-blue-100 mb-6">per month</p>
            <ul className="text-left space-y-3 mb-8">
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-white mr-2 flex-shrink-0" />
                <span>Unlimited quotes</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-white mr-2 flex-shrink-0" />
                <span>Everything in Free</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-white mr-2 flex-shrink-0" />
                <span>Priority support</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-white mr-2 flex-shrink-0" />
                <span>Advanced features</span>
              </li>
            </ul>
            <Link href="/login" className="block">
              <Button className="w-full bg-white text-blue-600 hover:bg-gray-100">
                Start Pro Trial
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 py-16 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Quote Faster?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of tradespeople who are already saving time and winning more jobs.
          </p>
          <Link href="/login">
            <Button className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-6 h-auto">
              Start Quoting for Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-white font-bold text-lg mb-4">QuickQuotes</h4>
              <p className="text-sm">
                The fastest way to quote trade jobs. Built for tradespeople, by tradespeople.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/login" className="hover:text-white">Features</Link></li>
                <li><Link href="/login" className="hover:text-white">Pricing</Link></li>
                <li><Link href="/login" className="hover:text-white">How It Works</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/login" className="hover:text-white">About</Link></li>
                <li><Link href="/login" className="hover:text-white">Contact</Link></li>
                <li><Link href="/login" className="hover:text-white">Support</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/login" className="hover:text-white">Privacy</Link></li>
                <li><Link href="/login" className="hover:text-white">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; {new Date().getFullYear()} QuickQuotes. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
