import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { alerts, dedupeGroups } from "@/db/schema";
import { eq, and, gte } from "drizzle-orm";
import { randomUUID } from "crypto";

type SeverityLevel = "critical" | "high" | "medium" | "low";

interface RawAlertPayload {
  id?: string;
  service?: string;
  error?: string;
  message?: string;
  severity?: string;
  timestamp?: string;
  [key: string]: unknown;
}

function normalizeSeverity(raw: string | undefined): SeverityLevel {
  const val = (raw ?? "").toLowerCase();
  if (val === "critical" || val === "p0" || val === "fatal") return "critical";
  if (val === "high" || val === "p1" || val === "error") return "high";
  if (val === "low" || val === "p3" || val === "info") return "low";
  return "medium";
}

function buildErrorSignature(payload: RawAlertPayload): string {
  const service = (payload.service ?? "unknown").toLowerCase().trim();
  const error = (payload.error ?? payload.message ?? "unknown").toLowerCase().trim();
  const cleaned = error.replace(/[0-9a-f]{8}-[0-9a-f-]{27}/gi, "UUID")
                       .replace(/\d{10,}/g, "TIMESTAMP")
                       .replace(/\b\d+\b/g, "N");
  return `${service}::${cleaned}`;
}

function normalizePayload(raw: RawAlertPayload) {
  return {
    sourceId: raw.id ?? randomUUID(),
    service: (raw.service ?? "unknown").trim(),
    message: raw.message ?? raw.error ?? "No message provided",
    severity: normalizeSeverity(raw.severity),
    errorSignature: buildErrorSignature(raw),
    occurredAt: raw.timestamp ? new Date(raw.timestamp) : new Date(),
    rawPayload: JSON.stringify(raw),
  };
}

export async function POST(request: NextRequest) {
  let body: RawAlertPayload;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  if (!body.service && !body.message && !body.error) {
    return NextResponse.json(
      { error: "Payload must contain at least one of: service, message, error" },
      { status: 400 }
    );
  }

  const normalized = normalizePayload(body);

  // Dedupe window: 1 hour
  const windowStart = new Date(Date.now() - 60 * 60 * 1000);

  const existingGroup = await db.query.dedupeGroups.findFirst({
    where: and(
      eq(dedupeGroups.service, normalized.service),
      eq(dedupeGroups.errorSignature, normalized.errorSignature),
      gte(dedupeGroups.lastSeenAt, windowStart)
    ),
  });

  if (existingGroup) {
    await db
      .update(dedupeGroups)
      .set({
        lastSeenAt: normalized.occurredAt,
        count: existingGroup.count + 1,
      })
      .where(eq(dedupeGroups.id, existingGroup.id));

    const [inserted] = await db
      .insert(alerts)
      .values({
        ...normalized,
        isDuplicate: true,
        dedupeGroupId: existingGroup.id,
      })
      .returning();

    return NextResponse.json({
      status: "deduplicated",
      alertId: inserted.id,
      groupId: existingGroup.id,
      groupCount: existingGroup.count + 1,
      message: "Alert matched an existing group within the 1-hour window",
    });
  }

  const newGroupId = randomUUID();

  await db.insert(dedupeGroups).values({
    id: newGroupId,
    service: normalized.service,
    errorSignature: normalized.errorSignature,
    severity: normalized.severity,
    firstSeenAt: normalized.occurredAt,
    lastSeenAt: normalized.occurredAt,
    count: 1,
    isActionable: true,
  });

  const [inserted] = await db
    .insert(alerts)
    .values({
      ...normalized,
      isDuplicate: false,
      dedupeGroupId: newGroupId,
    })
    .returning();

  return NextResponse.json({
    status: "actionable",
    alertId: inserted.id,
    groupId: newGroupId,
    message: "New unique alert — forwarded as actionable",
  });
}