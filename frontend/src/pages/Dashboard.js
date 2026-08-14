import React, { useEffect, useState } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3009";

const th = {
  textAlign: "left",
  padding: "12px 8px",
  borderBottom: "1px solid #334155",
  color: "#64748b",
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const td = {
  padding: "12px 8px",
  borderBottom: "1px solid #334155",
};

const cardStyle = {
  background: "#1e293b",
  borderRadius: 16,
  padding: 24,
  border: "1px solid #334155",
};

function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await fetch(`${API_URL}/api/dashboard`);
      if (!res.ok) throw new Error("Failed to fetch dashboard data");
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Only the very first load (no data yet) shows the full skeleton page.
  // A background refresh (interval or manual) keeps existing content on
  // screen and just shows a small "refreshing" indicator instead of
  // flashing skeletons over data the user is already looking at.
  const isInitialLoading = loading && !data;
  const isRefreshing = loading && !!data;

  if (error && !data)
    return (
      <div style={{ padding: 20, color: "#fca5a5", textAlign: "center" }}>
        Errore: {error}
      </div>
    );

  return (
    <div style={{ padding: 20, maxWidth: 1400, margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
          paddingBottom: 16,
          borderBottom: "1px solid #334155",
        }}
      >
        <h1
          style={{
            fontSize: 24,
            background: "linear-gradient(135deg, #10b981, #3b82f6)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          🌱 MyZubster Dashboard
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 14, color: "#94a3b8" }}>
            {isInitialLoading ? (
              <Skeleton width={160} height={14} />
            ) : (
              <>
                Updated: {new Date(data.timestamp).toLocaleString("it-IT")}
                {isRefreshing && (
                  <span style={{ marginLeft: 8, color: "#3b82f6" }}>
                    ⟳ aggiornamento...
                  </span>
                )}
              </>
            )}
          </span>
          <button
            onClick={fetchDashboard}
            disabled={loading}
            style={{
              background: "#1e293b",
              color: "#e2e8f0",
              border: "1px solid #334155",
              padding: "8px 16px",
              borderRadius: 8,
              cursor: loading ? "default" : "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      <StatsCards data={data} isLoading={isInitialLoading} />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 24,
          marginBottom: 32,
        }}
      >
        <ServiceCard
          title="🤖 AI Automation"
          status={data?.services?.ai}
          isLoading={isInitialLoading}
        />
        <ServiceCard
          title="📱 Telegram"
          status={data?.services?.telegram}
          isLoading={isInitialLoading}
        />
        <ServiceCard
          title="🐙 GitHub"
          status={data?.services?.github}
          isLoading={isInitialLoading}
        />
      </div>

      <h2 style={{ fontSize: 20, marginBottom: 16, color: "#f1f5f9" }}>
        📋 Recent Issues Analizzati
      </h2>
      <div style={{ ...cardStyle, marginBottom: 32, overflowX: "auto" }}>
        {isInitialLoading ? (
          <SkeletonTable columns={4} rows={5} />
        ) : data.recentIssues.length === 0 ? (
          <div style={{ textAlign: "center", color: "#64748b", padding: 24 }}>
            Nessun issue analizzato recentemente
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th}>ID</th>
                <th style={th}>Tipo</th>
                <th style={th}>Stato</th>
                <th style={th}>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {data.recentIssues.map((issue) => (
                <tr key={issue.id}>
                  <td style={{ ...td, fontFamily: "monospace" }}>{issue.id}</td>
                  <td style={td}>{issue.type}</td>
                  <td style={td}>
                    <StatusBadge status={issue.status} />
                  </td>
                  <td style={{ ...td, color: "#64748b" }}>
                    {new Date(issue.timestamp).toLocaleString("it-IT")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <h2 style={{ fontSize: 20, marginBottom: 16, color: "#f1f5f9" }}>
        💰 Active Bounties
      </h2>
      <div style={{ ...cardStyle, overflowX: "auto" }}>
        {isInitialLoading ? (
          <SkeletonTable columns={6} rows={5} />
        ) : data.activeBounties.length === 0 ? (
          <div style={{ textAlign: "center", color: "#64748b", padding: 24 }}>
            Nessun bounty attivo
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th}>ID</th>
                <th style={th}>Titolo</th>
                <th style={th}>Reward</th>
                <th style={th}>Stato</th>
                <th style={th}>Assegnato a</th>
                <th style={th}>Scadenza</th>
              </tr>
            </thead>
            <tbody>
              {data.activeBounties.map((b) => (
                <tr key={b.id}>
                  <td style={{ ...td, fontFamily: "monospace" }}>{b.id}</td>
                  <td style={td}>{b.title}</td>
                  <td
                    style={{
                      ...td,
                      color: "#10b981",
                      fontFamily: "monospace",
                    }}
                  >
                    {b.reward}
                  </td>
                  <td style={td}>
                    <StatusBadge status={b.status} />
                  </td>
                  <td style={td}>{b.assignee || "-"}</td>
                  <td style={{ ...td, color: "#64748b" }}>
                    {new Date(b.expiresAt).toLocaleDateString("it-IT")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// Small stats row summarizing the dashboard at a glance.
// Uses data.stats if the API provides it, otherwise derives simple
// counts from recentIssues / activeBounties so the section still
// renders something useful without an API change.
function StatsCards({ data, isLoading }) {
  const stats = isLoading
    ? [0, 1, 2, 3]
    : [
        {
          label: "Issues analizzati",
          value: data.stats?.totalIssues ?? data.recentIssues.length,
        },
        {
          label: "Bounty attivi",
          value: data.stats?.activeBounties ?? data.activeBounties.length,
        },
        {
          label: "Bounty completati",
          value:
            data.stats?.completedBounties ??
            data.activeBounties.filter((b) => b.status === "completed").length,
        },
        {
          label: "Servizi online",
          value:
            data.stats?.servicesOnline ??
            Object.values(data.services || {}).filter(
              (s) => s.status === "online",
            ).length,
        },
      ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 16,
        marginBottom: 24,
      }}
    >
      {stats.map((stat, i) => (
        <div key={i} style={{ ...cardStyle, padding: "16px 20px" }}>
          <div style={{ fontSize: 13, color: "#64748b", marginBottom: 8 }}>
            {isLoading ? <Skeleton width={100} /> : stat.label}
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 600,
              color: "#f1f5f9",
              fontFamily: "monospace",
            }}
          >
            {isLoading ? <Skeleton width={50} height={30} /> : stat.value}
          </div>
        </div>
      ))}
    </div>
  );
}

function ServiceCard({ title, status, isLoading }) {
  if (isLoading || !status) {
    return (
      <div style={cardStyle}>
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>
          <Skeleton width={120} height={20} />
        </h2>

        <Skeleton width={90} height={30} borderRadius={9999} />

        <div
          style={{
            marginTop: 16,
            paddingTop: 16,
            borderTop: "1px solid #334155",
          }}
        >
          {[...Array(4)].map((_, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "6px 0",
              }}
            >
              <Skeleton width={80} />
              <Skeleton width={60} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const statusClass =
    status.status === "online"
      ? "status-online"
      : status.status === "degraded"
        ? "status-degraded"
        : "status-offline";

  return (
    <div style={cardStyle}>
      <h2
        style={{
          fontSize: 16,
          color: "#94a3b8",
          marginBottom: 12,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        {title}
      </h2>

      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "4px 12px",
          borderRadius: 9999,
          fontSize: 14,
          fontWeight: 500,
          background:
            statusClass === "status-online"
              ? "#065f46"
              : statusClass === "status-degraded"
                ? "#78350f"
                : "#7f1d1d",
          color:
            statusClass === "status-online"
              ? "#6ee7b7"
              : statusClass === "status-degraded"
                ? "#fcd34d"
                : "#fca5a5",
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background:
              statusClass === "status-online"
                ? "#10b981"
                : statusClass === "status-degraded"
                  ? "#f59e0b"
                  : "#ef4444",
            boxShadow:
              statusClass === "status-online" ? "0 0 8px #10b981" : "none",
          }}
        />
        {status.status.toUpperCase()}
      </span>

      <div
        style={{
          marginTop: 16,
          paddingTop: 16,
          borderTop: "1px solid #334155",
        }}
      >
        {Object.entries(status.details || {}).map(([key, value]) => (
          <div
            key={key}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "4px 0",
              fontSize: 14,
            }}
          >
            <span style={{ color: "#64748b", textTransform: "capitalize" }}>
              {key.replace(/([A-Z])/g, " $1").trim()}
            </span>
            <span style={{ color: "#e2e8f0", fontFamily: "monospace" }}>
              {String(value)}
            </span>
          </div>
        ))}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "4px 0",
            fontSize: 14,
          }}
        >
          <span style={{ color: "#64748b" }}>Latenza</span>
          <span style={{ color: "#e2e8f0", fontFamily: "monospace" }}>
            {status.latency}
          </span>
        </div>
      </div>
    </div>
  );
}

// Generic skeleton table used for both the issues and bounties tables
// while data is loading. `columns` controls how many skeleton cells
// each row shows, so it matches whichever table it's standing in for.
// Renders a <thead> with header skeletons matching the column count
// so the skeleton and the loaded table occupy the same height —
// no layout shift when data replaces the skeleton.
function SkeletonTable({ columns, rows }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          {[...Array(columns)].map((_, c) => (
            <th key={c} style={th}>
              <Skeleton width={c === 0 ? 50 : 80} height={12} />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {[...Array(rows)].map((_, r) => (
          <tr key={r}>
            {[...Array(columns)].map((_, c) => (
              <td key={c} style={td}>
                <Skeleton width={c === 0 ? 60 : 100} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function StatusBadge({ status }) {
  const { bg, color } = badgeColor(status);
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 4,
        fontSize: 12,
        fontWeight: 500,
        background: bg,
        color,
      }}
    >
      {status}
    </span>
  );
}

function badgeColor(status) {
  switch (status) {
    case "open":
      return { bg: "#1e3a5f", color: "#60a5fa" };
    case "in-progress":
      return { bg: "#1e3a5f", color: "#a78bfa" };
    case "completed":
      return { bg: "#065f46", color: "#6ee7b7" };
    case "claimed":
      return { bg: "#78350f", color: "#fcd34d" };
    case "failed":
      return { bg: "#7f1d1d", color: "#fca5a5" };
    case "pending":
      return { bg: "#451a03", color: "#fdba74" };
    default:
      return { bg: "#334155", color: "#e2e8f0" };
  }
}

export default Dashboard;
