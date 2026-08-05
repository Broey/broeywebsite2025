# Broey V1 Genre Inventory

Inventory date: August 5, 2026

This inventory covers the approved public release and track entries used by the application after LiNK and Paradise are excluded as drafts. It uses only structured `tags`, release-registry `genres`, and track-registry `mainGenre`, `edmGenre`, and `customGenre` values. Draft descriptions, audio, and artwork were not used to infer genres.

## Source-value findings

The public data contains these genre or genre-adjacent source values:

- `Alternative Electronic`, `Bass`, `Bass House`, `Breakbeat`, `Breakbeats`, `Chillout`, `Club`, `Dance`, `Dance / Electro Pop`, `Deep house`, `Deep House`, `DNB`, `Downtempo`, `Drum & Bass`, `Drum and Bass`, `Dubstep`, `Dubstep / Trap`, `Electronic`, `Electronica`, `Future Garage / UK Garage`, `Garage`, `House`, `House (Old School)`, `Jungle`, `Jungle / DnB`, `Old School House`, `Raw electronic`, `Speed House`, `Tech House`, `Trance`, `Trance (Main Floor)`, `Trap`, `Trap / Wave`, `UK Garage / Bassline`, and `UKG`.
- Capitalization differs for `Deep house` and `Deep House`.
- Punctuation/spelling differs across `DNB`, `Drum & Bass`, `Drum and Bass`, and `Jungle / DnB`.
- Singular/plural differs across `Breakbeat` and `Breakbeats`.
- `UKG` and `UK Garage` are equivalent abbreviations in the current structured data. Combined registry values also contain two genres separated by `/`.
- Most entries have multiple source genres. Combined values are split only where the source itself explicitly names both genres.
- Non-genre tags such as release types, project names, `Collaboration`, `Club-facing`, `Late-night`, `Melodic`, `Percussive`, `Reflective`, `Transition`, `VIP`, and `Warm synths` are preserved in source but excluded from public genre labels and filtering.

## Normalization decisions

| Source value | Public value |
| --- | --- |
| `DNB`, `Drum and Bass`, `Drum & Bass` | `Drum & Bass` |
| `Deep house`, `Deep House` | `Deep House` |
| `Breakbeats`, `Breakbeat` | `Breakbeat` |
| `UKG` | `UK Garage` |
| `Raw electronic` | `Electronic` |
| `House (Old School)` | `Old School House` |
| `Trance (Main Floor)` | `Trance` |
| Explicit combined `/` values | Separate public labels for each named genre |

`Garage`, `UK Garage`, `Bass`, `Bassline`, `Dance`, `Club`, `Electronic`, and `Electronica` remain distinct because the current sources do not establish that they are interchangeable.

## Missing or unresolved values

- `After You` has no structured genre value beyond non-genre tags and is intentionally shown without a genre tag. Owner review is required before assigning one.
- `Bass`, `Club`, `Dance`, `Electronic`, `Electronica`, and `Garage` are broad labels retained from structured source data. The owner may narrow them later if an approved taxonomy is supplied.
- No filter is generated from LiNK or Paradise because both are draft releases.
