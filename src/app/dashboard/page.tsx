"use client";

import { useEffect, useState } from "react";
import { UserButton } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

type Severity = "critical" | "high" | "medium" | "low";

interface Stats {
  totalAlerts: number;
  duplicatesFiltered: number;
  actionableAlerts: number;
  criticalGroups: number;
  noiseReductionRate: string;
}

interface DedupeGroup {
  id: string;
  service: string;
  errorSignature: string;
  severity: Severity;
  firstSeenAt: string;
  lastSeenAt: string;
  count: number;
  isActionable: boolean;
}

interface Alert {
  id: number;
  service: string;
  message: string;
  severity: Severity;
  isDuplicate: boolean;
  createdAt: string;
}

interface DashboardData {
  stats: Stats;
  groups: DedupeGroup[];
  recentAlerts: Alert[];
}

const severityColors: Record<Severity, string> = {
  critical: "bg-red-500/10 text-red-400 border border-red-500/20",
  high: "bg-orange-500/10 text-orange-400 border border-orange-500/20",
  medium: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
  low: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
};

const severityDot: Record<Severity, string> = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-blue-500",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"groups" | "alerts">("groups");

  async function fetchData() {
    try {
      const res = await fetch("/api/dashboard");
      if (!res.ok) throw new Error("Failed to fetch dashboard data");
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-sm tracking-tight">
              Alert Dedup Pipeline
            </span>
            <span className="text-xs text-gray-500 hidden sm:block">
              Nexla Express
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={fetchData}
              className="text-xs text-gray-400 hover:text-gray-200 transition-colors px-3 py-1.5 rounded-md border border-gray-700 hover:border-gray-500"
            >
              Refresh
            </button>
            <UserButton />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-white">
            Incident Alert Dashboard
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Real-time deduplication and noise reduction for engineering teams
          </p>
        </div>

        {loading && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-24 rounded-xl bg-gray-800/50 animate-pulse"
              />
            ))}
          </div>
        )}

        {error && (
          <div className="mb-6 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {data && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              {[
                {
                  label: "Total Alerts",
                  value: data.stats.totalAlerts,
                  sub: "ingested",
                },
                {
                  label: "Actionable",
                  value: data.stats.actionableAlerts,
                  sub: "unique alerts",
                },
                {
                  label: "Deduplicated",
                  value: data.stats.duplicatesFiltered,
                  sub: "noise filtered",
                },
                {
                  label: "Critical Groups",
                  value: data.stats.criticalGroups,
                  sub: "need attention",
                },
                {
                  label: "Noise Reduction",
                  value: data.stats.noiseReductionRate,
                  sub: "efficiency",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-4"
                >
                  <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                  <p className="text-2xl font-semibold text-white tabular-nums">
                    {stat.value}
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">{stat.sub}</p>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-5 border-b border-gray-800">
              {(["groups", "alerts"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                    activeTab === tab
                      ? "border-emerald-500 text-emerald-400"
                      : "border-transparent text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {tab === "groups" ? "Dedupe Groups" : "Recent Alerts"}
                </button>
              ))}
            </div>

            {/* Dedupe Groups Table */}
            {activeTab === "groups" && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                {data.groups.length === 0 ? (
                  <div className="py-16 text-center text-gray-500 text-sm">
                    No alert groups yet. Send alerts to{" "}
                    <code className="text-gray-400">/api/ingest</code> to get
                    started.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider">
                          <th className="text-left px-5 py-3">Service</th>
                          <th className="text-left px-5 py-3">Severity</th>
                          <th className="text-left px-5 py-3 hidden md:table-cell">
                            Error Signature
                          </th>
                          <th className="text-left px-5 py-3">Count</th>
                          <th className="text-left px-5 py-3 hidden lg:table-cell">
                            First Seen
                          </th>
                          <th className="text-left px-5 py-3">Last Seen</th>
                          <th className="text-left px-5 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.groups.map((group, i) => (
                          <tr
                            key={group.id}
                            className={`border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors ${
                              i === data.groups.length - 1 ? "border-b-0" : ""
                            }`}
                          >
                            <td className="px-5 py-3.5 font-medium text-white">
                              {group.service}
                            </td>
                            <td className="px-5 py-3.5">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                                  severityColors[group.severity]
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    severityDot[group.severity]
                                  }`}
                                />
                                {group.severity}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 hidden md:table-cell">
                              <code className="text-xs text-gray-400 font-mono truncate max-w-xs block">
                                {group.errorSignature}
                              </code>
                            </td>
                            <td className="px-5 py-3.5 tabular-nums text-white font-semibold">
                              {group.count}
                            </td>
                            <td className="px-5 py-3.5 text-gray-400 hidden lg:table-cell">
                              {timeAgo(group.firstSeenAt)}
                            </td>
                            <td className="px-5 py-3.5 text-gray-400">
                              {timeAgo(group.lastSeenAt)}
                            </td>
                            <td className="px-5 py-3.5">
                              {group.isActionable ? (
                                <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                  Actionable
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                                  <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                                  Suppressed
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Recent Alerts Table */}
            {activeTab === "alerts" && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                {data.recentAlerts.length === 0 ? (
                  <div className="py-16 text-center text-gray-500 text-sm">
                    No alerts ingested yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider">
                          <th className="text-left px-5 py-3">ID</th>
                          <th className="text-left px-5 py-3">Service</th>
                          <th className="text-left px-5 py-3 hidden md:table-cell">
                            Message
                          </th>
                          <th className="text-left px-5 py-3">Severity</th>
                          <th className="text-left px-5 py-3">Type</th>
                          <th className="text-left px-5 py-3">Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.recentAlerts.map((alert, i) => (
                          <tr
                            key={alert.id}
                            className={`border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors ${
                              i === data.recentAlerts.length - 1
                                ? "border-b-0"
                                : ""
                            }`}
                          >
                            <td className="px-5 py-3.5 text-gray-500 tabular-nums">
                              #{alert.id}
                            </td>
                            <td className="px-5 py-3.5 font-medium text-white">
                              {alert.service}
                            </td>
                            <td className="px-5 py-3.5 text-gray-400 hidden md:table-cell max-w-xs truncate">
                              {alert.message}
                            </td>
                            <td className="px-5 py-3.5">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                                  severityColors[alert.severity]
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    severityDot[alert.severity]
                                  }`}
                                />
                                {alert.severity}
                              </span>
                            </td>
                            <td className="px-5 py-3.5">
                              {alert.isDuplicate ? (
                                <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
                                  Duplicate
                                </span>
                              ) : (
                                <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                  Actionable
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-3.5 text-gray-400">
                              {timeAgo(alert.createdAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}