import React, { useEffect, useMemo, useState } from 'react';
import { getDaoOverview, verifyDaoBallot, verifyDaoDelegation } from '../api/dao';
import { getDaoIdentity, randomNonce, signDaoPayload } from '../lib/daoIdentity';
import './DaoPage.css';

const STATE_LABELS = {
  OPEN: 'Voto aperto',
  SCHEDULED: 'Programmato',
  RATIFIED: 'Ratificata',
  REJECTED: 'Respinta',
  QUORUM_NOT_MET: 'Quorum non raggiunto'
};

const CHOICE_LABELS = {
  for: 'A favore',
  against: 'Contrario',
  abstain: 'Astenuto'
};

function short(value, size = 14) {
  if (!value) return '—';
  return value.length > size * 2 ? `${value.slice(0, size)}…${value.slice(-size)}` : value;
}

function formatDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC'
  }).format(new Date(value));
}

function downloadJson(filename, value) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function ChamberTally({ chamber, threshold }) {
  const quorumPercent = Math.min(100, Math.round((chamber.participation / Math.max(chamber.quorum, 1)) * 100));
  return (
    <article className="dao-chamber">
      <div className="dao-chamber-head">
        <strong>{chamber.label}</strong>
        <span>{chamber.participation}/{chamber.quorum} quorum</span>
      </div>
      <div className="dao-progress" aria-label={`${quorumPercent}% del quorum`}><i style={{ width: `${quorumPercent}%` }} /></div>
      <div className="dao-chamber-votes">
        <span><b>{chamber.for}</b> favorevoli</span>
        <span><b>{chamber.against}</b> contrari</span>
        <span><b>{chamber.abstain}</b> astenuti</span>
      </div>
      <small>{(chamber.approvalBps / 100).toFixed(0)}% approvazione · soglia {threshold / 100}%</small>
    </article>
  );
}

export default function DaoPage() {
  const [overview, setOverview] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [identity, setIdentity] = useState(null);
  const [identityBusy, setIdentityBusy] = useState(false);
  const [choice, setChoice] = useState('for');
  const [reason, setReason] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [delegateDid, setDelegateDid] = useState('');
  const [delegationReceipt, setDelegationReceipt] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getDaoOverview()
      .then((data) => {
        setOverview(data);
        const firstOpen = data.proposals.find((proposal) => proposal.state === 'OPEN');
        setSelectedId(firstOpen?.id || data.proposals[0]?.id || null);
      })
      .catch((requestError) => setError(requestError.message));
    getDaoIdentity().then(setIdentity).catch(() => {});
  }, []);

  const selected = useMemo(
    () => overview?.proposals.find((proposal) => proposal.id === selectedId) || null,
    [overview, selectedId]
  );

  async function ensureIdentity() {
    if (identity) return identity;
    setIdentityBusy(true);
    setError('');
    try {
      const created = await getDaoIdentity({ create: true });
      setIdentity(created);
      return created;
    } catch (identityError) {
      setError(identityError.message);
      return null;
    } finally {
      setIdentityBusy(false);
    }
  }

  async function signBallot() {
    if (!selected || selected.state !== 'OPEN') return;
    const currentIdentity = await ensureIdentity();
    if (!currentIdentity) return;
    setBusy(true);
    setError('');
    setReceipt(null);
    try {
      const payload = {
        schemaVersion: overview.schemaVersion,
        networkId: overview.network.id,
        proposalId: selected.id,
        proposalDigest: selected.digest,
        voterDid: currentIdentity.did,
        publicKeySpki: currentIdentity.publicKeySpki,
        choice,
        reason: reason.trim(),
        nonce: randomNonce(),
        issuedAt: new Date().toISOString()
      };
      const signature = await signDaoPayload(payload, currentIdentity);
      const data = await verifyDaoBallot({ payload, signature });
      setReceipt(data.receipt);
    } catch (voteError) {
      setError(voteError.message);
    } finally {
      setBusy(false);
    }
  }

  async function signDelegation(action = 'delegate') {
    const currentIdentity = await ensureIdentity();
    if (!currentIdentity) return;
    const delegate = delegateDid.trim();
    if (!delegate) {
      setError('Inserisci il DID Ed25519 della persona delegata.');
      return;
    }
    setBusy(true);
    setError('');
    setDelegationReceipt(null);
    try {
      const issuedAt = new Date();
      const expiresAt = new Date(issuedAt.getTime() + 30 * 24 * 3600000);
      const payload = {
        schemaVersion: overview.schemaVersion,
        networkId: overview.network.id,
        action,
        delegatorDid: currentIdentity.did,
        publicKeySpki: currentIdentity.publicKeySpki,
        delegateDid: delegate,
        scope: selected ? `proposal:${selected.id}` : 'all',
        nonce: randomNonce(),
        issuedAt: issuedAt.toISOString(),
        expiresAt: expiresAt.toISOString()
      };
      const signature = await signDaoPayload(payload, currentIdentity);
      const data = await verifyDaoDelegation({ payload, signature });
      setDelegationReceipt(data.receipt);
    } catch (delegationError) {
      setError(delegationError.message);
    } finally {
      setBusy(false);
    }
  }

  if (!overview) {
    return <main className="dao-shell dao-loading"><strong>Inizializzazione registro DAO…</strong>{error && <p>{error}</p>}</main>;
  }

  return (
    <div className="dao-shell">
      <header className="dao-topbar">
        <a className="dao-brand" href="/">🌍 MyZubster</a>
        <div><strong>DAO verificabile</strong><small>{overview.network.id}</small></div>
        <nav><a href="/entity-bounties">Bounty</a><a href="/entities">Entità</a><a href="/">Home</a></nav>
      </header>

      <main className="dao-main">
        <section className="dao-hero">
          <div>
            <span className="dao-eyebrow">GIT-NATIVE · ED25519 · HUMAN RATIFICATION</span>
            <h1>Decisioni pubbliche.<br />Firme verificabili.</h1>
            <p>Proposte versionate, voto a doppia camera, deleghe revocabili e timelock. Il ledger Git è la fonte canonica: il server verifica le firme, ma non può inventare un voto o trasferire fondi.</p>
          </div>
          <aside className="dao-trust-card">
            <span className="dao-mode">OFF-CHAIN / BOOTSTRAP</span>
            <strong>Nessuna esecuzione automatica</strong>
            <p>MYZ resta contabilità interna. Ogni risultato richiede una modifica revisionata e ratifica umana.</p>
            <small className={overview.summary.integrityValid ? 'dao-integrity dao-integrity--valid' : 'dao-integrity dao-integrity--invalid'}>{overview.summary.integrityValid ? '✓ Ledger integro' : '✕ Integrità ledger non valida'}</small>
            <a href={`${overview.network.canonicalRepository}/blob/main/${overview.network.ledgerPath}`} target="_blank" rel="noreferrer">Apri il ledger canonico ↗</a>
          </aside>
        </section>

        <section className="dao-metrics" aria-label="Stato DAO">
          <article><span>Proposte</span><strong>{overview.summary.proposalCount}</strong><small>{overview.summary.openProposalCount} aperte</small></article>
          <article><span>Camere</span><strong>{overview.summary.chamberCount}</strong><small>entrambe necessarie</small></article>
          <article><span>Membri ammessi</span><strong>{overview.summary.admittedMemberCount}</strong><small>registro in bootstrap</small></article>
          <article><span>Peso AI</span><strong>0</strong><small>Zorgax è consultivo</small></article>
        </section>

        {overview.summary.admittedMemberCount === 0 && (
          <section className="dao-bootstrap-notice">
            <strong>La DAO non può ancora ratificare decisioni.</strong>
            <span>Il motore è operativo, ma il registro non contiene membri umani ammessi. Le schede firmate ora sono verificabili come segnale osservatore e non contano nel quorum.</span>
          </section>
        )}

        {error && <div className="dao-error" role="alert">{error}</div>}

        <section className="dao-workspace">
          <aside className="dao-proposal-list">
            <div className="dao-section-title"><span>PROPOSTE</span><b>{overview.proposals.length}</b></div>
            {overview.proposals.map((proposal) => (
              <button
                type="button"
                key={proposal.id}
                className={proposal.id === selectedId ? 'dao-proposal-card dao-proposal-card--active' : 'dao-proposal-card'}
                onClick={() => { setSelectedId(proposal.id); setReceipt(null); setDelegationReceipt(null); }}
              >
                <span className={`dao-state dao-state--${proposal.state.toLowerCase()}`}>{STATE_LABELS[proposal.state] || proposal.state}</span>
                <strong>{proposal.id} · v{proposal.version}</strong>
                <h2>{proposal.title}</h2>
                <small>{formatDate(proposal.closesAt)} UTC</small>
              </button>
            ))}
          </aside>

          {selected && (
            <div className="dao-proposal-detail">
              <header className="dao-detail-head">
                <div>
                  <span className={`dao-state dao-state--${selected.state.toLowerCase()}`}>{STATE_LABELS[selected.state] || selected.state}</span>
                  <h2>{selected.title}</h2>
                  <p>{selected.description}</p>
                </div>
                <a className="dao-target-link" href={selected.target.url}>{selected.target.type}<strong>{selected.target.id}</strong></a>
              </header>

              <div className="dao-digest-row">
                <span>Digest proposta</span><code title={selected.digest}>{short(selected.digest, 20)}</code>
                <span>Finestra</span><b>{formatDate(selected.opensAt)} → {formatDate(selected.closesAt)}</b>
              </div>

              <div className="dao-chambers">
                {selected.tally.chambers.map((chamber) => <ChamberTally key={chamber.id} chamber={chamber} threshold={selected.approvalThresholdBps} />)}
              </div>

              <section className="dao-vote-box">
                <div className="dao-box-heading">
                  <div><span>SCHEDA CRITTOGRAFICA</span><h3>Firma la tua posizione</h3></div>
                  <small>Un voto per DID · Ed25519</small>
                </div>
                <div className="dao-choice-row" role="radiogroup" aria-label="Scelta di voto">
                  {Object.entries(CHOICE_LABELS).map(([value, label]) => (
                    <button type="button" role="radio" aria-checked={choice === value} className={choice === value ? `dao-choice dao-choice--${value} dao-choice--active` : `dao-choice dao-choice--${value}`} onClick={() => setChoice(value)} key={value}>{label}</button>
                  ))}
                </div>
                <textarea value={reason} onChange={(event) => setReason(event.target.value)} maxLength="500" rows="3" placeholder="Motivazione pubblica (opzionale, massimo 500 caratteri)" />
                <button className="dao-primary" type="button" onClick={signBallot} disabled={busy || selected.state !== 'OPEN'}>{busy ? 'Verifica firma…' : selected.state === 'OPEN' ? 'Firma e verifica scheda' : 'Voto non aperto'}</button>
              </section>

              {receipt && (
                <section className={receipt.counted ? 'dao-receipt dao-receipt--counted' : 'dao-receipt dao-receipt--observer'}>
                  <div><span>FIRMA VERIFICATA</span><strong>{receipt.counted ? 'Membro ammesso · scheda eleggibile' : 'Scheda osservatore · non entra nel quorum'}</strong></div>
                  <code>{short(receipt.receiptDigest, 22)}</code>
                  <div className="dao-receipt-actions">
                    <button type="button" onClick={() => downloadJson(`${selected.id}-${receipt.payload.voterDid.slice(-12)}.json`, receipt)}>Scarica ricevuta</button>
                    <a href={receipt.submissionUrl} target="_blank" rel="noreferrer">Proponi al ledger ↗</a>
                    {receipt.membershipRequestUrl && <a href={receipt.membershipRequestUrl} target="_blank" rel="noreferrer">Richiedi ammissione ↗</a>}
                  </div>
                </section>
              )}

              <section className="dao-delegation-box">
                <div className="dao-box-heading">
                  <div><span>DELEGA DIRETTA</span><h3>Delega per {selected.id}</h3></div>
                  <small>Durata 30 giorni · profondità massima 1</small>
                </div>
                <input value={delegateDid} onChange={(event) => setDelegateDid(event.target.value)} placeholder="did:myz:… del delegato" />
                <div className="dao-inline-actions">
                  <button type="button" onClick={() => signDelegation('delegate')} disabled={busy}>Firma delega</button>
                  <button type="button" onClick={() => signDelegation('revoke')} disabled={busy}>Firma revoca</button>
                </div>
                {delegationReceipt && (
                  <div className="dao-mini-receipt">
                    <span>Firma verificata · {delegationReceipt.eligibility}</span>
                    <button type="button" onClick={() => downloadJson(`delegation-${selected.id}.json`, delegationReceipt)}>Scarica</button>
                    <a href={delegationReceipt.submissionUrl} target="_blank" rel="noreferrer">Proponi al ledger ↗</a>
                  </div>
                )}
              </section>
            </div>
          )}

          <aside className="dao-identity-panel">
            <div className="dao-section-title"><span>IDENTITÀ</span><b>LOCALE</b></div>
            <div className="dao-key-visual"><i /><i /><i /><i /><i /></div>
            {identity ? (
              <>
                <span className="dao-key-status">CHIAVE ATTIVA</span>
                <code>{short(identity.did, 16)}</code>
                <small>Creata {formatDate(identity.createdAt)}</small>
                <p>La chiave privata non lascia IndexedDB. Solo chiave pubblica, payload e firma vengono inviati al verificatore.</p>
              </>
            ) : (
              <>
                <strong>Nessuna chiave locale</strong>
                <p>Genera una coppia Ed25519 nel browser. Non è un wallet e non custodisce fondi.</p>
                <button className="dao-primary" type="button" onClick={ensureIdentity} disabled={identityBusy}>{identityBusy ? 'Generazione…' : 'Crea identità DAO'}</button>
              </>
            )}
            <hr />
            <ul>
              <li><b>Server:</b> verifica soltanto</li>
              <li><b>Git:</b> conserva il ledger</li>
              <li><b>Umani:</b> ratificano</li>
              <li><b>AI:</b> consiglia, peso 0</li>
            </ul>
          </aside>
        </section>

        <section className="dao-flow">
          <div><span>01</span><strong>Proposta</strong><small>Contenuto versionato e digest immutabile</small></div>
          <b>→</b>
          <div><span>02</span><strong>Firma</strong><small>Scheda Ed25519 verificata pubblicamente</small></div>
          <b>→</b>
          <div><span>03</span><strong>Doppio quorum</strong><small>Comunità e steward approvano separatamente</small></div>
          <b>→</b>
          <div><span>04</span><strong>Timelock</strong><small>48 ore prima della modifica umana</small></div>
        </section>
      </main>
    </div>
  );
}
