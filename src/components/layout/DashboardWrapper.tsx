'use client'

import { ErrorBoundary } from '@/components/ErrorBoundary'

export function DashboardWrapper({ children }: { children: React.ReactNode }) {
  return <ErrorBoundary>{children}</ErrorBoundary>
}

