# Remotion Composition Brief: Flick

## Objective
Create the approved short-form scene animations from the timestamped transcript.

## Output
- Remotion project: `remotion/`
- Format: 9:16, 1080x1920 at 30 fps
- Rendered scenes:
  - `leads-slipping-away` → `scenes/leads-slipping-away/leads-slipping-away.mp4`
  - `capture-reply-book` → `scenes/capture-reply-book/capture-reply-book.mp4`
  - `futuredge-builds-it` → `scenes/futuredge-builds-it/futuredge-builds-it.mp4`

## Source Material
- Transcript: `transcript.json`
- Approved plan: `flick-plan.md`
- Selected brand assets: none
- Available sound effects: `remotion/public/sounds/`

## Creative Direction
- User direction: Test run. Confident, clean, fast. Gold and black.
- Avoid: generic filler visuals, unapproved assets, background music

## Scene Compositions
See `flick-plan.md` for the approved scene-by-scene detail. IDs, components, timing and SFX are in `scene-spec.json`.

## Remotion Instructions
- One dedicated component per scene under `src/scenes/`, each registered as its own `<Composition>`.
- No all-scenes composition. No background music.
- Frame-driven motion only. Keep text readable.
