/**
 * Shapes returned by Asgardeo's SCIM 2.0 `/scim2/Me` endpoint, reduced to the
 * fields this app shows. Kept free of I/O so it can be unit tested.
 */
export type ScimProfile = {
  id: string | null;
  userName: string | null;
  email: string | null;
  givenName: string;
  familyName: string;
  lastModified: string | null;
};

/** `DEFAULT/jane` and `PRIMARY/jane` are both stored forms of `jane`. */
export function removeUserstorePrefix(userName: string): string {
  const slash = userName.indexOf('/');
  return slash === -1 ? userName : userName.slice(slash + 1);
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

/**
 * SCIM allows `emails` to hold either bare strings or `{value, primary}`
 * objects, and Asgardeo has returned both. Prefer the primary when tagged.
 */
function primaryEmail(raw: unknown): string | null {
  if (!Array.isArray(raw)) return null;

  const entries = raw.map((entry) =>
    typeof entry === 'string' ? {value: entry, primary: false} : asRecord(entry),
  );
  const preferred = entries.find((entry) => entry.primary === true) ?? entries[0];
  return preferred ? asString(preferred.value) : null;
}

export function parseScimUser(raw: unknown): ScimProfile {
  const user = asRecord(raw);
  const name = asRecord(user.name);
  const userName = asString(user.userName);

  return {
    id: asString(user.id),
    userName: userName ? removeUserstorePrefix(userName) : null,
    email: primaryEmail(user.emails),
    // Empty rather than null: these are the editable inputs, and an
    // uncontrolled input cannot take null as its defaultValue.
    givenName: asString(name.givenName) ?? '',
    familyName: asString(name.familyName) ?? '',
    lastModified: asString(asRecord(user.meta).lastModified),
  };
}

/**
 * A SCIM PatchOp body. `replace` with a partial object leaves every attribute
 * not named here untouched, so this cannot clobber the rest of the profile.
 */
export function buildNamePatch(fields: {givenName: string; familyName: string}) {
  return {
    schemas: ['urn:ietf:params:scim:api:messages:2.0:PatchOp'],
    Operations: [
      {
        op: 'replace',
        value: {name: {givenName: fields.givenName, familyName: fields.familyName}},
      },
    ],
  };
}
