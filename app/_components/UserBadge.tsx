'use client';

import {User} from '@asgardeo/nextjs';

// Client Component: <User> takes a render prop, which a Server Component can't pass.
export default function UserBadge() {
  return (
    <User>
      {(user) => (
        <span className="truncate text-sm text-muted-foreground">
          {user.email ?? user.username ?? user.userName ?? user.sub}
        </span>
      )}
    </User>
  );
}
