import {redirect} from 'next/navigation';
import ProfileForm from '@/app/_components/ProfileForm';
import {getCurrentUserId} from '@/lib/auth';
import {getProfile} from '@/lib/profile';

function ReadOnlyRow({label, value}: {label: string; value: string | null}) {
  return (
    <div className="flex flex-col gap-1 border-b px-4 py-3 last:border-b-0 sm:flex-row sm:items-baseline sm:gap-4">
      <dt className="w-44 shrink-0 font-mono text-xs tracking-wide text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="min-w-0 truncate font-mono text-sm">{value ?? '—'}</dd>
    </div>
  );
}

export default async function ProfilePage() {
  // proxy.ts guards this route; this is the real check.
  const userId = await getCurrentUserId();
  if (!userId) redirect('/');

  const profile = await getProfile();

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <h1 className="font-heading text-3xl font-semibold tracking-tight">Your profile</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Read from Asgardeo over SCIM 2.0 — editing a name here writes back to the identity provider,
        not to this app&apos;s database.
      </p>

      <div className="mt-8">
        <ProfileForm profile={profile} />
      </div>

      <dl className="mt-6 overflow-hidden rounded-2xl border bg-card">
        <ReadOnlyRow label="Username" value={profile.userName} />
        <ReadOnlyRow label="Email" value={profile.email} />
        <ReadOnlyRow label="SCIM id" value={profile.id} />

        <ReadOnlyRow label="Bookmark owner (sub)" value={userId} />
        <ReadOnlyRow label="Last modified" value={profile.lastModified} />
      </dl>
    </main>
  );
}
