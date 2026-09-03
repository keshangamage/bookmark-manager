'use client';

import {User} from '@asgardeo/nextjs';

// Client Component: <User> takes a render prop, which a Server Component can't pass.
export default function UserBadge() {
  return (
    <User>
      {(user) => (
        <span className="text-sm text-zinc-600 dark:text-zinc-400">
          Signed in as{' '}
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            {user.email ?? user.username ?? user.userName ?? user.sub}
          </span>
        </span>
      )}
    </User>
  );
}
