# Seeds

Generated data files pulled from public sources by `scripts/fetch-*.js`. Never hand-edit these;
rerun the script instead. Per `roadmap/SDLC.md` ("Keeping designs uncoupled"), every organization or
person row lands in the one shared shape `{ id, name, city, zip, type, sub, lat, lon }` plus
source-specific extras, so screens and the backend never need to know which source a row came from.
Cities are UPPERCASE to match the app's convention.

These files are the full pull for the backend and later filtering. The prototype embeds its own
subset separately.

## schools.json

- **Source:** OSPI, Washington State Public Schools feature service
  (`https://services9.arcgis.com/fWunDXKkvCx1CM4b/arcgis/rest/services/Washington_State_Public_Schools/FeatureServer/0`)
- **Regenerate:** `node scripts/fetch-schools.js`
- **Fetched:** 2026-09-21
- **Counts:** 335 districts (LEAs), 2,498 schools, 0 skipped for missing coordinates
  - High school 520, Middle school 370, Elementary school 1,144, K-12 157, Other 307
- **Shape:** top-level `source`, `sourceUrl`, `fetched`, `count`, `skipped`, then `districts[]` and `schools[]`, each sorted by name.
  - District rows: `id` `LEA-<LEACode>`, `sub` `District`, `lat`/`lon` = mean of the district's schools,
    `city`/`zip` = most common among its schools, plus `county` and `schools` (count).
  - School rows: `id` `OSPI-<SchoolCode>`, `sub` mapped from OSPI `GradeCategory`
    (High School -> High school; Middle School, Jr High -> Middle school; Elementary School -> Elementary school;
    K-12, PK-12 -> K-12; PK Only, Other -> Other), plus `grades` (`<lowest>-<highest>`), `district` (LEA id) and `county`.
- **Notes:** "LEA" includes non-district operators (ESDs, technical colleges, charter and tribal compact schools), so
  some `District` rows have a single school and a name that is not "... School District".
