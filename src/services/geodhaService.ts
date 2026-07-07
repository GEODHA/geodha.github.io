/**
 * geodhaService.ts
 * All Firestore + Storage operations for the GEODHA dashboard.
 *
 * Collections (prefixed "geodha_" to avoid clashes with existing app data):
 *   geodha_ward_stats/summary        — single doc: { wards: Record<string, WardData> }
 *   geodha_recommended_actions/{cat} — one doc per category
 *   geodha_testimonials/{id}         — one doc per testimonial / documented case
 */

import {
  collection, doc,
  getDoc, getDocs,
  setDoc, addDoc, updateDoc, deleteDoc,
  serverTimestamp, deleteField,
  Timestamp, query, orderBy, limit,
} from 'firebase/firestore';
import {
  ref, uploadBytes, getDownloadURL, deleteObject,
} from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { computeScale } from '../lib/severity';
import type { BandLevel } from '../lib/severity';

// ── Collection names ──────────────────────────────────────────────────────────

const WARD_STATS_COL      = 'geodha_ward_stats';
const WARD_SNAPSHOTS_COL  = 'geodha_ward_stats_snapshots';
const ACTIONS_COL         = 'geodha_recommended_actions';
const TESTIMONIALS_COL    = 'geodha_testimonials';

// ── Shared types ──────────────────────────────────────────────────────────────

export interface WardData {
  ward_num:  number;
  ward_name: string;
  total_reports: number;
  total_open:    number;
  total_closed:  number;
  garbage_dump:                          number;
  garbage_dump_open:                     number;
  garbage_dump_closed:                   number;
  garbage_vehicle_not_arrived:           number;
  garbage_vehicle_not_arrived_open:      number;
  garbage_vehicle_not_arrived_closed:    number;
  burning_of_garbage:                    number;
  burning_of_garbage_open:               number;
  burning_of_garbage_closed:             number;
  severity_total:        number;
  severity_garbage_dump: number;
  severity_vehicle:      number;
  severity_burning:      number;
  /** Pre-computed percentile bands (0–5). Written by recomputeWardClassifications(). */
  band_total?: BandLevel;
  band_dump?:  BandLevel;
  band_veh?:   BandLevel;
  band_burn?:  BandLevel;
  top_problem?: ProblemCategory;
}

export type ProblemCategory =
  | 'garbage_dump'
  | 'garbage_vehicle_not_arrived'
  | 'burning_of_garbage';

/**
 * A single step inside a RecommendedActionDoc.
 *
 * Any string field (heading, detail, url, urlText) may contain template
 * placeholders that are resolved at render time for each ward:
 *   {ward_num}   → raw ward number, e.g. "12"
 *   {ward_phone} → ward marshal phone number, e.g. "9448197012"
 *                  (prefix 9448197 + ward_num zero-padded to 3 digits)
 */
export interface ActionStep {
  emoji:   string;
  heading: string;
  detail:  string;
  /** Optional URL — rendered as a link in the ward card. Supports {ward_num} and {ward_phone}. */
  url?:     string;
  /** Custom label for the URL link; defaults to "Learn more" when omitted. */
  urlText?: string;
}

export interface RecommendedActionDoc {
  category:  ProblemCategory;
  icon:      string;
  label:     string;
  violation: string;
  steps:     ActionStep[];
  updated_at?: Timestamp;
}

export type TestimonialTag =
  | 'garbage_dump'
  | 'vehicle_not_arrived'
  | 'burning'
  | 'waterlogging'
  | 'other';

export interface TestimonialDoc {
  id:                  string;   // Firestore document ID
  ward_num:            number;
  ward_name:           string;
  title:               string;
  quote:               string;
  source:              string;
  locality:            string;
  date:                string;   // ISO date string
  tags:                TestimonialTag[];
  images:              string[]; // Storage download URLs (originals)
  thumb_images?:       string[]; // Parallel array of 300px thumbnail URLs
  has_exact_location:  boolean;
  exact_lat?:          number;
  exact_lng?:          number;
  /** Marks this testimonial as a critical/priority case — shown with a larger ! marker on the map. */
  critical_or_not:     boolean;
  /** true = success story / positive case — shown as a green ✓ on the map. Defaults to false. */
  is_positive?:        boolean;
  /**
   * Additional ward numbers where this entry should appear in the ward sheet.
   * The map marker is still placed at the primary ward_num location.
   * Use for cross-ward initiatives that span multiple wards.
   */
  extra_ward_nums?:    number[];
  created_at?:         Timestamp;
  updated_at?:         Timestamp;
}

// ── Ward stats ────────────────────────────────────────────────────────────────

/** Fetch all ward statistics from Firestore (single document read). */
export async function getWardStats(): Promise<Record<string, WardData>> {
  const snap = await getDoc(doc(db, WARD_STATS_COL, 'summary'));
  if (!snap.exists()) throw new Error('Ward stats not found. Run the seed script first.');
  const data = snap.data() as { wards: Record<string, WardData> };
  return data.wards;
}

/**
 * Compute percentile-based severity bands for all wards and stamp them onto
 * each ward entry.  Returns a new Record — does not mutate the input.
 * Called automatically by setWardStats so the dashboard never has to do this
 * work client-side.
 */
export function recomputeWardClassifications(
  wards: Record<string, WardData>,
): Record<string, WardData> {
  const list    = Object.values(wards);
  const cTotal  = computeScale(list.map((w) => w.total_reports));
  const cDump   = computeScale(list.map((w) => w.garbage_dump));
  const cVeh    = computeScale(list.map((w) => w.garbage_vehicle_not_arrived));
  const cBurn   = computeScale(list.map((w) => w.burning_of_garbage));

  const out: Record<string, WardData> = {};
  for (const [key, w] of Object.entries(wards)) {
    const bandDump  = cDump(w.garbage_dump)                 as BandLevel;
    const bandVeh   = cVeh(w.garbage_vehicle_not_arrived)   as BandLevel;
    const bandBurn  = cBurn(w.burning_of_garbage)           as BandLevel;

    // Top problem = highest band, tiebreak by raw count
    const ranked: { cat: ProblemCategory; band: BandLevel; count: number }[] = [
      { cat: 'garbage_dump',               band: bandDump, count: w.garbage_dump },
      { cat: 'garbage_vehicle_not_arrived', band: bandVeh,  count: w.garbage_vehicle_not_arrived },
      { cat: 'burning_of_garbage',         band: bandBurn, count: w.burning_of_garbage },
    ].sort((a, b) => b.band !== a.band ? b.band - a.band : b.count - a.count);

    out[key] = {
      ...w,
      band_total:  cTotal(w.total_reports) as BandLevel,
      band_dump:   bandDump,
      band_veh:    bandVeh,
      band_burn:   bandBurn,
      top_problem: ranked[0].cat,
    };
  }
  return out;
}

/** Admin: overwrite the entire ward stats document. Auto-recomputes bands. */
export async function setWardStats(wards: Record<string, WardData>): Promise<void> {
  const withBands = recomputeWardClassifications(wards);
  await setDoc(doc(db, WARD_STATS_COL, 'summary'), {
    wards:      withBands,
    updated_at: serverTimestamp(),
  });
}

// ── Ward stats snapshots ──────────────────────────────────────────────────────

export interface WardStatsSnapshot {
  id:       string;
  label:    string;
  saved_at: Timestamp;
  wards:    Record<string, WardData>;
}

/** Save the current ward stats as a named snapshot (called before every publish). */
export async function saveWardStatsSnapshot(
  wards: Record<string, WardData>,
  label: string,
): Promise<string> {
  const ref = await addDoc(collection(db, WARD_SNAPSHOTS_COL), {
    wards,
    label,
    saved_at: serverTimestamp(),
  });
  return ref.id;
}

/** Return the 10 most recent snapshots, newest first. */
export async function listWardStatsSnapshots(): Promise<WardStatsSnapshot[]> {
  const q    = query(collection(db, WARD_SNAPSHOTS_COL), orderBy('saved_at', 'desc'), limit(10));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as WardStatsSnapshot));
}

/** Restore a snapshot: read it and overwrite the live summary document. */
export async function restoreWardStatsSnapshot(snapshotId: string): Promise<void> {
  const snap = await getDoc(doc(db, WARD_SNAPSHOTS_COL, snapshotId));
  if (!snap.exists()) throw new Error('Snapshot not found.');
  const { wards } = snap.data() as { wards: Record<string, WardData> };
  await setWardStats(wards);
}

// ── Recommended actions ───────────────────────────────────────────────────────

/** Fetch all three recommended action categories. */
export async function getRecommendedActions(): Promise<Record<ProblemCategory, RecommendedActionDoc>> {
  const snap = await getDocs(collection(db, ACTIONS_COL));
  if (snap.empty) throw new Error('Recommended actions not found. Run the seed script first.');
  const result = {} as Record<ProblemCategory, RecommendedActionDoc>;
  snap.forEach((d) => {
    const data = d.data() as RecommendedActionDoc;
    result[data.category] = { ...data };
  });
  return result;
}

/** Admin: save updated action (full overwrite of one category doc). */
export async function updateRecommendedAction(
  category: ProblemCategory,
  data: Omit<RecommendedActionDoc, 'updated_at'>,
): Promise<void> {
  await setDoc(doc(db, ACTIONS_COL, category), {
    ...data,
    updated_at: serverTimestamp(),
  });
}

// ── Testimonials ──────────────────────────────────────────────────────────────

/** Fetch all testimonials / documented cases. */
export async function getTestimonials(): Promise<TestimonialDoc[]> {
  const snap = await getDocs(collection(db, TESTIMONIALS_COL));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<TestimonialDoc, 'id'>) }));
}

/**
 * Strip undefined values from an object — Firestore rejects them.
 * For the optional geo fields (exact_lat / exact_lng):
 *   - addDoc variant: simply omits the fields (deleteField() is not valid with addDoc)
 *   - updateDoc variant: uses deleteField() so they are removed from the document
 */
function sanitiseForAdd(data: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined) out[k] = v;
  }
  // When location is disabled just leave the fields absent — no deleteField() on add
  if (out['has_exact_location'] === false) {
    delete out['exact_lat'];
    delete out['exact_lng'];
  }
  return out;
}

function sanitiseForUpdate(data: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined) out[k] = v;
  }
  // If location flag is explicitly disabled, erase any stored coordinates
  if ('has_exact_location' in out && out['has_exact_location'] === false) {
    out['exact_lat'] = deleteField();
    out['exact_lng'] = deleteField();
  }
  return out;
}

/** Admin: add a new testimonial. Returns the new document ID. */
export async function addTestimonial(
  data: Omit<TestimonialDoc, 'id' | 'created_at' | 'updated_at'>,
): Promise<string> {
  const payload = sanitiseForAdd(data as Record<string, unknown>);
  const docRef = await addDoc(collection(db, TESTIMONIALS_COL), {
    ...payload,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
  return docRef.id;
}

/** Admin: update an existing testimonial. */
export async function updateTestimonial(
  id: string,
  data: Partial<Omit<TestimonialDoc, 'id' | 'created_at'>>,
): Promise<void> {
  const payload = sanitiseForUpdate(data as Record<string, unknown>);
  await updateDoc(doc(db, TESTIMONIALS_COL, id), {
    ...payload,
    updated_at: serverTimestamp(),
  });
}

/** Admin: delete a testimonial and all its Storage images (originals + thumbnails). */
export async function deleteTestimonial(
  id: string,
  imageUrls: string[],
  thumbUrls: string[] = [],
): Promise<void> {
  const allUrls = [...imageUrls, ...thumbUrls];
  await Promise.allSettled(allUrls.map((url) => {
    try { return deleteObject(ref(storage, url)); }
    catch { return Promise.resolve(); }
  }));
  await deleteDoc(doc(db, TESTIMONIALS_COL, id));
}

// ── Image upload ──────────────────────────────────────────────────────────────

/**
 * Upload an image file for a testimonial.
 * Returns the public download URL.
 * Path: testimonials/{testimonialId}/{filename}
 *
 * NOTE: this path must match the Storage security rules:
 *   match /testimonials/{allPaths=**} { allow write: if ... }
 *
 * Returns { url, thumbUrl } — url is the original, thumbUrl is a ≤300px JPEG thumbnail.
 */

/** Resize an image file to fit within maxPx × maxPx, returns a JPEG Blob. */
async function createThumbnail(file: File, maxPx = 300): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale  = Math.min(maxPx / img.width, maxPx / img.height, 1);
      const canvas = document.createElement('canvas');
      canvas.width  = Math.round(img.width  * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error('Thumbnail canvas.toBlob failed')),
        'image/jpeg',
        0.82,
      );
    };
    img.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Image load failed')); };
    img.src = objectUrl;
  });
}

export async function uploadTestimonialImage(
  file: File,
  testimonialId: string,
): Promise<{ url: string; thumbUrl: string }> {
  const safeName    = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const origPath    = `testimonials/${testimonialId}/${safeName}`;
  const thumbPath   = `testimonials/${testimonialId}/thumb_${safeName}`;
  const origRef     = ref(storage, origPath);
  const thumbRef    = ref(storage, thumbPath);


  const TIMEOUT_MS = 30_000;

  const doUpload = async (): Promise<{ url: string; thumbUrl: string }> => {
    // Generate thumbnail client-side before uploading
    const thumbBlob = await createThumbnail(file);

    const [origSnap, thumbSnap] = await Promise.all([
      uploadBytes(origRef,  file),
      uploadBytes(thumbRef, thumbBlob),
    ]);
    const [url, thumbUrl] = await Promise.all([
      getDownloadURL(origSnap.ref),
      getDownloadURL(thumbSnap.ref),
    ]);
    return { url, thumbUrl };
  };

  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(
      `Image upload timed out (30 s). Bucket: "${storage.app.options.storageBucket}". ` +
      'Check: 1) Storage bucket name in .env.local is correct, ' +
      '2) Firebase Storage is enabled (Build → Storage → Get Started), ' +
      '3) Storage rules cover "testimonials/" path.'
    )), TIMEOUT_MS),
  );

  return Promise.race([doUpload(), timeout]);
}

/**
 * Delete a single image from Storage by its download URL.
 * Silently swallows errors (e.g. already deleted).
 */
export async function deleteTestimonialImage(url: string): Promise<void> {
  try {
    await deleteObject(ref(storage, url));
  } catch {
    // ignore
  }
}