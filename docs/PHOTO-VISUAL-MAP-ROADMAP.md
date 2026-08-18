# MyZubster — Photo & Visual Map Roadmap

## Vision

Build a worldwide visual map where every observation can be connected to a geographic point, street, place, plant, building, historic asset, panorama or urban/environmental service.

## Geographic hierarchy

```text
World
└── Country
    └── Region / State
        └── Province / Area
            └── City
                └── District / Neighborhood
                    └── Street / Via
                        ├── Panorama
                        ├── Plants & Trees
                        ├── Buildings
                        ├── Historic Heritage
                        ├── Squares & Monuments
                        ├── Parks & Environment
                        └── Urban Services
```

Every record should support GPS coordinates so the physical hierarchy and the interactive map remain connected.

## Visual record model

Each mapped observation should progressively support:

- GPS latitude / longitude
- Country, region, city, street
- Category and subcategory
- Capture date and time when available
- Original photograph
- Optimized web photograph / thumbnail
- Panorama when available
- Description and historical/environmental notes
- Source / contributor metadata when appropriate
- Links between nearby observations
- GeoJSON feature for map rendering

## Media naming convention

```text
YYYY-MM-DD_place_lat_lon_category_sequence.ext
```

Example:

```text
2026-08-18_via-clodia_44.0637353_12.5678873_panorama_001.jpg
```

## Storage workflow

```text
Phone / Camera
      ↓
Google Drive staging archive
      ↓
Home / VPS synchronization
      ↓
Metadata validation + image optimization
      ↓
GitHub repository
      ↓
MyZubster visual map
```

Google Drive acts as the collection/staging archive. GitHub stores the public structured dataset, documentation and web-ready media. The VPS can automate synchronization, optimization, thumbnails and map-index generation.

## Map data

Maintain a machine-readable GeoJSON index. Each observation becomes a Feature such as:

```json
{
  "type": "Feature",
  "geometry": {
    "type": "Point",
    "coordinates": [12.5678873, 44.0637353]
  },
  "properties": {
    "id": "rimini-via-clodia-20260818-001",
    "name": "Via Clodia",
    "city": "Rimini",
    "country": "Italy",
    "category": "street",
    "media_type": "panorama",
    "image": "world/italy/emilia-romagna/rimini/streets/via-clodia/images/2026-08-18_via-clodia_44.0637353_12.5678873_panorama_001.jpg"
  }
}
```

## Visual map experience

### Phase 1 — Photo points

- Interactive world map
- GPS markers
- Marker popup with thumbnail, name, category and date
- Filters for plants, buildings, heritage, panoramas and services
- City and street pages

### Phase 2 — Visual exploration

- Photo gallery linked to map markers
- Street-level sequences
- Panorama viewer
- Nearby observations
- Timeline of repeat photographs of the same location

### Phase 3 — Worldwide atlas

- Country → region → city navigation
- Search by street, place, species and building
- Marker clustering at global scale
- Public contribution workflow
- Validation/moderation states
- Multilingual place descriptions

### Phase 4 — Temporal visual map

- Compare a location across dates
- Environmental and urban change history
- Plant/tree growth observations
- Building and heritage conservation records
- Street and panorama evolution

## Initial Rimini seed

Current seed categories include:

- Via Clodia — Street / Panorama — GPS 44.0637353, 12.5678873
- Piazza Ferrari
- Piazza Cavour
- Fontana della Pigna
- Teatro Amintore Galli
- Comune / historic palaces
- Plants and trees
- Urban/environmental services

Rimini is the first local seed; the data model must remain globally reusable.

## Repository target structure

```text
world/
  italy/
    emilia-romagna/
      rimini/
        streets/
        plants/
        buildings/
        heritage/
        panoramas/
        services/

data/
  observations.geojson
  places.json
  media-index.json

docs/
  PHOTO-VISUAL-MAP-ROADMAP.md
```

## VPS automation roadmap

1. Sync new files from the Drive staging folders.
2. Preserve originals in the archive.
3. Generate safe web-sized images and thumbnails.
4. Read EXIF GPS/date metadata when present.
5. Match files to existing MyZubster observation records.
6. Flag records that need street/place confirmation rather than guessing.
7. Generate/update GeoJSON and media indexes.
8. Commit web-ready media and metadata to GitHub.
9. Rebuild/deploy the visual map.
10. Report unmatched or duplicate observations for review.

## Principle

Never invent location metadata. Prefer verified GPS, user-confirmed place names and traceable source data. The visual map should remain useful both to humans browsing photographs and to software consuming structured geographic observations.
