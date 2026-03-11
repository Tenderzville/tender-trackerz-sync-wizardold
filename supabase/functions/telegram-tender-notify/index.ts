import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Sends new tender notifications to a Telegram channel.
 * Called after scraper saves new tenders.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const TELEGRAM_CHANNEL_ID = Deno.env.get('TELEGRAM_CHANNEL_ID');

    if (!TELEGRAM_BOT_TOKEN) {
      return new Response(
        JSON.stringify({ success: false, error: 'TELEGRAM_BOT_TOKEN not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!TELEGRAM_CHANNEL_ID) {
      return new Response(
        JSON.stringify({ success: false, error: 'TELEGRAM_CHANNEL_ID not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get tenders added in the last 14 hours (covers gap between 2x daily runs)
    const fourteenHoursAgo = new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString();
    // Only send tenders with 12+ days to deadline (no expiring ones)
    const minDeadline = new Date();
    minDeadline.setDate(minDeadline.getDate() + 12);
    const minDeadlineStr = minDeadline.toISOString().split('T')[0];

    const { data: newTenders, error } = await supabase
      .from('tenders')
      .select('id, title, organization, category, location, deadline, budget_estimate, tender_number, source_url, scraped_from')
      .gte('created_at', fourteenHoursAgo)
      .gte('deadline', minDeadlineStr)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching new tenders:', error);
      throw error;
    }

    if (!newTenders || newTenders.length === 0) {
      console.log('No new tenders to notify about');
      return new Response(
        JSON.stringify({ success: true, message: 'No new tenders to notify', sent: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Sending ${newTenders.length} tender notifications to Telegram`);
    let sentCount = 0;

    // Send summary message first
    const summaryMessage = `🔔 *${newTenders.length} New Tender${newTenders.length > 1 ? 's' : ''} Alert!*\n\n` +
      `📅 ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}\n` +
      `Sources: ${[...new Set(newTenders.map(t => t.scraped_from || 'Unknown'))].join(', ')}`;

    await sendTelegramMessage(TELEGRAM_BOT_TOKEN, TELEGRAM_CHANNEL_ID, summaryMessage);

    // Send individual tender notifications (max 10 to avoid rate limits)
    const tendersToNotify = newTenders.slice(0, 10);

    for (const tender of tendersToNotify) {
      const budgetStr = tender.budget_estimate
        ? `💰 KSh ${tender.budget_estimate.toLocaleString()}`
        : '💰 Budget: TBD';

      const deadlineStr = tender.deadline
        ? `📅 Deadline: ${new Date(tender.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
        : '';

      const sourceStr = tender.source_url
        ? `🔗 [View Source](${tender.source_url})`
        : '';

      const refStr = tender.tender_number
        ? `📋 Ref: \`${tender.tender_number}\``
        : '';

      const message = [
        `📌 *${escapeMarkdown(tender.title)}*`,
        '',
        `🏢 ${escapeMarkdown(tender.organization)}`,
        `📂 ${escapeMarkdown(tender.category)} | 📍 ${escapeMarkdown(tender.location)}`,
        budgetStr,
        deadlineStr,
        refStr,
        sourceStr,
        '',
        `🌐 [Browse on TenderAlert](https://tenderproapp.tenderzville-portal.co.ke/browse)`,
      ].filter(Boolean).join('\n');

      try {
        await sendTelegramMessage(TELEGRAM_BOT_TOKEN, TELEGRAM_CHANNEL_ID, message);
        sentCount++;
        // Rate limit: 1 message per second
        await new Promise(resolve => setTimeout(resolve, 1100));
      } catch (msgError) {
        console.error(`Failed to send tender ${tender.id}:`, msgError);
      }
    }

    if (newTenders.length > 10) {
      const moreMessage = `➕ *${newTenders.length - 10} more tenders* available on the platform.\n\n` +
        `🔗 [View All Tenders](https://tenderproapp.tenderzville-portal.co.ke/browse)`;
      await sendTelegramMessage(TELEGRAM_BOT_TOKEN, TELEGRAM_CHANNEL_ID, moreMessage);
    }

    console.log(`Successfully sent ${sentCount} Telegram notifications`);

    return new Response(
      JSON.stringify({ success: true, sent: sentCount, total: newTenders.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in telegram-tender-notify:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function sendTelegramMessage(botToken: string, chatId: string, text: string): Promise<void> {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Telegram API error [${response.status}]: ${errorData}`);
  }
}

function escapeMarkdown(text: string): string {
  if (!text) return '';
  return text
    .replace(/([_*\[\]()~`>#+\-=|{}.!])/g, '\\$1');
}
