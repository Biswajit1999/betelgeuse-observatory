# Betelgeuse Observatory design system

This file records the verified project-specific interpretation of the UI/UX audit. The generic generator's product match was rejected because it described a light biohacking/enterprise interface, which conflicts with the explicit scientific-observatory brief.

## Direction

- Narrative scientific instrument: cinematic opening, then a working causality surface in the first viewport.
- Near-black neutral background, warm stellar amber for measured radiation, cool cyan for received/derived information, and violet only for model-dependent quantities.
- No decorative glass, particles, exaggerated sci-fi type, or animation without scientific meaning.
- Use Geist for prose and Geist Mono for measurements; all scientific values use tabular figures.
- Layout follows an 8px rhythm, a readable 72-character prose measure, and 24px minimum web pointer targets with 44px targets for primary controls.

## Semantic evidence colours

| Evidence class  | Token           | Colour    | Non-colour cue                      |
| --------------- | --------------- | --------- | ----------------------------------- |
| Measured        | `--measured`    | `#f6b44c` | solid line / `MEASURED` label       |
| Calculated      | `--calculated`  | `#70d6e6` | dashed line / `CALCULATED` label    |
| Simulated       | `--simulated`   | `#b9a7ff` | dotted line / `SIMULATION` label    |
| Model-dependent | `--model`       | `#f08fb7` | diamond marker / `MODEL` label      |
| Speculative     | `--speculative` | `#a8adb7` | hatched field / `SPECULATIVE` label |

Colour never carries evidence class by itself.

## Interaction and motion

- The causality sliders are the primary interaction and expose exact values in adjacent text.
- Motion uses opacity and transforms only, remains interruptible, and renders its final state immediately under `prefers-reduced-motion: reduce`.
- Charts provide a concise text summary and a table alternative. Series use line style and labels as well as hue.
- All controls have visible focus, labels, keyboard operation, and a minimum 44px primary hit area.

## Responsive rules

- 375px: single column, no horizontal scrolling, controls before diagrams.
- 768px: two-column scientific cards where labels remain readable.
- 1024px+: narrative rail and instrument panel may sit side by side.
- Keep navigation reachable without hiding focused content behind sticky chrome.

## Pre-delivery audit

- Text contrast is at least 4.5:1; data marks and control boundaries are at least 3:1.
- Focus order matches reading order and a skip link targets the main region.
- Reduced motion, 200% zoom, 375px viewport, keyboard-only use, and no-colour interpretation are tested.
- Observation date and publication date are separate fields on every observational product.
- Every scientific claim links to a primary paper or official archive.
