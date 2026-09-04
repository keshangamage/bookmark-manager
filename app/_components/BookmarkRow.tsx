'use client';

import {PencilIcon, Trash2Icon, XIcon} from 'lucide-react';
import {useActionState, useState} from 'react';
import {Button} from '@/components/ui/button';
import {Field, FieldError, FieldGroup, FieldLabel} from '@/components/ui/field';
import {Input} from '@/components/ui/input';
import {deleteBookmark, updateBookmark} from '@/lib/bookmarks';
import type {Bookmark} from '@/lib/db/schema';
import DomainMonogram, {domainOf} from './DomainMonogram';

type FormState = {error?: string};

export default function BookmarkRow({item}: {item: Bookmark}) {
  const [editing, setEditing] = useState(false);
  const label = item.title || domainOf(item.url);

  const [state, formAction, pending] = useActionState<FormState, FormData>(
    async (_prev, formData) => {
      const result = await updateBookmark(formData);
      // Closing here rather than in an effect: this wrapper is client code,
      // and it already knows whether the server action succeeded.
      if (!result.error) setEditing(false);
      return result.error ? {error: result.error} : {};
    },
    {},
  );

  if (editing) {
    return (
      <li className="px-4 py-3">
        <form action={formAction}>
          <input type="hidden" name="id" value={item.id} />
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-[2fr_1.4fr_1fr]">
              <Field data-invalid={Boolean(state.error) || undefined}>
                <FieldLabel htmlFor={`url-${item.id}`} className="font-mono text-xs tracking-wide uppercase">
                  Link
                </FieldLabel>
                <Input
                  id={`url-${item.id}`}
                  name="url"
                  defaultValue={item.url}
                  className="font-mono"
                  aria-invalid={Boolean(state.error) || undefined}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor={`title-${item.id}`} className="font-mono text-xs tracking-wide uppercase">
                  Title
                </FieldLabel>
                <Input id={`title-${item.id}`} name="title" defaultValue={item.title ?? ''} placeholder="Optional" />
              </Field>
              <Field>
                <FieldLabel htmlFor={`tag-${item.id}`} className="font-mono text-xs tracking-wide uppercase">
                  Tag
                </FieldLabel>
                <Input id={`tag-${item.id}`} name="tag" defaultValue={item.tag ?? ''} placeholder="Optional" />
              </Field>
            </div>
            {state.error ? <FieldError>{state.error}</FieldError> : null}
            <Field orientation="horizontal">
              <Button type="submit" size="sm" disabled={pending}>
                {pending ? 'Saving…' : 'Save'}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)} disabled={pending}>
                <XIcon data-icon="inline-start" />
                Cancel
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </li>
    );
  }

  return (
    <li className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50">
      <DomainMonogram url={item.url} />
      <div className="min-w-0 flex-1">
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer noopener"
          className="truncate text-sm font-medium underline-offset-4 outline-none hover:underline focus-visible:underline"
        >
          {label}
        </a>
        <p className="truncate font-mono text-xs text-muted-foreground">{item.url}</p>
      </div>
      {item.tag ? (
        <span className="mark hidden shrink-0 font-mono text-[0.7rem] sm:inline-block">{item.tag}</span>
      ) : null}
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={`Edit ${label}`}
        onClick={() => setEditing(true)}
        className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 hover:text-foreground"
      >
        <PencilIcon />
      </Button>
      <form action={deleteBookmark}>
        <input type="hidden" name="id" value={item.id} />
        <Button
          type="submit"
          variant="ghost"
          size="icon-sm"
          aria-label={`Delete ${label}`}
          className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 hover:text-destructive"
        >
          <Trash2Icon />
        </Button>
      </form>
    </li>
  );
}
