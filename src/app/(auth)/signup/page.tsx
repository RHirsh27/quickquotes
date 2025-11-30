import { redirect } from 'next/navigation'

export default function SignupPage() {
  // Signup is handled in the login page with tabbed interface
  // Redirect to login page which will show the signup tab
  redirect('/login')
}

