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
    <form action={formAction} className="rounded-2xl border bg-card p-4">
      <FieldGroup>
        <div className="grid gap-4 sm:grid-cols-[2fr_1.4fr_1fr]">
          <Field data-invalid={invalid || undefined}>
            <FieldLabel htmlFor="url" className="font-mono text-xs tracking-wide uppercase">
              Link
            </FieldLabel>
            <Input
              id="url"
              name="url"
              placeholder="example.com/article"
              className="font-mono"
              aria-invalid={invalid || undefined}
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="title" className="font-mono text-xs tracking-wide uppercase">
              Title
            </FieldLabel>
            <Input id="title" name="title" placeholder="Optional" />
          </Field>
          <Field>
            <FieldLabel htmlFor="tag" className="font-mono text-xs tracking-wide uppercase">
              Tag
            </FieldLabel>
            <Input id="tag" name="tag" placeholder="Optional" />
          </Field>
        </div>
        {state?.error ? <FieldError>{state.error}</FieldError> : null}
        <Field orientation="horizontal">
          <Button type="submit" disabled={pending}>
            <PlusIcon data-icon="inline-start" />
            {pending ? 'Saving…' : 'Save bookmark'}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
