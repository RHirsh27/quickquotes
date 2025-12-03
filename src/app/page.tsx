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
import { getAllPlans } from '@/config/pricing'

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
              The Operating System for the Modern Trade Pro.
            </h1>
            <p className="text-xl text-slate-400 mb-8 leading-relaxed">
              Ditch the paperwork. Quote, invoice, and get paid from your truck in seconds.
            </p>
            <Link href="/signup?plan=CREW">
              <Button className="bg-blue-600 hover:bg-blue-500 text-white text-lg px-8 py-6 h-auto shadow-[0_0_20px_rgba(37,99,235,0.5)]">
                Start Quoting for Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
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
          <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-12 tracking-tight">
            Stop Losing Time and Money
          </h2>
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
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Look Professional</h3>
              <p className="text-slate-400">
                Send polished PDF estimates with your logo and branding. Build trust with customers instantly.
              </p>
            </div>
            <div className="bg-slate-900/50 backdrop-blur-sm p-8 rounded-xl border border-slate-800 hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/10">
              <div className="bg-green-500/10 w-16 h-16 rounded-full flex items-center justify-center mb-4 border border-green-500/20">
                <DollarSign className="h-8 w-8 text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Get Paid Faster</h3>
              <p className="text-slate-400">
                Send quotes immediately while you're still on-site. Faster quotes mean faster approvals and payments.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative container mx-auto px-4 py-16 md:py-24">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-12 tracking-tight">
          How It Works
        </h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-[0_0_20px_rgba(37,99,235,0.5)]">
              1
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-10 w-10 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Add Customer</h3>
            <p className="text-slate-400">
              Select an existing customer or add a new one on the spot. All their info is saved for next time.
            </p>
          </div>
          <div className="text-center">
            <div className="bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-[0_0_20px_rgba(37,99,235,0.5)]">
              2
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Hammer className="h-10 w-10 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Add Line Items</h3>
            <p className="text-slate-400">
              Use your saved presets or add custom items. Calculate totals with tax in real-time.
            </p>
          </div>
          <div className="text-center">
            <div className="bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-[0_0_20px_rgba(37,99,235,0.5)]">
              3
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Send className="h-10 w-10 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Send PDF</h3>
            <p className="text-slate-400">
              One tap to send via text or email. Your customer gets a professional PDF estimate instantly.
            </p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-12 tracking-tight">
            Everything You Need
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-slate-900/50 backdrop-blur-sm p-6 rounded-xl border border-slate-800 hover:border-blue-500/50 transition-all">
              <FileText className="h-12 w-12 text-blue-500 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">PDF Generation</h3>
              <p className="text-slate-400 text-sm">
                Professional PDF estimates with your branding, ready to send or print.
              </p>
            </div>
            <div className="bg-slate-900/50 backdrop-blur-sm p-6 rounded-xl border border-slate-800 hover:border-blue-500/50 transition-all">
              <Users className="h-12 w-12 text-blue-500 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Customer History</h3>
              <p className="text-slate-400 text-sm">
                Keep track of all your customers and their quote history in one place.
              </p>
            </div>
            <div className="bg-slate-900/50 backdrop-blur-sm p-6 rounded-xl border border-slate-800 hover:border-blue-500/50 transition-all">
              <Zap className="h-12 w-12 text-blue-500 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">One-Tap Presets</h3>
              <p className="text-slate-400 text-sm">
                Save your common services and add them to quotes with a single tap.
              </p>
            </div>
            <div className="bg-slate-900/50 backdrop-blur-sm p-6 rounded-xl border border-slate-800 hover:border-blue-500/50 transition-all">
              <Smartphone className="h-12 w-12 text-blue-500 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Mobile-First</h3>
              <p className="text-slate-400 text-sm">
                Built for your phone. Quote jobs from anywhere, anytime.
              </p>
            </div>
            <div className="bg-slate-900/50 backdrop-blur-sm p-6 rounded-xl border border-slate-800 hover:border-blue-500/50 transition-all">
              <MessageCircle className="h-12 w-12 text-blue-500 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Text & Email</h3>
              <p className="text-slate-400 text-sm">
                Send quotes directly via text message or email with one tap.
              </p>
            </div>
            <div className="bg-slate-900/50 backdrop-blur-sm p-6 rounded-xl border border-slate-800 hover:border-blue-500/50 transition-all">
              <CheckCircle className="h-12 w-12 text-blue-500 mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Real-Time Math</h3>
              <p className="text-slate-400 text-sm">
                Automatic calculations for subtotals, tax, and totals as you build quotes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="relative container mx-auto px-4 py-16 md:py-24">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-12 tracking-tight">
          Simple, Transparent Pricing
        </h2>
        {/* Pricing Cards - Clean 3 Card Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {getAllPlans().map((plan) => {
            const isHighlighted = plan.label === 'Best Value'
            return (
              <div
                key={plan.id}
                className={`relative bg-slate-900/50 backdrop-blur-sm rounded-xl border-2 transition-all hover:shadow-xl ${
                  isHighlighted
                    ? 'border-blue-600 scale-105 md:scale-110 shadow-[0_0_40px_rgba(37,99,235,0.3)]'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Radial Glow for Highlighted Card */}
                {isHighlighted && (
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/30 to-blue-400/30 rounded-xl blur-xl opacity-50 -z-10" />
                )}
                
                {/* Badge */}
                {plan.label && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className={`px-4 py-1 rounded-full text-sm font-semibold ${
                      isHighlighted
                        ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.5)]'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}>
                      {plan.label}
                    </span>
                  </div>
                )}

                <div className="p-8">
                  {/* Plan Name */}
                  <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">
                    {plan.name}
                  </h3>

                  {/* Description */}
                  {plan.description && (
                    <p className="text-slate-400 mb-4 text-sm">{plan.description}</p>
                  )}

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-white">
                        ${plan.price}
                      </span>
                      <span className="text-slate-400">/{plan.interval}</span>
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-slate-300">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Footer (for Team plan overage) */}
                  {plan.footer && (
                    <p className="text-xs text-slate-500 mb-4 text-center">
                      {plan.footer}
                    </p>
                  )}

                  {/* CTA Button */}
                  <Link href={`/signup?plan=${plan.id}`} className="block">
                    <Button
                      className={`w-full ${
                        isHighlighted
                          ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.5)]'
                          : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                      }`}
                    >
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-16 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="bg-gradient-to-r from-blue-600/20 to-blue-400/20 backdrop-blur-sm border border-blue-500/30 rounded-2xl p-12 max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
              Ready to Quote Faster?
            </h2>
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              Join thousands of tradespeople who are already saving time and winning more jobs.
            </p>
            <Link href="/signup?plan=CREW">
              <Button className="bg-blue-600 hover:bg-blue-500 text-white text-lg px-8 py-6 h-auto shadow-[0_0_20px_rgba(37,99,235,0.5)]">
                Start Quoting for Free
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
