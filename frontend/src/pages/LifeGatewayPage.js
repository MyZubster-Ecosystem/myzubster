import React from 'react';

const REPO = 'https://github.com/MyZubster-Ecosystem/myzubster';
const JOIN = `${REPO}/blob/main/JOIN.md`;
const POLICY = `${REPO}/blob/main/docs/LIFE_EXTERNAL_ECOSYSTEMS.md`;

const ecosystems = [
  {
    name: 'Vircadia World',
    kind: 'Open-source metaverse',
    status: 'experimental',
    description: 'Interoperability exploration for worlds and public integration boundaries.',
    upstream: 'https://github.com/vircadia/vircadia-world',
    evidence: 'https://github.com/vircadia/vircadia-world/pull/17',
    evidenceLabel: 'Upstream PR #17',
  },
  {
    name: 'Decentraland SDK',
    kind: 'Open-source toolchain',
    status: 'experimental',
    description: 'Technical exploration around ECS, scene state and reproducible interoperability.',
    upstream: 'https://github.com/decentraland/js-sdk-toolchain',
    evidence: 'https://github.com/decentraland/js-sdk-toolchain/pull/1556',
    evidenceLabel: 'Upstream PR #1556',
  },
  {
    name: 'Immersive Web / WebXR',
    kind: 'Open standard ecosystem',
    status: 'experimental',
    description: 'Browser XR interoperability and standards-based immersive experiences.',
    upstream: 'https://github.com/immersive-web/webxr-samples',
    evidence: 'https://github.com/DanielIoni-creator/webxr-samples/tree/feat/visibility-mask-change-sample',
    evidenceLabel: 'Contribution branch',
  },
  {
    name: 'Aruba',
    kind: 'Infrastructure provider',
    status: 'exploratory',
    description: 'Candidate infrastructure path for European hosting, cloud, DNS, storage and resilience.',
    upstream: 'https://www.aruba.it/',
    evidence: null,
    evidenceLabel: null,
  },
];

const roles = [
  ['Visitor', 'Explore public Life surfaces without receiving project privileges.'],
  ['Contributor', 'Propose code, content, translations, characters or observations through public workflows.'],
  ['Creator', 'Build compatible experiences after normal project review.'],
  ['Maintainer', 'Granted explicitly through MyZubster governance; never inherited from another ecosystem.'],
];

const card = { background: '#0f1b27', border: '1px solid #213547', borderRadius: 18, padding: 18 };
const link = { display: 'inline-block', padding: '10px 13px', borderRadius: 10, background: '#102b3b', border: '1px solid #2d5266', color: '#fff', textDecoration: 'none', fontWeight: 800 };

export default function LifeGatewayPage({ onHome }) {
  return (
    <div style={{ minHeight: '100vh', background: '#071018', color: '#f8fafc' }}>
      <header style={{ borderBottom: '1px solid #1f3342', background: '#09141e' }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <button onClick={onHome} style={{ border: 0, background: 'transparent', color: '#fff', fontWeight: 900, fontSize: 20, cursor: 'pointer' }}>🌍 MyZubster Life</button>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <a href={JOIN} target="_blank" rel="noreferrer" style={link}>Join</a>
            <a href={POLICY} target="_blank" rel="noreferrer" style={link}>Gateway policy</a>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1160, margin: '0 auto', padding: '42px 16px 64px' }}>
        <section>
          <div style={{ color: '#67e8f9', fontWeight: 900, letterSpacing: 1 }}>MYZUBSTER LIFE · EXTERNAL ECOSYSTEM GATEWAY</div>
          <h1 style={{ fontSize: 'clamp(38px,6vw,68px)', lineHeight: 1, margin: '12px 0 16px', maxWidth: 950 }}>Enter voluntarily. Keep your identity. Build across open ecosystems.</h1>
          <p style={{ maxWidth: 900, color: '#b6c5d1', fontSize: 18, lineHeight: 1.7 }}>
            Life provides a public entry path for people coming from independent open-source and technology ecosystems. External communities remain independent: no automatic membership, identity import, privileges, partnership or endorsement is inferred from a fork, issue, pull request or integration.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
            <a href={JOIN} target="_blank" rel="noreferrer" style={{ ...link, background: '#0ea5e9', borderColor: '#0ea5e9' }}>Enter as contributor</a>
            <a href={`${REPO}/issues`} target="_blank" rel="noreferrer" style={link}>Find a mission</a>
            <a href={`${REPO}/issues/617`} target="_blank" rel="noreferrer" style={link}>Create a character</a>
          </div>
        </section>

        <section style={{ marginTop: 34 }}>
          <h2>External ecosystem map</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: 12 }}>
            {ecosystems.map(item => (
              <article key={item.name} style={card}>
                <div style={{ color: '#67e8f9', fontSize: 12, fontWeight: 900, textTransform: 'uppercase' }}>{item.kind}</div>
                <h3 style={{ fontSize: 23, margin: '8px 0' }}>{item.name}</h3>
                <span style={{ display: 'inline-block', borderRadius: 999, padding: '5px 9px', background: '#162b38', color: '#bae6fd', fontSize: 12, fontWeight: 800 }}>{item.status}</span>
                <p style={{ color: '#a9bac7', lineHeight: 1.55 }}>{item.description}</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <a href={item.upstream} target="_blank" rel="noreferrer" style={link}>Official upstream</a>
                  {item.evidence && <a href={item.evidence} target="_blank" rel="noreferrer" style={link}>{item.evidenceLabel}</a>}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 34 }}>
          <h2>Life entry roles</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
            {roles.map(([name, description]) => <div key={name} style={card}><strong style={{ color: '#67e8f9', fontSize: 18 }}>{name}</strong><p style={{ color: '#a9bac7', lineHeight: 1.55 }}>{description}</p></div>)}
          </div>
        </section>

        <section style={{ ...card, marginTop: 34, borderColor: '#28566b' }}>
          <h2 style={{ marginTop: 0 }}>Trust & provenance boundary</h2>
          <p style={{ color: '#b6c5d1', lineHeight: 1.7 }}>
            GitHub usernames, avatars, wallets, metaverse identities, XR runtime identities and provider accounts are not automatically MyZubster identities. Linking must be voluntary. Assets remain reference-only unless licensing permits reuse, and integration records should preserve upstream repository/provider, version or commit, license, related issue/PR and validation status.
          </p>
          <p style={{ color: '#7f95a4', marginBottom: 0 }}>
            “Experimental” means technical work exists or is being explored. “Upstream validated” should only be used after relevant work is accepted upstream. “Partner” is reserved for explicit partnership evidence.
          </p>
        </section>
      </main>
    </div>
  );
}
