import SignIn from '@/components/auth/SignIn'

export default function SignInPage() {
  return <SignIn />
}

// Disable static optimization for this page since we need to check auth state
export const dynamic = 'force-dynamic' 