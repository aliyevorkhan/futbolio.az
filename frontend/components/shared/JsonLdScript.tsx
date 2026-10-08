/**
 * Renders a JSON-LD `<script type="application/ld+json">` tag from a
 * plain object built by one of the `lib/jsonld.ts` builders. Server
 * component — no interactivity needed.
 */
export function JsonLdScript({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
