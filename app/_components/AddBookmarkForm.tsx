'use client';

import {PlusIcon} from 'lucide-react';
import {useActionState} from 'react';
import {Button} from '@/components/ui/button';
import {Field, FieldError, FieldGroup, FieldLabel} from '@/components/ui/field';
import {Input} from '@/components/ui/input';
import {addBookmark} from '@/lib/bookmarks';

export default function AddBookmarkForm() {
  const [state, formAction, pending] = useActionState(
    async (_prev: {error?: string}, formData: FormData) => addBookmark(formData),
    {},
  );
  const invalid = Boolean(state?.error);

  return (
    <form action={formAction}>
      <FieldGroup>
        <div className="grid gap-4 sm:grid-cols-[2fr_1.5fr_1fr]">
          <Field data-invalid={invalid || undefined}>
            <FieldLabel htmlFor="url">URL</FieldLabel>
            <Input
              id="url"
              name="url"
              placeholder="https://example.com"
              aria-invalid={invalid || undefined}
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="title">Title</FieldLabel>
            <Input id="title" name="title" placeholder="Optional" />
          </Field>
          <Field>
            <FieldLabel htmlFor="tag">Tag</FieldLabel>
            <Input id="tag" name="tag" placeholder="Optional" />
          </Field>
        </div>
        {state?.error ? <FieldError>{state.error}</FieldError> : null}
        <Field orientation="horizontal">
          <Button type="submit" disabled={pending}>
            <PlusIcon data-icon="inline-start" />
            {pending ? 'Adding…' : 'Add bookmark'}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
