# Care. Doctor Profile Spec (v1)

## Purpose
Enable doctors to present trust, expertise, pricing, and availability clearly so patients can make fast booking decisions.

## Profile Data Model (Doctor-Owned)

### Identity + Trust
- `profile_id` (uuid, immutable)
- `display_name` (required)
- `photo_url` (required before live)
- `gmc_number` (required, verified)
- `verification_badges` (derived): GMC, DBS, insurance
- `status` (draft/pending/verified/live/suspended)

### Professional Snapshot
- `headline` (e.g. "GP with special interest in men's health")
- `specialties` (array, controlled list; e.g. GP)
- `special_interests` (array, doctor-editable from approved taxonomy)
  - examples: mental health, men’s health, women’s health, skin, ENT, fatigue, sleep
- `languages` (array)
- `years_experience` (int)

### Booking & Pricing
- `default_price_gbp` (required)
- `deposit_percent` (platform default, configurable policy)
- `appointment_types_enabled` (v1 clinic only)
- `min_notice_min`
- `radius_km`

### Location
- `clinic_name`
- `clinic_address`
- `clinic_lat`, `clinic_lng`

### Reputation
- `rating_avg` (derived)
- `review_count` (derived)
- `top_review_tags` (derived)

## Validation Rules
- Doctor cannot be `live` unless:
  - photo present
  - GMC verified
  - DBS verified
  - insurance verified
  - clinic location complete
  - default price set
- `special_interests` values must be from approved allow-list
- `headline` max 120 chars
- `default_price_gbp` must be within configured platform floor/ceiling

## Patient-Facing Card (List/Map Drawer)
Display order:
1. Photo + name
2. Specialty + key special interest
3. Verification badge ("GMC registered")
4. Availability label (Now / In 15 min / Next: time)
5. Price from + deposit note
6. Rating summary
7. Actions: `View`, `Book`

## Patient-Facing Full Profile
Sections:
1. Header: photo, name, badges, rating
2. "Good at" section: special interests chips
3. Availability + appointment details
4. Pricing block
   - deposit now
   - remainder after appointment
   - cancellation policy snippet
5. About doctor (headline + short bio)
6. Reviews (latest + highlights)
7. Safety note (not for emergencies)
8. Fixed CTA: `Book now`

## Doctor Editing UX
- Step 1: Basic profile (name/photo/headline)
- Step 2: Expertise (special interests/languages)
- Step 3: Pricing + booking settings
- Step 4: Clinic location
- Step 5: Review + submit for live approval

## Admin Controls
- Approve/reject profile changes affecting trust or discoverability
- Force-hide/suspend doctor profile
- Audit history of profile edits

## RLS Expectations
- Doctor can edit only own profile fields
- Derived trust fields (verification status) admin/system-write only
- Patients can read only `live` doctor profiles

## Analytics Events (recommended)
- `doctor_profile_viewed`
- `doctor_profile_book_clicked`
- `doctor_special_interest_filter_used`
- `doctor_profile_edit_submitted`
- `doctor_profile_live_approved`
