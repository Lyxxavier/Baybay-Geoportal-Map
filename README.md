# Baybay Geoportal: Manila Bay Reclamation Projects

An interactive web map showing coastal reclamation projects around Manila Bay. Anyone can open it in a browser to see where projects are, what stage they are at, and how large they are. No login or install is needed.

> **Status:** The Projects list contains two Pasay examples from Philippine Reclamation Authority (PRA) pages and three clearly labeled illustrative placeholders. It is not a complete Manila Bay inventory; placeholder shapes are not real project boundaries.

## What you can do on the map

- Review two Pasay examples using PRA-published details and direct source links; the project list is not yet a complete Manila Bay inventory.
- Filter by **Planned**, **Ongoing**, or **Completed**; search by project name, status, or proponent.
- The picker shows up to six matching projects at a time. Search across the full list to find projects beyond the first six; the map and totals reflect all matches.
- See the total PRA-reported area and count of verified PRA boundaries; illustrative placeholder areas are excluded from the total.

## Site tabs

- **Projects** contains the Manila Bay map and currently available project records. The two Pasay records are examples, not a complete regional inventory.
- **Report Violations** is a front-end reporting form and safety guidance. It can prepare an on-page preview but does not send or store reports; use an approved, secure reporting service before collecting sensitive information.
- **Advocacy** presents Pangisda Pilipinas and Manila Bay para sa Tao advocacy information, photographs, and supplied reading/video links.
- **Assessments & Findings** compares PRA-reported details for the 360-Hectare Pasay Reclamation and Development Project and the 265-Hectare Pasay Harbor City Reclamation Project. The comparison links to the source pages, dates progress statements to 31 December 2025, and is not an independent impact assessment.
- The project list can be searched by project name, status, or proponent. Status filters and Reset update the list and summary.

## Project structure

```
Baybay-Geoportal-Map/
├── index.html          Page layout and tab content
├── style.css           Site styling and responsive layouts
├── map.js              Map, filters, project list, statistics and tab switching
├── images_pangisda/    Advocacy photographs
├── data/
│   └── reclamation-projects.template.geojson  Empty template for the official dataset
└── README.md           This file
```

The site is plain HTML, CSS and JavaScript. It uses [Leaflet](https://leafletjs.com/) for the map and OpenStreetMap for the background tiles, both loaded from the internet. There is nothing to build.

## Run it locally

Browsers block a page from reading data files when it is opened directly from a folder, so use a small local server:

```bash
cd Baybay-Geoportal-Map
python -m http.server 8000
```

Then open <http://localhost:8000>. If you open `index.html` directly instead, the map shows two built-in PRA records and three clearly labeled illustrative placeholder shapes.

## Publish it (Vercel)

The portal is a static site, so it needs no build step.

1. Put the folder in a Git repository (GitHub, GitLab or Bitbucket).
2. In [Vercel](https://vercel.com), choose **Add New → Project** and import the repository.
3. Set **Framework Preset** to **Other**. Leave **Build Command** and **Output Directory** empty.
4. Select **Deploy**.

Or from the command line: `npx vercel` inside the project folder, then `npx vercel --prod` to publish.

Every later push to the main branch redeploys automatically. GitHub Pages or any ordinary web server will also work, because the site is only static files.

## Updating the data

The map optionally reads `data/reclamation-projects.geojson`. The repository includes an empty starter file at `data/reclamation-projects.template.geojson`; use it to create a GeoJSON file when verified project records and boundaries are available. When the optional file is absent or cannot be loaded, the map displays two built-in, source-attributed PRA records and three clearly labeled illustrative placeholder shapes. Placeholder shapes are for demonstrating the interface only and must not be interpreted as real project locations.

A single GeoJSON file is sufficient for dozens of read-only projects; a database is unnecessary unless the data needs multi-user editing, frequent updates, access control, or change history. The search and status filters work across the full feature collection.

### Required format

- File type: **GeoJSON**, a `FeatureCollection` of `Polygon` or `MultiPolygon` features when verified boundaries are available. A feature may have `geometry: null` if it is an unlocated source record; the site lists it but does not draw it.
- Coordinate system: **WGS 84 (EPSG:4326)**, longitude first, then latitude.
- One feature per project, with these properties:

| Property   | Type   | Description                                              | Example                  |
|------------|--------|----------------------------------------------------------|--------------------------|
| `project_id` | text | Optional stable project identifier                       | `"MB-001"`               |
| `name`     | text   | Project name                                             | `"Pasay Offshore Area"`  |
| `status`   | text   | Must be `Planned`, `Ongoing`, or `Completed`               | `"Ongoing"`              |
| `area_ha`  | number | Reported project area in hectares; not necessarily reclaimed area | `65.0`       |
| `agency`   | text   | Responsible agency or proponent                          | `"Agency name"`          |
| `year`     | number | Year of approval, start or completion (pick one and keep it consistent) | `2024`     |

Example feature:

```json
{
  "type": "Feature",
  "properties": {
    "project_id": "EXAMPLE-001",
    "name": "Example Reclamation Area",
    "status": "Planned",
    "area_ha": 30.0,
    "agency": "Example Agency",
    "year": 2028
  },
  "geometry": {
    "type": "Polygon",
    "coordinates": [[[120.905, 14.490], [120.920, 14.490], [120.920, 14.478], [120.905, 14.478], [120.905, 14.490]]]
  }
}
```

The first and last coordinate of every polygon ring must be the same point.
For each project, include a `Polygon` or `MultiPolygon` only when the boundary is verified; do not make approximate shapes from project area figures or place the project at a guessed map coordinate. Cite and date all non-spatial records, and distinguish reported project area from area reclaimed or remaining.

### Exporting from QGIS

1. Open the project layer. Check the attribute table has the five fields above, with exactly those names.
2. Right-click the layer, then **Export → Save Features As…**
3. Format: **GeoJSON**. CRS: **EPSG:4326 – WGS 84**.
4. Under Layer Options, set **COORDINATE_PRECISION** to `6`.
5. Save, then copy the file into `data/`.

### Exporting from ArcGIS Pro

1. Make sure the feature class has the five fields above.
2. Run the **Features To JSON** tool (Conversion Toolbox). Tick **Output to GeoJSON** and **Project to WGS 1984**.
3. Save the output and copy it into `data/`.

### Check before publishing

- Paste the file into <https://geojson.io> to confirm it displays in the right place.
- Confirm every `status` value is spelled and capitalised exactly as in the table. A project with any other value will not appear on the map.

## Data source and licensing

The map uses two built-in, source-attributed PRA project summaries and three illustrative placeholders; these are not an official dataset or geometry. The PRA information is also compared in Assessments & Findings. See [`DATA_NOTICE.md`](./DATA_NOTICE.md) for the status of the official dataset, acquisition date, and dataset terms. Record the exact dataset name, retrieval date, and license or permission terms there before adding official data to a public deployment. Do not present the official dataset as MIT-licensed unless its own terms explicitly allow that.

| Item                         | Details                         |
|------------------------------|---------------------------------|
| Data notice                  | [`DATA_NOTICE.md`](./DATA_NOTICE.md) |
| Intended agency / provider   | Philippine Reclamation Authority (intended source; not verified) |
| Dataset name and version     | No official dataset obtained or loaded |
| Date obtained / last update  | Not obtained |
| Data licence / terms of use  | Not supplied or verified; no reuse permission asserted |
| Official pages referenced   | PRA project pages for the 360-ha Pasay project and 265-ha Pasay Harbor City project; see Assessments & Findings |
| Contact for corrections      | _to be added_                   |

Background map © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), available under the ODbL.
The website's original source code is licensed under the [MIT License](./LICENSE); this does not cover datasets or third-party materials.

## Limitations

- Boundaries are indicative and may not match surveyed or legally approved limits.
- The map reflects the data as of the last update date above, not live conditions.
- Status values are simplified to three categories.

## Contact

_Add the name and email of the team or office responsible for this portal._
