# Ward Images — Manual Curation Guide

This directory contains verified visual evidence images for Bengaluru's solid waste problem areas, displayed on the GEODHA Dashboard.

## Directory Structure

Images are organised by **ward slug** (kebab-case ward name):

```
/public/ward-images/
├── konanakunte/
│   ├── 01-open-burning.jpg
│   └── 02-illegal-dump.jpg
├── lbs-nagar/
│   └── 01-uncollected-waste.jpg
├── [ward-slug]/
│   ├── 01-[description].jpg
│   └── 02-[description].jpg
└── README.md
```

## Curation Rules

1. **Maximum 2–3 images per ward** — only the most egregious, clearly documented cases.
2. **No metadata in filenames** — use descriptive but non-identifying slugs (e.g. `01-open-burning.jpg`, not `2024-03-15-report-id-4521.jpg`).
3. **No personally identifiable information** visible in images — blur faces, vehicle number plates, and any identifying text before uploading.
4. **Image format**: JPEG or WebP preferred, max 800px wide, max 200 KB per image.
5. **Caption only**: Images are shown with a short caption in the UI. Do NOT embed complaint metadata, officer names, timestamps, or complaint IDs.

## How to Add Images

1. Select images from the verified evidence set (manually curated by the GEODHA team — NOT pulled dynamically from any data source).
2. Resize and optimise using `squoosh.app` or similar.
3. Place under `/public/ward-images/[ward-slug]/` following the naming convention.
4. The Dashboard will automatically detect and display images if the directory exists and contains supported files.
5. If no images exist for a ward, the Dashboard shows: _"No verified images yet for this ward."_

## Ward Slug Reference

Ward slugs match the keys in `data/ward-heatmap.json`. Example slugs:

| Ward Name                | Slug                      |
|--------------------------|---------------------------|
| Konanakunte              | `konanakunte`             |
| LBS Nagar                | `lbs-nagar`               |
| Swami Vivekananda Nagar  | `swami-vivekananda-nagar` |
| Bellandur                | `bellandur`               |
| Electronic City          | `electronic-city`         |

## Data Policy

These images are the **only** visual evidence permitted on the public-facing website. Do not add images derived from raw complaint records. See the project data policy documentation for full details.
