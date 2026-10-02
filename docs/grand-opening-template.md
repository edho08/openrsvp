# Grand Opening invitation

Template ID: `kasir-pintar-grand-opening` (Plane `INTERNAL-90`).

The template recreates the reference's vertical emerald cover, invitation,
journey/video, office values, event details/Maps, RSVP and closing footer as
responsive Svelte components. Images and copy are placeholders until final assets
are supplied; the PDF is not used as a page background.

## Content contract

Select the template in the invitation designer. Heading/body/footer, colors and
font use the existing invitation fields. Date, timezone, location and description
come from the event. Optional content lives in the existing `InviteCard.customData`
JSON, avoiding a new schema or RSVP backend.

- `brandName`, `logoLabel`, `venueName`, `cityName`: branding and venue labels.
- `recipientName`, `recipientPrefix`: preview/default invitee. Public `?to=...`
  overrides the name; `/r/{token}` uses the existing attendee name. `?to` is display
  personalization, not authentication or a guest access restriction.
- `heroTitle`, `heroSubtitle`, `eyebrow`, `intro`: cover and invitation copy.
- `storyTitle`, `storyBody`, `videoTitle`, `videoCaption`: journey/video copy.
- `chapterTitle`, `chapterBody`, `values`: office section; up to four value labels.
- `closingBody`, `sinceLabel`: closing copy and journey label.
- `heroImage` (also building fallback), `buildingImage`, `storyImage` (video
  thumbnail fallback), `videoThumbnail`, `interiorImage`, `mapImage`, `footerImage`:
  optional image URLs. Failed or empty images render CSS placeholders.
- `videoUrl`, `mapsUrl`, `mapsLabel`: outbound video and map links. If Maps is
  empty, a Google Maps search uses the event location.
- `instagramUrl`, `linkedinUrl`, `youtubeUrl`, `tiktokUrl`: optional social links.

The designer exposes core copy, images, video, Maps and social fields; advanced
keys can be set through the existing invitation API and are preserved on save.
URLs permit HTTP(S) or same-origin absolute paths; unsafe URLs are omitted.
Video opens an external page rather than embedding third-party scripts.
Great Vibes is bundled under SIL OFL so script lettering does not depend on OS
fonts or a third-party font request.

## RSVP compatibility

The template accepts a Svelte snippet for the existing form/status markup,
placing it before the footer. Capacity, deadlines, validation, custom questions,
duplicate behavior and submit/update requests remain in the existing route.
Legacy templates keep their original standalone form. The public manage-response
API includes optional `invite` data; unavailable invitation data falls back to the
original management page.

## Verification

Run `npm run check` and `npm run build` in `web/`, then
`BASE_URL=http://localhost:<port> npx playwright test grand-opening.spec.ts`
against a running build. The browser tests mock event/RSVP data, cover desktop and
mobile through the existing Playwright projects, and verify personalization,
four cards, media fallback, safe links, form/footer order, submit/update and a
legacy template. Run `CGO_ENABLED=1 go test ./...` in the Docker backend toolchain
with the built frontend embedded for backend regression coverage.
