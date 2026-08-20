import React, { useEffect, useMemo, useState } from 'react';
import {
  claimIdentityBounty,
  getIdentityBountyDefinition,
  getIdentityBountyStats,
  submitIdentityBounty,
  updateIdentityBounty
} from '../api/identityBounties';
import './IdentityBountyPage.css';

const DEFAULT_FORM = {
  displayName: '',
  requestedMyzId: '',
  characterName: '',
  archetype: 'explorer',
  bio: '',
  visualRef: '',
  confirmedOwnProfile: false,
  acceptedPublicProfileRules: false,
  acceptedNoSecrets: false,
  acceptedHumanReview: false
};

function getParticipantKey() {
  const storageKey = 'myz_identity_bounty_participant_key';
  const existing = window.localStorage.getItem(storageKey);
  if (existing) return existing;

  const randomPart = window.crypto?.randomUUID
    ? window.crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const created = `guest-${randomPart}`;
  window.localStorage.setItem(storageKey, created);
  return created;
}

function IdentityBountyPage() {
  const [definition, setDefinition] = useState(null);
  const [stats, setStats] = useState(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const participantKey = useMemo(() => getParticipantKey(), []);

  useEffect(() => {
    Promise.all([
      getIdentityBountyDefinition(),
      getIdentityBountyStats().catch(() => null)
    ])
      .then(([definitionResponse, statsResponse]) => {
        setDefinition(definitionResponse);
        if (statsResponse) setStats(statsResponse);
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  const setField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
  };

  const checklist = {
    confirmedOwnProfile: form.confirmedOwnProfile,
    acceptedPublicProfileRules: form.acceptedPublicProfileRules,
    acceptedNoSecrets: form.acceptedNoSecrets,
    acceptedHumanReview: form.acceptedHumanReview
  };

  const formPayload = {
    participantKey,
    displayName: form.displayName,
    requestedMyzId: form.requestedMyzId,
    characterName: form.characterName,
    archetype: form.archetype,
    bio: form.bio,
    visualRef: form.visualRef,
    checklist
  };

  const allAccepted = Object.values(checklist).every(Boolean);
  const canSubmit = form.displayName.trim().length >= 2
    && form.characterName.trim().length >= 2
    && allAccepted;

  const refreshStats = async () => {
    try {
      const response = await getIdentityBountyStats();
      setStats(response);
    } catch (_error) {
      // Stats are informational only; the participant workflow must keep working.
    }
  };

  const createAndSubmit = async () => {
    if (!canSubmit || sending) return;
    setSending(true);
    setError('');

    try {
      const claim = await claimIdentityBounty(formPayload);
      const submitted = await submitIdentityBounty(claim.submission.id, participantKey);
      setSubmission(submitted.submission);
      await refreshStats();
    } catch (requestError) {
      if (requestError.status === 409 && requestError.payload?.submission) {
        setSubmission(requestError.payload.submission);
        setError('Esiste già una candidatura per questo browser/account. Controlla lo stato qui sotto.');
      } else {
        setError(requestError.message);
      }
    } finally {
      setSending(false);
    }
  };

  const updateAndResubmit = async () => {
    if (!submission || !canSubmit || sending) return;
    setSending(true);
    setError('');

    try {
      const updated = await updateIdentityBounty(submission.id, formPayload);
      const submitted = await submitIdentityBounty(updated.submission.id, participantKey);
      setSubmission(submitted.submission);
      await refreshStats();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <main className="identity-bounty"><p>Caricamento Identity Bounty…</p></main>;
  }

  const bounty = definition?.bounty;

  return (
    <main className="identity-bounty">
      <section className="identity-bounty__hero">
        <span className="identity-bounty__eyebrow">MYZUBSTER IDENTITY GENESIS</span>
        <h2>Crea la tua identità digitale e il tuo personaggio</h2>
        <p>
          Completa il profilo pubblico, crea il personaggio che userai nel metaverso e invialo a revisione.
          Il bounty non richiede documenti civili e non verifica automaticamente la tua identità legale.
        </p>
        <div className="identity-bounty__reward">
          <strong>{bounty?.rewardAmount ?? 100} {bounty?.rewardAsset ?? 'MYZ'}</strong>
          <span>ricompensa interna registrata solo dopo approvazione umana</span>
        </div>
      </section>

      <section className="identity-bounty__grid">
        <div className="identity-bounty__panel">
          <h3>1. Identità pubblica</h3>

          <label>
            Nome pubblico / pseudonimo
            <input
              value={form.displayName}
              maxLength={40}
              onChange={(event) => setField('displayName', event.target.value)}
              placeholder="es. Nova Verde"
            />
          </label>

          <label>
            MYZ-ID desiderato (opzionale)
            <input
              value={form.requestedMyzId}
              maxLength={80}
              onChange={(event) => setField('requestedMyzId', event.target.value)}
              placeholder="es. MYZ-NOVA"
            />
            <small>È solo una richiesta: non diventa verificato automaticamente.</small>
          </label>

          <label>
            Bio pubblica
            <textarea
              value={form.bio}
              maxLength={500}
              rows={4}
              onChange={(event) => setField('bio', event.target.value)}
              placeholder="Cosa fai nell'universo MyZubster?"
            />
          </label>
        </div>

        <div className="identity-bounty__panel">
          <h3>2. Personaggio del metaverso</h3>

          <label>
            Nome del personaggio
            <input
              value={form.characterName}
              maxLength={40}
              onChange={(event) => setField('characterName', event.target.value)}
              placeholder="es. AERON-17"
            />
          </label>

          <label>
            Archetipо
            <select value={form.archetype} onChange={(event) => setField('archetype', event.target.value)}>
              {(definition?.archetypes || ['guardian', 'explorer', 'maker', 'chronicler', 'scientist']).map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>

          <label>
            Riferimento visuale pubblico (opzionale)
            <input
              value={form.visualRef}
              maxLength={500}
              onChange={(event) => setField('visualRef', event.target.value)}
              placeholder="https://... oppure ipfs://..."
            />
          </label>

          <div className="identity-bounty__identity-mode">
            <strong>Stato iniziale:</strong> account-unverified
            <span>La verifica crittografica MYZ-DCR arriverà in una fase successiva.</span>
          </div>
        </div>
      </section>

      <section className="identity-bounty__panel identity-bounty__checklist">
        <h3>3. Checklist obbligatoria</h3>

        <label className="identity-bounty__check">
          <input
            type="checkbox"
            checked={form.confirmedOwnProfile}
            onChange={(event) => setField('confirmedOwnProfile', event.target.checked)}
          />
          <span>Sto creando il mio profilo/persona e non sto impersonando un'altra persona.</span>
        </label>

        <label className="identity-bounty__check">
          <input
            type="checkbox"
            checked={form.acceptedPublicProfileRules}
            onChange={(event) => setField('acceptedPublicProfileRules', event.target.checked)}
          />
          <span>Accetto che nome pubblico, bio e personaggio possano diventare dati pubblici dell'ecosistema.</span>
        </label>

        <label className="identity-bounty__check">
          <input
            type="checkbox"
            checked={form.acceptedNoSecrets}
            onChange={(event) => setField('acceptedNoSecrets', event.target.checked)}
          />
          <span>Non inserirò password, seed, private key, token, documenti d'identità o altri segreti.</span>
        </label>

        <label className="identity-bounty__check">
          <input
            type="checkbox"
            checked={form.acceptedHumanReview}
            onChange={(event) => setField('acceptedHumanReview', event.target.checked)}
          />
          <span>Accetto una revisione umana prima della registrazione della ricompensa MYZ.</span>
        </label>

        {!submission && (
          <button className="identity-bounty__cta" disabled={!canSubmit || sending} onClick={createAndSubmit}>
            {sending ? 'Invio…' : 'Crea identità e invia al review'}
          </button>
        )}

        {submission?.status === 'changes_requested' && (
          <button className="identity-bounty__cta" disabled={!canSubmit || sending} onClick={updateAndResubmit}>
            {sending ? 'Reinvio…' : 'Salva modifiche e reinvia'}
          </button>
        )}

        {error && <p className="identity-bounty__error">{error}</p>}
      </section>

      {submission && (
        <section className="identity-bounty__panel identity-bounty__status">
          <h3>Stato candidatura</h3>
          <div><strong>ID:</strong> {submission.id}</div>
          <div><strong>Personaggio:</strong> {submission.character?.name}</div>
          <div><strong>Stato:</strong> {submission.status}</div>
          <div><strong>Reward:</strong> {submission.reward?.amount} {submission.reward?.asset} — {submission.reward?.status}</div>
          {submission.review?.notes && <div><strong>Note review:</strong> {submission.review.notes}</div>}
          {submission.reward?.ledgerReference && (
            <div><strong>MYZ reference:</strong> {submission.reward.ledgerReference}</div>
          )}
        </section>
      )}

      <section className="identity-bounty__footer">
        <div><strong>{stats?.total ?? '–'}</strong><span>candidature</span></div>
        <div><strong>{stats?.review ?? '–'}</strong><span>in review</span></div>
        <div><strong>{stats?.rewarded ?? '–'}</strong><span>reward registrati</span></div>
      </section>

      <p className="identity-bounty__boundary">
        MYZ è usato qui come unità interna di reward/accounting. Questo bounty non promette un pagamento XMR,
        token esterno o valore monetario. La creazione del profilo non costituisce verifica di identità civile.
      </p>
    </main>
  );
}

export default IdentityBountyPage;
