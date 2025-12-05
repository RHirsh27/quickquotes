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
  DollarSign,
  Calendar,
  MapPin,
  Route,
  CreditCard,
  TrendingUp,
  Shield
} from 'lucide-react'
import { PricingSection } from '@/components/landing/PricingSection'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Background Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-radial from-blue-900/20 via-slate-950 to-slate-950 pointer-events-none" />
      
      {/* Subtle Grid Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}
      />

      {/* Navbar */}
      <nav className="relative backdrop-blur-md bg-slate-950/50 border-b border-slate-800/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-extrabold text-white tracking-tight" style={{ fontWeight: 800 }}>
              Quotd
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-800/50">
                  Log In
                </Button>
              </Link>
              <Link href="/signup?plan=CREW">
                <Button className="bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.5)]">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative container mx-auto px-4 py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight tracking-tight">
              Stop Playing Phone Tag. Start Filling Your Schedule.
            </h1>
            <p className="text-xl text-slate-400 mb-8 leading-relaxed">
              The all-in-one operating system for trades. Quote the job, schedule the visit, and get paid—without a single phone call.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/signup?plan=CREW">
                <Button className="bg-blue-600 hover:bg-blue-500 text-white text-lg px-8 py-6 h-auto shadow-[0_0_20px_rgba(37,99,235,0.5)] w-full sm:w-auto">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="#features">
                <Button variant="outline" className="text-white border-slate-700 hover:bg-slate-800/50 text-lg px-8 py-6 h-auto w-full sm:w-auto">
                  See How It Works
                </Button>
              </Link>
            </div>
          </div>
          <div className="relative">
            {/* Device Mockup Container */}
            <div className="bg-slate-900/50 backdrop-blur-sm border-2 border-slate-800 rounded-xl p-8 md:p-12 shadow-2xl shadow-blue-900/20">
              <div className="bg-slate-800 rounded-lg p-8 flex items-center justify-center min-h-[400px] border border-slate-700/50">
                <div className="text-center">
                  <Smartphone className="h-16 w-16 mx-auto mb-4 text-blue-500" />
                  <p className="text-lg font-medium text-slate-300">App Screenshot</p>
                  <p className="text-sm mt-2 text-slate-500">Mobile interface preview</p>
                </div>
              </div>
            </div>
            {/* Glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 to-blue-400/20 rounded-xl blur-xl opacity-50 -z-10" />
          </div>
        </div>
      </section>

      {/* Pain Points Section */}
      <section className="relative py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-4 tracking-tight">
            Stop Losing Time and Money
          </h2>
          <p className="text-center text-slate-400 mb-12 max-w-2xl mx-auto">
            You're running a business, not a spreadsheet. Get everything you need in one place.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-900/50 backdrop-blur-sm p-8 rounded-xl border border-slate-800 hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/10">
              <div className="bg-red-500/10 w-16 h-16 rounded-full flex items-center justify-center mb-4 border border-red-500/20">
                <Clock className="h-8 w-8 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">No More Nightly Paperwork</h3>
              <p className="text-slate-400">
                Quote on-site, send instantly. No more spending hours at the kitchen table after a long day.
              </p>
            </div>
            <div className="bg-slate-900/50 backdrop-blur-sm p-8 rounded-xl border border-slate-800 hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/10">
              <div className="bg-blue-500/10 w-16 h-16 rounded-full flex items-center justify-center mb-4 border border-blue-500/20">
                <Calendar className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Stop Double-Booking</h3>
              <p className="text-slate-400">
                Smart scheduling with travel time warnings. See your whole crew's calendar at a glance.
              </p>
            </div>
            <div className="bg-slate-900/50 backdrop-blur-sm p-8 rounded-xl border border-slate-800 hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/10">
              <div className="bg-green-500/10 w-16 h-16 rounded-full flex items-center justify-center mb-4 border border-green-500/20">
                <DollarSign className="h-8 w-8 text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Get Paid Faster</h3>
              <p className="text-slate-400">
                Accept credit cards on-site. Send payment links. Get paid before you leave the job.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative container mx-auto px-4 py-16 md:py-24">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-4 tracking-tight">
          How It Works
        </h2>
        <p className="text-center text-slate-400 mb-12 max-w-2xl mx-auto">
          From quote to payment, all in one place. No more switching between apps.
        </p>
        <div className="grid md:grid-cols-4 gap-8 max-w-6xl mx-auto">
          <div className="text-center">
            <div className="bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-[0_0_20px_rgba(37,99,235,0.5)]">
              1
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-10 w-10 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Create Quote</h3>
            <p className="text-slate-400">
              Build professional estimates on-site. Use presets or custom items. Send instantly.
            </p>
          </div>
          <div className="text-center">
            <div className="bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-[0_0_20px_rgba(37,99,235,0.5)]">
              2
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-10 w-10 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Schedule Job</h3>
            <p className="text-slate-400">
              Convert approved quotes to jobs. Assign to your crew. See everyone's schedule at a glance.
            </p>
          </div>
          <div className="text-center">
            <div className="bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-[0_0_20px_rgba(37,99,235,0.5)]">
              3
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Route className="h-10 w-10 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Dispatch & Track</h3>
            <p className="text-slate-400">
              Optimize routes with travel time warnings. Send automated reminders. Never double-book.
            </p>
          </div>
          <div className="text-center">
            <div className="bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-[0_0_20px_rgba(37,99,235,0.5)]">
              4
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="h-10 w-10 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Get Paid</h3>
            <p className="text-slate-400">
              Convert to invoice. Send payment link. Accept credit cards. Get paid before you leave.
            </p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="relative py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-4 tracking-tight">
            Everything You Need to Run Your Business
          </h2>
          <p className="text-center text-slate-400 mb-12 max-w-2xl mx-auto">
            One platform. Zero spreadsheets. Maximum efficiency.
          </p>
          
          {/* Core Features */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-white mb-6 text-center">Quoting & Invoicing</h3>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="bg-slate-900/50 backdrop-blur-sm p-6 rounded-xl border border-slate-800 hover:border-blue-500/50 transition-all">
                <FileText className="h-12 w-12 text-blue-500 mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">Professional PDFs</h3>
                <p className="text-slate-400 text-sm">
                  Branded estimates and invoices that build trust with customers.
                </p>
              </div>
              <div className="bg-slate-900/50 backdrop-blur-sm p-6 rounded-xl border border-slate-800 hover:border-blue-500/50 transition-all">
                <Users className="h-12 w-12 text-blue-500 mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">Customer History</h3>
                <p className="text-slate-400 text-sm">
                  Track all quotes, invoices, and payments for every customer.
                </p>
              </div>
              <div className="bg-slate-900/50 backdrop-blur-sm p-6 rounded-xl border border-slate-800 hover:border-blue-500/50 transition-all">
                <CreditCard className="h-12 w-12 text-blue-500 mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">Accept Payments</h3>
                <p className="text-slate-400 text-sm">
                  Credit cards, payment links, and deposits—all in one place.
                </p>
              </div>
            </div>
          </div>

          {/* Scheduling & Dispatch */}
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-white mb-6 text-center">Scheduling & Dispatch</h3>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="bg-slate-900/50 backdrop-blur-sm p-6 rounded-xl border border-slate-800 hover:border-blue-500/50 transition-all">
                <Calendar className="h-12 w-12 text-blue-500 mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">Smart Scheduling</h3>
                <p className="text-slate-400 text-sm">
                  Visual calendar with travel time warnings. Never double-book again.
                </p>
              </div>
              <div className="bg-slate-900/50 backdrop-blur-sm p-6 rounded-xl border border-slate-800 hover:border-blue-500/50 transition-all">
                <Route className="h-12 w-12 text-blue-500 mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">Route Optimization</h3>
                <p className="text-slate-400 text-sm">
                  See travel times between jobs. Optimize your crew's daily routes.
                </p>
              </div>
              <div className="bg-slate-900/50 backdrop-blur-sm p-6 rounded-xl border border-slate-800 hover:border-blue-500/50 transition-all">
                <MessageCircle className="h-12 w-12 text-blue-500 mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">Auto Reminders</h3>
                <p className="text-slate-400 text-sm">
                  SMS and email reminders sent automatically to customers.
                </p>
              </div>
            </div>
          </div>

          {/* Fintech Features */}
          <div>
            <h3 className="text-2xl font-bold text-white mb-6 text-center">Financial Tools</h3>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="bg-slate-900/50 backdrop-blur-sm p-6 rounded-xl border border-slate-800 hover:border-blue-500/50 transition-all">
                <TrendingUp className="h-12 w-12 text-blue-500 mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">Revenue Tracking</h3>
                <p className="text-slate-400 text-sm">
                  See your cash flow, outstanding invoices, and payment history.
                </p>
              </div>
              <div className="bg-slate-900/50 backdrop-blur-sm p-6 rounded-xl border border-slate-800 hover:border-blue-500/50 transition-all">
                <Shield className="h-12 w-12 text-blue-500 mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">Risk Profiles</h3>
                <p className="text-slate-400 text-sm">
                  Build your business credit profile with automated metrics tracking.
                </p>
              </div>
              <div className="bg-slate-900/50 backdrop-blur-sm p-6 rounded-xl border border-slate-800 hover:border-blue-500/50 transition-all">
                <Zap className="h-12 w-12 text-blue-500 mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">Smart Estimates</h3>
                <p className="text-slate-400 text-sm">
                  AI-powered duration estimates based on your service history.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <PricingSection />

      {/* CTA Section */}
      <section className="relative py-16 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="bg-gradient-to-r from-blue-600/20 to-blue-400/20 backdrop-blur-sm border border-blue-500/30 rounded-2xl p-12 max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
              Ready to Run Your Business Better?
            </h2>
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              Join tradespeople who are already saving hours every week and getting paid faster.
            </p>
            <Link href="/signup?plan=CREW">
              <Button className="bg-blue-600 hover:bg-blue-500 text-white text-lg px-8 py-6 h-auto shadow-[0_0_20px_rgba(37,99,235,0.5)]">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-slate-950 border-t border-slate-800 text-slate-400 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-white font-extrabold text-lg mb-4 tracking-tight" style={{ fontWeight: 800 }}>Quotd</h4>
              <p className="text-sm text-slate-500">
                Instant Estimates. Built for tradespeople, by tradespeople.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/login" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">How It Works</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/login" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Support</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-sm text-slate-500">
            <p>&copy; {new Date().getFullYear()} Quotd. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
