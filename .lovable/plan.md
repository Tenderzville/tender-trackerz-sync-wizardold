# Plan: Email notifications toggle + free-app integrations directory

## What you'll get

1. **Email notifications to your Gmail** — a per-user on/off toggle in Settings. When on, you get tender alerts in your inbox, similar to the Telegram ones: new matching tenders and deadline reminders. No setup needed — it sends to the email you signed up with.
2. **A "Connect your apps" directory** in Settings listing every free integration you can switch on, each with a one-line "what it does" and setup steps:

| App | What it does | Cost |
|---|---|---|
| **Gmail / Email** | Tender alerts + deadline reminders in your inbox | Free (built-in) |
| **Google Sheets** | Every matching tender appended as a row in your own sheet | Free (via webhook / Apps Script) |
| **Slack** | Alerts posted to your chosen Slack channel | Free (incoming webhook) |
| **Discord** | Alerts posted to your Discord server | Free (webhook) |
| **Telegram (personal)** | Alerts to your own Telegram chat | Free (bot token) |
| **Microsoft Teams** | Alerts to a Teams channel | Free (webhook) |
| **n8n** | Full automation — route tenders anywhere | Free (self-hosted) |
| **Zapier** | Connect to 6,000+ apps | Free tier (100 tasks/mo) |
| **Make.com** | Visual automation to Sheets/CRM/etc. | Free tier (1,000 ops/mo) |
| **Custom webhook / API** | For developers and AI agents | Free |

Each app card gets a "How to connect" guide with the exact webhook URL steps for that app, plus a test button so you can confirm it works before relying on it.

## How it works (technical)

- **Wire up the existing integrations page.** The integrations UI (`SettingsIntegrationsPage.tsx`) already exists with the `user_integrations` table and the `user-integration-dispatcher` function, but it lives in the legacy `src/` tree and isn't routed. Move/port it into the active `client/src` app as a tab on the Settings page (additive — nothing removed).
- **Email toggle**: add `email_notifications_enabled` + frequency (instant / daily digest) to the profile settings. New `email-tender-notify` edge function mirrors the Telegram one — same filters (14-day window, alignment match), same dedupe (`email_notified_at` column on `tenders`) — and sends via the existing email sender. Cron runs it on the same schedule as Telegram, but only for users who toggled it on.
- **Integrations directory**: the Settings tab shows the app cards above. Selecting one pre-fills the provider on the webhook form and shows app-specific setup instructions (e.g. Slack: create incoming webhook → paste URL; Sheets: Apps Script snippet or Zapier template). Test button POSTs a sample tender to the saved URL and reports success/failure with the app's response.
- **Delivery tracking**: each integration already records last status, error, and delivery count — surface these as green/red badges per card so users see at a glance what's working.
- **Validation**: webhook URLs validated (https required), email toggle verified server-side before sending.

## What you need to do

- **Email alerts**: nothing. We send to the email on your Supabase account using the project's existing email sender. Just toggle it on in Settings.
- **Gmail specifically**: make sure `tenderproapp@tenderzville-portal.co.ke` (or whatever sender domain Supabase is configured with) is not landing in your Promotions/Spam tab. If you want a custom "from" address, that needs DNS records added in your domain provider — we can do that separately.
- **Slack / Discord / Teams**: create an incoming webhook in your workspace and paste the URL into the integration form.
- **Google Sheets**: use the built-in Apps Script snippet we provide, or connect via Zapier/Make and paste their webhook URL.
- **Telegram personal**: create a Telegram bot with @BotFather, get the bot token, and paste it (we treat it like a webhook/API key).
- **n8n / Zapier / Make**: copy the webhook URL we generate and use it as the trigger in your workflow.

No paid subscriptions are required for the free tiers listed above.

## Verification

- Trigger `email-tender-notify` manually and confirm an email lands.
- Trigger the dispatcher against a test webhook URL and confirm a 200 + delivery count increments.
- Check the Settings page renders the directory, toggle, and badges; run the security scan after.

