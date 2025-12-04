import { redirect } from 'next/navigation'

interface SignupPageProps {
  params: Promise<{}>
  searchParams: Promise<{
    plan?: string
  }>
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  // Signup is handled in the login page with tabbed interface
  // Pass the plan parameter to the login page
  const resolvedSearchParams = await searchParams
  const planParam = resolvedSearchParams?.plan || 'CREW'
  redirect(`/login?plan=${planParam}`)
}

