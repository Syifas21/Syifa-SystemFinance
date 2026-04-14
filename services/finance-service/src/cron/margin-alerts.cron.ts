import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface MarginAlert {
  estimation_id: string;
  item_name: string;
  sbu: string;
  category: string;
  cost: number;
  selling_price: number;
  applied_margin: number;
  target_margin: number;
  deviation: number;
}

/**
 * Check for estimations with margins below target threshold
 * Alert if margin < target - 3%
 */
async function checkMarginHealth(): Promise<MarginAlert[]> {
  console.log('🔍 Running margin health check...');

  try {
    // In real implementation, this would query estimation/BOQ items
    // For now, we check recent violations
    const recentViolations = await prisma.margin_policy_violations.findMany({
      where: {
        violated_at: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
        approved_by: null, // Not yet approved
      },
      include: {
        policy: true,
      },
      orderBy: {
        violated_at: 'desc',
      },
    });

    const alerts: MarginAlert[] = [];

    for (const violation of recentViolations) {
      const targetMargin = Number(violation.policy_min_margin);
      const appliedMargin = Number(violation.applied_margin);
      const deviation = appliedMargin - targetMargin;

      // Alert if margin is below target - 3%
      if (deviation < -3.0) {
        alerts.push({
          estimation_id: violation.estimation_id || 'N/A',
          item_name: `${violation.sbu} - ${violation.category}`,
          sbu: violation.sbu,
          category: violation.category,
          cost: Number(violation.cost_price),
          selling_price: Number(violation.selling_price),
          applied_margin: appliedMargin,
          target_margin: targetMargin,
          deviation: deviation,
        });
      }
    }

    return alerts;
  } catch (error) {
    console.error('Error checking margin health:', error);
    return [];
  }
}

/**
 * Send Slack notification (placeholder - implement with actual Slack webhook)
 */
async function sendSlackAlert(alerts: MarginAlert[]): Promise<void> {
  if (alerts.length === 0) {
    console.log('✅ No margin alerts to send');
    return;
  }

  console.log(`⚠️ Sending ${alerts.length} margin alerts to Slack...`);

  // Slack webhook URL (should be in environment variables)
  const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

  if (!SLACK_WEBHOOK_URL) {
    console.warn('⚠️ SLACK_WEBHOOK_URL not configured, skipping Slack notification');
    console.log('Alerts that would be sent:');
    alerts.forEach((alert) => {
      console.log(
        `  - ${alert.item_name}: Margin ${alert.applied_margin.toFixed(2)}% (Target: ${alert.target_margin.toFixed(2)}%, Deviation: ${alert.deviation.toFixed(2)}%)`
      );
    });
    return;
  }

  // Format Slack message
  const message = {
    text: `🚨 *Margin Alert* - ${alerts.length} item(s) below target`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🚨 Margin Policy Alert',
          emoji: true,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `Found *${alerts.length}* estimation item(s) with margins below target threshold (target - 3%)`,
        },
      },
      {
        type: 'divider',
      },
    ],
  };

  // Add alert details
  alerts.slice(0, 10).forEach((alert) => {
    message.blocks.push({
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Item:*\n${alert.item_name}`,
        },
        {
          type: 'mrkdwn',
          text: `*SBU:*\n${alert.sbu}`,
        },
        {
          type: 'mrkdwn',
          text: `*Applied Margin:*\n${alert.applied_margin.toFixed(2)}%`,
        },
        {
          type: 'mrkdwn',
          text: `*Target Margin:*\n${alert.target_margin.toFixed(2)}%`,
        },
        {
          type: 'mrkdwn',
          text: `*Deviation:*\n${alert.deviation.toFixed(2)}%`,
        },
        {
          type: 'mrkdwn',
          text: `*Cost:*\nRp ${alert.cost.toLocaleString('id-ID')}`,
        },
      ],
    });
  });

  if (alerts.length > 10) {
    message.blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `_...and ${alerts.length - 10} more alerts_`,
      },
    });
  }

  try {
    const response = await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });

    if (response.ok) {
      console.log('✅ Slack alert sent successfully');
    } else {
      console.error('❌ Failed to send Slack alert:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('❌ Error sending Slack alert:', error);
  }
}

/**
 * Send email notification (placeholder - implement with actual email service)
 */
async function sendEmailAlert(alerts: MarginAlert[]): Promise<void> {
  if (alerts.length === 0) {
    return;
  }

  console.log(`📧 Sending ${alerts.length} margin alerts via email...`);

  // Email configuration (should be in environment variables)
  const EMAIL_TO = process.env.MARGIN_ALERT_EMAIL_TO || 'ceo@company.com,finance@company.com';

  console.log(`Email would be sent to: ${EMAIL_TO}`);

  // In real implementation, use nodemailer or SendGrid
  // For now, just log the alert
  console.log('Email content:');
  console.log('Subject: Margin Policy Alert - Items Below Target');
  console.log('Body:');
  alerts.forEach((alert) => {
    console.log(
      `  - ${alert.item_name}: Margin ${alert.applied_margin.toFixed(2)}% (Target: ${alert.target_margin.toFixed(2)}%, Deviation: ${alert.deviation.toFixed(2)}%)`
    );
  });
}

/**
 * Main cron job function
 */
async function runMarginAlertCheck(): Promise<void> {
  const startTime = Date.now();
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🕐 Margin Alert Cron Job Started: ${new Date().toISOString()}`);
  console.log('='.repeat(60));

  try {
    // Check margin health
    const alerts = await checkMarginHealth();

    console.log(`Found ${alerts.length} margin alert(s)`);

    if (alerts.length > 0) {
      // Send notifications
      await Promise.all([sendSlackAlert(alerts), sendEmailAlert(alerts)]);
    } else {
      console.log('✅ All margins are healthy - no alerts needed');
    }

    const duration = Date.now() - startTime;
    console.log(`✅ Margin Alert Cron Job Completed in ${duration}ms`);
  } catch (error) {
    console.error('❌ Error in margin alert cron job:', error);
  }

  console.log('='.repeat(60));
}

/**
 * Initialize cron jobs
 */
export function initializeMarginAlertCron(): void {
  console.log('📅 Initializing Margin Alert Cron Jobs...');

  // Morning check at 08:00 WIB
  cron.schedule(
    '0 8 * * *',
    async () => {
      console.log('☀️ Running morning margin alert check (08:00 WIB)');
      await runMarginAlertCheck();
    },
    {
      timezone: 'Asia/Jakarta',
    }
  );

  // Afternoon check at 17:00 WIB
  cron.schedule(
    '0 17 * * *',
    async () => {
      console.log('🌆 Running afternoon margin alert check (17:00 WIB)');
      await runMarginAlertCheck();
    },
    {
      timezone: 'Asia/Jakarta',
    }
  );

  console.log('✅ Margin Alert Cron Jobs initialized:');
  console.log('   - Morning check: 08:00 WIB');
  console.log('   - Afternoon check: 17:00 WIB');
  console.log('   - Timezone: Asia/Jakarta');
}

/**
 * Run manual check (for testing)
 */
export async function runManualMarginCheck(): Promise<void> {
  console.log('🔧 Running manual margin alert check...');
  await runMarginAlertCheck();
}

// Export for use in other modules
export { checkMarginHealth, sendSlackAlert, sendEmailAlert };
