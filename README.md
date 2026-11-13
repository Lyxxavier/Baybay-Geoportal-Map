# Baybay Geoportal: Manila Bay Reclamation Projects

An interactive web map showing coastal reclamation projects around Manila Bay. Anyone can open it in a browser to see where projects are, what stage they are at, and how large they are. No login or install is needed.

> **Status:** The map currently shows placeholder projects. The boundaries and figures are not official and must not be used for planning, legal or engineering purposes until the real dataset is loaded.

## What you can do on the map

- See every project as a coloured area on the bay.
- Filter by status: **Planned**, **Ongoing** or **Completed**.
- Select a project in the list, or click it on the map, to zoom in and read its details: name, status, year, area in hectares, and responsible agency.
- Read the summary counts (projects, total hectares, completed) for whatever is currently shown.

## Site tabs

- **Projects** contains the interactive map and project list.
- **Report Violations** is a front-end reporting form and safety guidance. It does not currently send or store reports; connect it to an approved, secure reporting service before collecting sensitive information.
- **Advocacy** presents Pangisda Pilipinas and Manila Bay para sa Tao advocacy information, photographs, and supplied reading/video links.
- **Assessments & Findings** explains assessment topics and the current evidence status. It currently has no official assessment results; sample map features and unverified reports are not findings.

## Project structure

```
Baybay-Geoportal-Map/
├── index.html          Page layout and tab content
├── style.css           Site styling and responsive layouts
├── map.js              Map, filters, project list, statistics and tab switching
├── images_pangisda/    Advocacy photographs
├── data/               GeoJSON project data (when supplied)
└── README.md           This file
```

The site is plain HTML, CSS and JavaScript. It uses [Leaflet](https://leafletjs.com/) for the map and OpenStreetMap for the background tiles, both loaded from the internet. There is nothing to build.

## Run it locally

Browsers block a page from reading data files when it is opened directly from a folder, so use a small local server:

```bash
cd Baybay-Geoportal-Map
python -m http.server 8000
```

Then open <http://localhost:8000>. If you open `index.html` directly instead, the map still works but shows three built-in sample projects and a note explaining why.

## Publish it (Vercel)

The portal is a static site, so it needs no build step.

1. Put the folder in a Git repository (GitHub, GitLab or Bitbucket).
2. In [Vercel](https://vercel.com), choose **Add New → Project** and import the repository.
3. Set **Framework Preset** to **Other**. Leave **Build Command** and **Output Directory** empty.
4. Select **Deploy**.

Or from the command line: `npx vercel` inside the project folder, then `npx vercel --prod` to publish.

Every later push to the main branch redeploys automatically. GitHub Pages or any ordinary web server will also work, because the site is only static files.

## Updating the data

The map reads `data/reclamation-projects.sample.geojson`. To use real data, place the GeoJSON at that path (or change `DATA_URL` at the top of `map.js` to point to another file).

### Required format

- File type: **GeoJSON**, a `FeatureCollection` of `Polygon` or `MultiPolygon` features.
- Coordinate system: **WGS 84 (EPSG:4326)**, longitude first, then latitude.
- One feature per project, with these properties:

| Property   | Type   | Description                                              | Example                  |
|------------|--------|----------------------------------------------------------|--------------------------|
| `name`     | text   | Project name                                             | `"Pasay Offshore Area"`  |
| `status`   | text   | Must be exactly `Planned`, `Ongoing` or `Completed`      | `"Ongoing"`              |
| `area_ha`  | number | Project area in hectares                                 | `65.0`                   |
| `agency`   | text   | Responsible agency or proponent                          | `"Agency name"`          |
| `year`     | number | Year of approval, start or completion (pick one and keep it consistent) | `2024`     |

Example feature:

```json
{
  "type": "Feature",
  "properties": {
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

The map currently uses built-in illustrative samples only. See [`DATA_NOTICE.md`](./DATA_NOTICE.md) for the status of the intended source, dataset, acquisition date, and dataset terms. Do not present the official dataset as MIT-licensed unless its own terms explicitly allow that.

| Item                         | Details                         |
|------------------------------|---------------------------------|
| Data notice                  | [`DATA_NOTICE.md`](./DATA_NOTICE.md) |
| Intended agency / provider   | Philippine Reclamation Authority (intended source; not verified) |
| Dataset name and version     | No official dataset obtained or loaded |
| Date obtained / last update  | Not obtained |
| Data licence / terms of use  | Not supplied or verified; no reuse permission asserted |
| Contact for corrections      | _to be added_                   |

Background map © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), available under the ODbL.
The website's original source code is licensed under the [MIT License](./LICENSE); this does not cover datasets or third-party materials.

## Limitations

- Boundaries are indicative and may not match surveyed or legally approved limits.
- The map reflects the data as of the last update date above, not live conditions.
- Status values are simplified to three categories.

## Contact

_Add the name and email of the team or office responsible for this portal._
