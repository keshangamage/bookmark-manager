'use server';

import {revalidatePath} from 'next/cache';
import {getAccessToken} from './auth';
import {buildNamePatch, parseScimUser, type ScimProfile} from './scim';

export type ProfileResult = {error: string} | {error?: never};

function scimUrl(): string {
  const base = process.env.NEXT_PUBLIC_ASGARDEO_BASE_URL;
  if (!base) throw new Error('NEXT_PUBLIC_ASGARDEO_BASE_URL is not set.');
  return `${base.replace(/\/$/, '')}/scim2/Me`;
}

async function requireAccessToken(): Promise<string> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated');
  return token;
}


export async function getProfile(): Promise<ScimProfile> {
  const response = await fetch(scimUrl(), {
    headers: {
      Accept: 'application/scim+json',
      Authorization: `Bearer ${await requireAccessToken()}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    // The body carries SCIM's `detail`; the token never appears in it.
    throw new Error(`SCIM /Me returned ${response.status}: ${(await response.text()).slice(0, 300)}`);
  }
  return parseScimUser(await response.json());
}

export async function updateProfile(formData: FormData): Promise<ProfileResult> {
  const givenName = String(formData.get('givenName') ?? '').trim();
  const familyName = String(formData.get('familyName') ?? '').trim();

  const response = await fetch(scimUrl(), {
    method: 'PATCH',
    headers: {
      Accept: 'application/scim+json',
      Authorization: `Bearer ${await requireAccessToken()}`,
      'Content-Type': 'application/scim+json',
    },
    body: JSON.stringify(buildNamePatch({givenName, familyName})),
  });

  if (!response.ok) {
    let detail = `Asgardeo rejected the update (${response.status}).`;
    try {
      const body = (await response.json()) as {detail?: unknown};
      if (typeof body.detail === 'string') detail = body.detail;
    } catch {
      // Non-JSON error body; the status alone is the best we can say.
    }
    return {error: detail};
  }

  revalidatePath('/profile');
  return {};
}
