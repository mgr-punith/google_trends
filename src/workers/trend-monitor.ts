// src/workers/trend-monitor.ts
import { prisma } from "@/lib/prisma";
import { SpikeDetector } from "@/services/trends/SpikeDetector";
import notificationService from "@/services/notifications/NotificationService";
import { SpikeResult, TrendPoint } from "@/types/trend";
import { Alert, Keyword, TrendData, User } from "@prisma/client";

type ChangeInfo = {
  pctChange: number;
  currentValue: number;
  previousAvg?: number;
  timestamp: Date;
  severity: SpikeResult["severity"];
  reason: SpikeResult["reason"];
};

async function handleTriggeredAlert(alert: any, keyword: any, changeInfo: ChangeInfo) {
  console.log(`\n[ALERT CHECK] Processing alert ${alert.id} for keyword "${keyword.term}"`);
  console.log(`  - Change: ${changeInfo.pctChange.toFixed(2)}%`);
  console.log(`  - Current value: ${changeInfo.currentValue}`);
  console.log(`  - Alert thresholds: pct=${alert.thresholdPct}, abs=${alert.thresholdAbs}`);
  console.log(`  - Alert channels: ${JSON.stringify(alert.channels)}`);

  const meetsPctThreshold =
    alert.thresholdPct == null || Math.abs(changeInfo.pctChange) >= alert.thresholdPct;
  const meetsAbsThreshold =
    alert.thresholdAbs == null || changeInfo.currentValue >= alert.thresholdAbs;

  console.log(`  - Meets pct threshold: ${meetsPctThreshold}`);
  console.log(`  - Meets abs threshold: ${meetsAbsThreshold}`);

  if (!meetsPctThreshold || !meetsAbsThreshold) {
    console.log(`  ❌ Thresholds not met, skipping alert`);
    return;
  }

  // Check if we already sent a notification recently (debounce)
  const recentNotification = await prisma.notification.findFirst({
    where: {
      alertId: alert.id,
      createdAt: {
        gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
      },
    },
  });

  if (recentNotification) {
    console.log(`  ⏭️  Skipping duplicate alert for ${keyword.term} (sent ${recentNotification.createdAt})`);
    return;
  }

  console.log(`  ✅ Creating notification record...`);
  const notification = await prisma.notification.create({
    data: {
      userId: alert.userId,
      alertId: alert.id,
      type: "email",
      message: `Keyword "${keyword.term}" moved ${changeInfo.pctChange.toFixed(2)}% (now ${changeInfo.currentValue})`,
    },
  });

  // SOCKET (optional)
  const io = (global as any).__io;
  if (io) {
    io.to(alert.userId).emit("alert:new", {
      alertId: alert.id,
      keyword: keyword.term,
      change: changeInfo,
      notificationId: notification.id,
    });
  }

  // Email
  if (alert.channels?.includes("email")) {
    console.log(`  📧 Email channel enabled, fetching user...`);
    const user = await prisma.user.findUnique({
      where: { id: alert.userId },
      select: { email: true },
    });

    if (user?.email) {
      console.log(`  📧 Sending email to ${user.email}...`);
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: #4F46E5; color: white; padding: 30px 20px; text-align: center; }
            .content { padding: 30px 20px; }
            .keyword { background: #EEF2FF; padding: 15px; border-radius: 8px; border-left: 4px solid #4F46E5; margin: 20px 0; font-size: 20px; font-weight: bold; color: #4F46E5; }
            .stats { background: #f9fafb; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .stats p { margin: 8px 0; }
            .footer { background: #f9fafb; color: #6b7280; font-size: 13px; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb; }
            .button { display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚨 Spike Alert!</h1>
            </div>
            <div class="content">
              <p>Hi there,</p>
              <p>A spike has been detected for your monitored keyword:</p>
              <div class="keyword">📊 ${keyword.term}</div>
              <div class="stats">
                <p><strong>Change:</strong> ${changeInfo.pctChange > 0 ? '+' : ''}${changeInfo.pctChange.toFixed(2)}%</p>
                <p><strong>Current value:</strong> ${changeInfo.currentValue}</p>
                ${
                  changeInfo.previousAvg
                    ? `<p><strong>Prior average:</strong> ${changeInfo.previousAvg.toFixed(2)}</p>`
                    : ""
                }
                <p><strong>Severity:</strong> ${changeInfo.severity}</p>
                <p><strong>Time:</strong> ${new Date(changeInfo.timestamp).toLocaleString()}</p>
              </div>
              <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/alerts" class="button">View Alerts</a>
            </div>
            <div class="footer">
              <p>Google Trends Alert System</p>
            </div>
          </div>
        </body>
        </html>
      `;
      
      try {
        await notificationService.sendEmail({
          to: user.email,
          subject: `🚨 Spike Alert: ${keyword.term}`,
          html,
        });
        console.log(`  ✅ Email sent successfully to ${user.email} for ${keyword.term}`);
      } catch (emailError) {
        console.error(`  ❌ Email failed for ${keyword.term}:`, emailError);
        // Log the full error for debugging
        if (emailError instanceof Error) {
          console.error(`  Error details: ${emailError.message}`);
          console.error(`  Stack: ${emailError.stack}`);
        }
      }
    } else {
      console.log(`  ⚠️  User email not found for userId: ${alert.userId}`);
    }
  } else {
    console.log(`  ⚠️  Email channel not enabled in alert channels: ${JSON.stringify(alert.channels)}`);
  }
}

// MAIN WORKER LOOP
const detector = new SpikeDetector();

type KeywordWithRelations = Keyword & {
  trendData: TrendData[];
  alerts: Array<
    Alert & {
      user: Pick<User, "email"> | null;
    }
  >;
};

function calculatePreviousAverage(values: { value: number }[]) {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, item) => acc + item.value, 0);
  return sum / values.length;
}

async function runOnce() {
  console.log("\n" + "=".repeat(60));
  console.log(`[${new Date().toISOString()}] Worker: Checking keywords...`);

  // Fetch all active keywords with their recent trend data
  const keywords = (await prisma.keyword.findMany({
    where: { active: true },
    include: {
      trendData: {
        orderBy: { timestamp: "desc" },
        take: 30, // Only last 30 data points for efficiency
      },
      alerts: {
        include: {
          user: {
            select: {
              email: true,
            },
          },
        },
      },
    },
  })) as KeywordWithRelations[];

  console.log(`Found ${keywords.length} active keyword(s) to check`);
  
  // Log summary of keywords and their alerts
  for (const kw of keywords) {
    const alertCount = kw.alerts?.length || 0;
    const dataCount = kw.trendData?.length || 0;
    console.log(`  - "${kw.term}": ${dataCount} data points, ${alertCount} alert(s)`);
  }

  for (const kw of keywords) {
    try {
      // Skip if no trend data available
      if (!kw.trendData || kw.trendData.length < 2) {
        console.log(`Skipping ${kw.term}: insufficient data`);
        continue;
      }

      // Reverse to get chronological order for spike detection
      const trendDataAsc = [...kw.trendData].reverse();
      const trendPoints: TrendPoint[] = trendDataAsc.map((point) => ({
        id: point.id,
        keywordId: point.keywordId,
        timestamp: point.timestamp,
        value: point.value,
        related: point.related,
        createdAt: point.createdAt,
      }));
      const spike = detector.detectSpike(trendPoints);

      if (spike) {
        console.log(`\n🚨 SPIKE DETECTED for "${kw.term}"!`);
        console.log(`  - Change: ${spike.pctChange.toFixed(2)}%`);
        console.log(`  - Value: ${spike.value}`);
        console.log(`  - Severity: ${spike.severity}`);
        console.log(`  - Reason: ${spike.reason}`);

        // Process each alert for this keyword
        if (kw.alerts && kw.alerts.length > 0) {
          console.log(`  📋 Processing ${kw.alerts.length} alert(s) for ${kw.term}`);
          
          for (const alert of kw.alerts) {
            try {
              const previousWindow = trendDataAsc.slice(
                Math.max(0, trendDataAsc.length - detector.windowSize - 1),
                trendDataAsc.length - 1
              );

              await handleTriggeredAlert(alert, kw, {
                pctChange: spike.pctChange,
                currentValue: spike.value,
                previousAvg: previousWindow.length ? calculatePreviousAverage(previousWindow) : undefined,
                timestamp: spike.timestamp,
                severity: spike.severity,
                reason: spike.reason,
              });
            } catch (alertError) {
              console.error(`  ❌ Error handling alert ${alert.id}:`, alertError);
            }
          }
        } else {
          console.log(`  ⚠️  No active alerts configured for ${kw.term}`);
        }
      } else {
        // Log when no spike is detected (less verbose, but helpful for debugging)
        // Uncomment if needed: console.log(`No spike detected for "${kw.term}"`);
      }
    } catch (error) {
      console.error(`Error processing keyword "${kw.term}":`, error);
    }
  }
}

async function startWorker() {
  console.log("\n" + "=".repeat(60));
  console.log("🚀 TREND MONITOR WORKER STARTED");
  console.log("=".repeat(60));
  console.log(`Started at: ${new Date().toISOString()}`);
  console.log(`Checking for spikes every 30 seconds...`);
  console.log(`Email service: ${process.env.SMTP_HOST ? `SMTP (${process.env.SMTP_HOST})` : 'Ethereal (test mode - emails not delivered)'}`);
  console.log("=".repeat(60) + "\n");
  
  while (true) {
    try {
      await runOnce();
    } catch (error) {
      console.error("Worker error:", error);
    }

    console.log("\n" + "-".repeat(60));
    console.log("Sleeping 30 seconds...");
    console.log("-".repeat(60) + "\n");
    await new Promise((res) => setTimeout(res, 30000));
  }
}

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\nWorker shutting down...");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\nWorker shutting down...");
  await prisma.$disconnect();
  process.exit(0);
});

// START
startWorker().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
