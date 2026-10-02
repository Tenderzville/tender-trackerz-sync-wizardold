# Tutorial video series: automated screen recordings

## Goal
Make step-by-step tutorial videos (MP4) by recording the real app automatically, with on-screen captions. Put them on a new Tutorials page. You download each video, upload it to YouTube, then paste the link back in the admin area so the Tutorials page plays the YouTube version.

## Video series (in order)
1. **Supplier: getting started.** Sign up as a supplier, choose the role, set preferences (sectors, counties, budget, keywords, eligibility such as AGPO), and turn on email and push alerts.
2. **Supplier dashboard tour.** Weekly tip and your numbers, Smart Matches, Browse Tenders and filters, tender details and the official portal link, Saved Tenders, AI Analysis (with the disclaimer), Consortiums, RFQs and quotes, Connect your apps, and the LinkedIn shout-out opt-in.
3. **Buyer: getting started.** Sign up as a buyer, post an RFQ with documents, choose public or private, review quotes and attachments, and add financier and sub-contractor details.
4. **Marketplace and service providers.** Browse providers, view a profile, contact a provider, and list your own service.

## Other videos worth adding
5. **Connect your apps:** Gmail, Google Sheets, Slack, Discord, Telegram, webhooks.
6. **Learning hub and blog:** guides, templates, submitting content.
7. **Community forum:** asking and answering questions.
8. **Subscription and payments:** free vs Pro vs Business, paying with Paystack, founding members.
9. **Admin (internal only, not public):** tender queue, posters, demo videos, monitoring.
10. **Kiswahili versions** of videos 1 to 3.

We will build and test video 1 first, wait for your approval, then do the rest one at a time.

## How each video is made
```text
script (steps + captions) -> automated browser clicks through the real app
  -> recorded at 1280x720 -> captions and title card added -> MP4 in Files
```
- Uses a dedicated demo account (for example demo-supplier@...) so no real user data appears on screen. Emails and phone numbers are blurred.
- Real tenders only. Nothing is made up.
- Videos are silent with captions. Voice-over can be added later.
- Each video is 2 to 4 minutes long.

## Tutorials page
- New public page at /tutorials, linked from the menu, footer and dashboard ("New here? Watch the tutorials").
- One card per video: title, description, length, and audience (Supplier, Buyer, Marketplace).
- Plays the YouTube video when an admin has added a link. Otherwise it shows "Coming soon".
- Admin dashboard: a new "Tutorials" section, reusing the demo-video manager pattern, to paste a YouTube link per video and reorder or hide videos.
- Added to the sitemap with VideoObject structured data for search.

## What you need to do
- **Demo accounts:** automated sign-in to your live app is not available from here. Either (a) create two demo accounts (supplier and buyer) and confirm their emails, or (b) let me sign them up through the app and you click the confirmation emails. Then I record while logged in.
- After each video: download it, upload it to YouTube, then paste the link in Admin > Tutorials.

## Technical details
- Recording: Playwright (Python) with `record_video_dir`, scripted step files in `/tmp/tutorials/<slug>/`, and captions burned in with ffmpeg `drawtext`. Output goes to `/mnt/documents/tutorials/<slug>.mp4`.
- Data: a new `tutorials` table (slug, title, description, audience, duration, youtube_url, sort_order, is_published) with public SELECT for published rows and admin-only write through `has_role`.
- Frontend: `client/src/pages/tutorials.tsx`, a route in `App.tsx`, `TutorialsManager.tsx` in the admin dashboard, and SEO through the existing `SEO` component. Additive only; no existing features removed.

## Devil's-advocate risks
- Login-dependent screens cannot be recorded until the demo accounts exist (main blocker).
- If the app's look changes, the videos go out of date. The scripts are saved so they can be re-recorded quickly.
- Silent videos get less engagement on YouTube, so voice-over is recommended later.
