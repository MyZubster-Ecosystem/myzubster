import React from 'react';

const cardStyle = {
  background: 'rgba(15, 23, 42, 0.92)',
  border: '1px solid #334155',
  borderRadius: 16,
  padding: 20,
};

const linkStyle = {
  display: 'inline-block',
  marginTop: 10,
  color: '#67e8f9',
  fontWeight: 800,
  textDecoration: 'none',
};

export default function DaoPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#020617', color: '#e2e8f0', padding: '32px 18px 56px' }}>
      <div style={{ width: 'min(1100px, 100%)', margin: '0 auto' }}>
        <div style={{ marginBottom: 28 }}>
          <a href="/" style={{ color: '#94a3b8', textDecoration: 'none' }}>← MyZubster</a>
          <h1 style={{ fontSize: 'clamp(2rem, 6vw, 4rem)', margin: '14px 0 8px' }}>🏛️ MyZubster DAO</h1>
          <p style={{ color: '#94a3b8', maxWidth: 820, lineHeight: 1.6 }}>
            Public governance status for the MyZubster ecosystem. The DAO is currently in bootstrap and verification mode: public documentation and review are visible, while consequential governance and treasury actions remain gated until the required technical and independent-review controls are satisfied.
          </p>
        </div>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 24 }}>
          <div style={cardStyle}>
            <div style={{ fontSize: 28 }}>🧱</div>
            <h2>Bootstrap status</h2>
            <p style={{ color: '#94a3b8', lineHeight: 1.5 }}>Human membership, independent review, ledger integrity and branch-protection gates are still part of the DAO bootstrap checklist.</p>
            <a style={linkStyle} href="https://github.com/MyZubster-Ecosystem/myzubster/issues/680" target="_blank" rel="noopener noreferrer">Open DAO bootstrap issue →</a>
          </div>

          <div style={cardStyle}>
            <div style={{ fontSize: 28 }}>🤖</div>
            <h2>Zorgax governance role</h2>
            <p style={{ color: '#94a3b8', lineHeight: 1.5 }}>Zorgax may observe, summarize and support evidence workflows, but AI entities do not receive binding governance weight while the DAO remains in bootstrap.</p>
            <a style={linkStyle} href="https://github.com/MyZubster-Ecosystem/myzubster/blob/main/config/entities/zorgax.json" target="_blank" rel="noopener noreferrer">View Zorgax public config →</a>
          </div>

          <div style={cardStyle}>
            <div style={{ fontSize: 28 }}>🌱</div>
            <h2>LIFE advisory lane</h2>
            <p style={{ color: '#94a3b8', lineHeight: 1.5 }}>
              LIFE participants can opt in as Observer or Advisor for technical, scientific, KPI/MRV and replication discussions. Their binding DAO voting power remains zero.
            </p>
            <a style={linkStyle} href="/api/dao/life/status">View LIFE DAO status →</a>
          </div>

          <div style={cardStyle}>
            <div style={{ fontSize: 28 }}>🔎</div>
            <h2>Evidence-first governance</h2>
            <p style={{ color: '#94a3b8', lineHeight: 1.5 }}>Public issues, commits, reviews and independently reproducible evidence are the source of truth. A proposal, merge or vote does not automatically authorize settlement or treasury movement.</p>
            <a style={linkStyle} href="https://github.com/MyZubster-Ecosystem/myzubster" target="_blank" rel="noopener noreferrer">Inspect the repository →</a>
          </div>
        </section>

        <section style={{ ...cardStyle, marginBottom: 24 }}>
          <h2>Current governance boundary</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginTop: 14 }}>
            {[
              ['Public documentation', 'ACTIVE'],
              ['Independent review', 'REQUIRED'],
              ['Human member bootstrap', 'IN PROGRESS'],
              ['AI binding voting power', 'DISABLED'],
              ['LIFE Observer / Advisor binding power', '0'],
              ['Automatic treasury execution', 'NOT PUBLICLY ENABLED'],
              ['MYZ', 'INTERNAL REWARD / ACCOUNTING'],
            ].map(([label, value]) => (
              <div key={label} style={{ background: '#0f172a', padding: 14, borderRadius: 12, border: '1px solid #1e293b' }}>
                <div style={{ color: '#94a3b8', fontSize: 13 }}>{label}</div>
                <div style={{ marginTop: 6, fontWeight: 900 }}>{value}</div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ ...cardStyle, marginBottom: 24 }}>
          <h2>🌱 LIFE participatory governance</h2>
          <p style={{ color: '#94a3b8', lineHeight: 1.6, maxWidth: 900 }}>
            This DAO lane is intentionally separate from the legal governance of any LIFE proposal or funded project. A LIFE Observer or LIFE Advisor may contribute evidence-backed recommendations, but cannot authorize treasury transfers, project budget or co-financing commitments, Grant Agreement changes, Consortium Agreement changes or other legal commitments.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginTop: 16 }}>
            <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 16 }}>
              <strong>LIFE Observer</strong>
              <p style={{ color: '#94a3b8', lineHeight: 1.5 }}>Observes public governance and contributes bounded feedback after explicit opt-in.</p>
            </div>
            <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 16 }}>
              <strong>LIFE Advisor</strong>
              <p style={{ color: '#94a3b8', lineHeight: 1.5 }}>Provides scoped technical, scientific, KPI/MRV, data-governance or replication advice.</p>
            </div>
            <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 16 }}>
              <strong>Consent gate</strong>
              <p style={{ color: '#94a3b8', lineHeight: 1.5 }}>No person or organization is publicly registered as a LIFE DAO participant without explicit consent and maintainer review.</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 16 }}>
            <a style={linkStyle} href="/api/dao/life/participants">Public participant registry →</a>
            <a style={linkStyle} href="https://github.com/MyZubster-Ecosystem/myzubster/blob/main/docs/LIFE_DAO_GOVERNANCE.md" target="_blank" rel="noopener noreferrer">Governance policy →</a>
          </div>
        </section>

        <section style={cardStyle}>
          <h2>New MyZubster implementation tracks</h2>
          <p style={{ color: '#94a3b8', lineHeight: 1.6 }}>
            The current production codebase also includes LIFE 2027 preparation, Zorgax evidence automation specifications, public community activity, global-access work, entity/assistant workflows and pilot-oriented environmental data architecture. These tracks are published with explicit status boundaries so planned work is not represented as completed production functionality.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 14 }}>
            <a style={linkStyle} href="/life">LIFE portal →</a>
            <a style={linkStyle} href="/entities">Entities & assistants →</a>
            <a style={linkStyle} href="https://github.com/MyZubster-Ecosystem/myzubster/blob/main/docs/PUBLIC-COMMUNITY-ACTIVITY.md" target="_blank" rel="noopener noreferrer">Community evidence →</a>
          </div>
        </section>
      </div>
    </main>
  );
}
