import { redirect } from 'next/navigation'

interface SignupPageProps {
  searchParams?: {
    plan?: string
  }
}

export default function SignupPage({ searchParams }: SignupPageProps = {}) {
  // Signup is handled in the login page with tabbed interface
  // Pass the plan parameter to the login page
  const planParam = searchParams?.plan || 'CREW'
  redirect(`/login?plan=${planParam}`)
}

