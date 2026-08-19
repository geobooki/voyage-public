# Voyage Design System

Voyage follows a Seed-inspired structure: foundations first, reusable components second, and page patterns last.

## Foundations

- Semantic color roles live in `app/globals.css` (`--color-primary`, `--color-info`, `--color-surface`, `--color-border`, and state roles).
- Green is the primary action color and blue is the information/accent color.
- Spacing is based on compact 8px steps, with `--space-page` for responsive page gutters.
- Cards use the shared `--radius-card` and layered elevation through `--shadow-card`.
- Controls share the same focus ring, radius, border, placeholder, and hover behavior.

## Components

Use the shared classes when adding new UI:

- `.card` for content surfaces
- `.ds-button ds-button-primary` for primary actions
- `.ds-button ds-button-secondary` for secondary actions
- `.ds-chip` for compact status/category labels
- `.ds-dialog-backdrop` and `.ds-dialog` for modal surfaces
- `.date-field-trigger` and the date picker styles for date selection
- `data-component="side-navigation"` for primary navigation

## Patterns

- Use one clear page heading and a short supporting description.
- Keep primary actions visible at the top-right of a section.
- Use cards for independent content groups, not nested containers without a purpose.
- Use the green action role for changes and the blue role for informational links or highlights.
- Preserve keyboard focus states and avoid communicating state with color alone.
