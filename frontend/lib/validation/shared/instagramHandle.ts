/** Instagram handle, without the leading `@`: letters, digits, dot, underscore. */
export const INSTAGRAM_HANDLE_REGEX = /^[A-Za-z0-9._]{1,30}$/;

/** Strip a leading `@` a user may have pasted before validating/submitting. */
export function normalizeInstagramHandle(input: string): string {
  return input.trim().replace(/^@/, "");
}
