'use client';

import {SaveIcon} from 'lucide-react';
import {useActionState} from 'react';
import {Button} from '@/components/ui/button';
import {Field, FieldError, FieldGroup, FieldLabel} from '@/components/ui/field';
import {Input} from '@/components/ui/input';
import {updateProfile} from '@/lib/profile';
import type {ScimProfile} from '@/lib/scim';


type FormState = {error?: string; saved?: boolean};

export default function ProfileForm({profile}: {profile: ScimProfile}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(
    async (_prev, formData) => {
      const result = await updateProfile(formData);
      return result.error ? {error: result.error} : {saved: true};
    },
    {},
  );

  return (
    <form action={formAction} className="rounded-2xl border bg-card p-4">
      <FieldGroup>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="givenName" className="font-mono text-xs tracking-wide uppercase">
              First name
            </FieldLabel>
            {/* key: React keeps the old defaultValue after a revalidate unless
                the input is remounted when the saved value changes. */}
            <Input
              key={profile.givenName}
              id="givenName"
              name="givenName"
              defaultValue={profile.givenName}
              placeholder="Not set"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="familyName" className="font-mono text-xs tracking-wide uppercase">
              Last name
            </FieldLabel>
            <Input
              key={profile.familyName}
              id="familyName"
              name="familyName"
              defaultValue={profile.familyName}
              placeholder="Not set"
            />
          </Field>
        </div>
        {state?.error ? <FieldError>{state.error}</FieldError> : null}
        <Field orientation="horizontal">
          <Button type="submit" disabled={pending}>
            <SaveIcon data-icon="inline-start" />
            {pending ? 'Saving…' : 'Save changes'}
          </Button>
          {state?.saved && !state.error ? (
            <span className="text-sm text-muted-foreground">Saved to Asgardeo.</span>
          ) : null}
        </Field>
      </FieldGroup>
    </form>
  );
}
