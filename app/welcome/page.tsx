import {redirect} from 'next/navigation';
import {getSessionId} from '@/lib/auth';

// Asgardeo's Access URL for this app points here, so it is where a sign-up
// lands once the registration flow's countdown fires. Straight to /authorize:
// with forceAuth=false Asgardeo reuses a session if it has one and returns a
// code without rendering anything, and shows its login page when it does not.
export default async function WelcomePage() {
  if (await getSessionId()) redirect('/dashboard');
  redirect('/api/sign-in');
}
