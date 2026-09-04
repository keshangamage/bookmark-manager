import {redirect} from 'next/navigation';
import {getSessionId, hasTriedSilentSignIn} from '@/lib/auth';


export default async function WelcomePage() {
  if (await getSessionId()) redirect('/dashboard');
  if (await hasTriedSilentSignIn()) redirect('/');
  redirect('/api/silent-sign-in');
}
