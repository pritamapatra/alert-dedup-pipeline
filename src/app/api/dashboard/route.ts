import { NextResponse } from "next/server";
import { db } from "@/db";
import { alerts, dedupeGroups } from "@/db/schema";
import { desc, eq, count, and } from "drizzle-orm";

export async function GET() {
  const [
    allGroups,
    totalAlerts,
    duplicateAlerts,
    actionableAlerts,
    criticalGroups,
    recentAlerts,
  ] = await Promise.all([
    db.query.dedupeGroups.findMany({
      orderBy: [desc(dedupeGroups.lastSeenAt)],
      limit: 50,
    }),

    db.select({ value: count() }).from(alerts),

    db
      .select({ value: count() })
      .from(alerts)
      .where(eq(alerts.isDuplicate, true)),

    db
      .select({ value: count() })
      .from(alerts)
      .where(eq(alerts.isDuplicate, false)),

    db
      .select({ value: count() })
      .from(dedupeGroups)
      .where(
        and(
          eq(dedupeGroups.severity, "critical"),
          eq(dedupeGroups.isActionable, true)
        )
      ),

    db.query.alerts.findMany({
      orderBy: [desc(alerts.createdAt)],
      limit: 20,
    }),
  ]);

  const total = totalAlerts[0].value;
  const duplicates = duplicateAlerts[0].value;
  const actionable = actionableAlerts[0].value;
  const critical = criticalGroups[0].value;

  const noiseReductionRate =
    total > 0 ? ((Number(duplicates) / Number(total)) * 100).toFixed(1) : "0.0";

  return NextResponse.json({
    stats: {
      totalAlerts: Number(total),
      duplicatesFiltered: Number(duplicates),
      actionableAlerts: Number(actionable),
      criticalGroups: Number(critical),
      noiseReductionRate: `${noiseReductionRate}%`,
    },
    groups: allGroups,
    recentAlerts,
  });
}