'use client'

import { Check, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function PricingSection() {
  return (
    <section className="py-24 bg-slate-50 dark:bg-slate-900" id="pricing">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
            Pricing that pays for itself
          </h2>
          <p className="mx-auto mt-4 max-w-[700px] text-slate-500 md:text-xl dark:text-slate-400">
            Stop paying per "seat." Pay for the active schedules you actually manage.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* STARTER TIER */}
          <Card className="flex flex-col border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-2xl">Starter</CardTitle>
              <CardDescription>For the solo operator.</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">$29</span>
                <span className="text-slate-500">/mo</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-3 text-sm">
                <li className="flex items-center">
                  <Check className="mr-2 h-4 w-4 text-green-500" />
                  <span><strong>1 Active Calendar</strong> (You)</span>
                </li>
                <li className="flex items-center">
                  <Check className="mr-2 h-4 w-4 text-green-500" />
                  <span>Unlimited Quotes & Invoices</span>
                </li>
                <li className="flex items-center">
                  <Check className="mr-2 h-4 w-4 text-green-500" />
                  <span>Accept Credit Cards</span>
                </li>
                <li className="flex items-center text-slate-400">
                  <span className="mr-2">✕</span>
                  <span>Scheduling & Dispatch</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button className="w-full" variant="outline">Start Free Trial</Button>
            </CardFooter>
          </Card>

          {/* GROWTH TIER */}
          <Card className="flex flex-col relative border-blue-600 shadow-lg scale-105 z-10">
            <div className="absolute top-0 right-0 -mt-3 -mr-3 px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full">
              MOST POPULAR
            </div>
            <CardHeader>
              <CardTitle className="text-2xl text-blue-600">Growth</CardTitle>
              <CardDescription>For small crews needing dispatch.</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">$99</span>
                <span className="text-slate-500">/mo</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-3 text-sm">
                <li className="flex items-center">
                  <Check className="mr-2 h-4 w-4 text-green-500" />
                  <div className="flex items-center gap-1">
                    <span><strong>Up to 3 Active Calendars</strong></span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger><HelpCircle className="h-3 w-3 text-slate-400" /></TooltipTrigger>
                        <TooltipContent><p>Techs who get jobs assigned. Office admins are free.</p></TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </li>
                <li className="flex items-center">
                  <Check className="mr-2 h-4 w-4 text-green-500" />
                  <span><strong>Magic Link Booking</strong> (Self-serve)</span>
                </li>
                <li className="flex items-center">
                  <Check className="mr-2 h-4 w-4 text-green-500" />
                  <span>Automated SMS Reminders</span>
                </li>
                <li className="flex items-center">
                  <Check className="mr-2 h-4 w-4 text-green-500" />
                  <span>Route Optimization & Maps</span>
                </li>
                <li className="flex items-center">
                  <Check className="mr-2 h-4 w-4 text-green-500" />
                  <span>Deposit & Pre-payment Requests</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">Get Started</Button>
            </CardFooter>
          </Card>

          {/* PRO TIER */}
          <Card className="flex flex-col border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-2xl">Pro</CardTitle>
              <CardDescription>For growing businesses.</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">$199</span>
                <span className="text-slate-500">/mo</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-3 text-sm">
                <li className="flex items-center">
                  <Check className="mr-2 h-4 w-4 text-green-500" />
                  <span><strong>Unlimited Active Calendars</strong></span>
                </li>
                <li className="flex items-center">
                  <Check className="mr-2 h-4 w-4 text-green-500" />
                  <span><strong>AI Booking Agent</strong> (Beta)</span>
                </li>
                <li className="flex items-center">
                  <Check className="mr-2 h-4 w-4 text-green-500" />
                  <span>Smart Duration Estimates</span>
                </li>
                <li className="flex items-center">
                  <Check className="mr-2 h-4 w-4 text-green-500" />
                  <span>Fleet & Equipment Tracking</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Button className="w-full" variant="outline">Contact Sales</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </section>
  )
}

