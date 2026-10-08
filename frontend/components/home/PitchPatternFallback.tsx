/**
 * Abstract dark-green repeating pitch-line motif, used as a video card's
 * background when `cover_image_url` is absent. Pure CSS — no image
 * asset to source/maintain for a fallback state.
 */
export function PitchPatternFallback() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 bg-brand-dark"
      style={{
        backgroundImage:
          "repeating-linear-gradient(135deg, rgba(0,230,118,0.14) 0px, rgba(0,230,118,0.14) 2px, transparent 2px, transparent 18px)",
      }}
    />
  );
}
