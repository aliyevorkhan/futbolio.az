# Validation conventions

This project doesn't have any forms yet in this pass (the registration
wizard is built by a later agent), so there's no `zod`/`react-hook-form`
dependency installed yet. When the wizard agent adds the registration
form, follow this convention so admin-panel forms stay consistent:

- One `zod` schema per step/form, colocated in this directory (e.g.
  `lib/validation/registrationStep1.ts`), exported as both the schema
  and its inferred TS type (`export type RegistrationStep1 = z.infer<typeof registrationStep1Schema>`).
- Wire schemas into `react-hook-form` via `@hookform/resolvers/zod`
  (`zodResolver(schema)`), not manual validation.
- Map `ApiError.fieldErrors` (see `lib/api/client.ts`) onto RHF's
  `setError(field, { message })` for server-side validation errors —
  field names should match 1:1 with the DRF serializer field names so
  this mapping stays mechanical.
- Keep schemas close to the API contract (same field names/shapes the
  backend expects) rather than reshaping on submit, so there's one
  obvious place to look when a field name changes.
