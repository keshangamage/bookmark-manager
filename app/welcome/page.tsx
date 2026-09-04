import {redirect} from 'next/navigation';
import {getSessionId, hasTriedSilentSignIn} from '@/lib/auth';


export default async function WelcomePage() {
  if (await getSessionId()) redirect('/dashboard');
  // Fall back to the hosted login page, not the landing page: someone who
  // reached /welcome has already decided to get into the app.
  if (await hasTriedSilentSignIn()) redirect('/api/sign-in');
  redirect('/api/silent-sign-in');
}
