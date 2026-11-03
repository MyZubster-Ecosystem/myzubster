import React, { useEffect, useState } from 'react';
import { getLanguage, LANGUAGE_NAMES, setLanguage } from '../i18n';
import { conversionContext, trackConversion } from '../analytics/conversionAnalytics';

const RETURN_TO_KEY='myzubster-login-return-to';

const COPY = {
  it: {
    title: 'Accedi a MyZubster',
    desc: 'Inserisci le credenziali del tuo account MyZubster.',
    email: 'Email',
    password: 'Password MyZubster',
    login: 'Accedi con email e password',
    loading: 'Accesso…',
    or: 'oppure',
    google: 'Continua con Google',
    github: 'Continua con GitHub',
    facebook: 'Continua con Facebook',
    initial: 'Accedi con email e password MyZubster.',
    required: 'Inserisci email e password.',
    working: 'Accesso MyZubster in corso…',
    success: '✓ Login effettuato. Continuo…',
    socialWorking: 'Verifica account social in corso…',
    socialSuccess: '✓ Login social verificato. Continuo…',
    socialError: 'Login social non riuscito.',
    privacy: "La password viene inviata solo all'endpoint di autenticazione MyZubster e non viene salvata nel browser.",
    back: '← Torna a MyZubster',
    passportTitle: 'Identità GitHub & Percorso Contributor Passport',
    passportBadge: 'PROPOSTO / IN SVILUPPO',
    passportDesc: "L'accesso con GitHub è attivo per verificare la tua identità di sviluppatore. Il Contributor Passport è un percorso opt-in per mostrare competenze verificate, repository, contributi approvati e annunci Seller Free, senza automatismi o pretese di governance on-chain non verificate.",
    githubAvailable: '✓ GitHub OAuth: Disponibile',
    googlePreserved: '✓ Google & Accesso Diretto: Preservati',
    passportRoadmap: '⏳ Contributor Passport: Percorso Opt-In Proposto'
  },
  en: {
    title: 'Sign in to MyZubster',
    desc: 'Enter your MyZubster account credentials.',
    email: 'Email',
    password: 'MyZubster password',
    login: 'Sign in with email and password',
    loading: 'Signing in…',
    or: 'or',
    google: 'Continue with Google',
    github: 'Continue with GitHub',
    facebook: 'Continue with Facebook',
    initial: 'Sign in with your MyZubster email and password.',
    required: 'Enter email and password.',
    working: 'Signing in to MyZubster…',
    success: '✓ Signed in. Continuing…',
    socialWorking: 'Verifying social account…',
    socialSuccess: '✓ Social login verified. Continuing…',
    socialError: 'Social login failed.',
    privacy: 'Your password is sent only to the MyZubster authentication endpoint and is not stored in the browser.',
    back: '← Back to MyZubster',
    passportTitle: 'GitHub Identity & Contributor Passport Path',
    passportBadge: 'PROPOSED / UNDER ROADMAP',
    passportDesc: 'GitHub login is live to verify your developer identity. Contributor Passport is an opt-in roadmap to showcase verified skills, repositories, accepted contributions, and Seller Free listings, without automated or unverified on-chain governance claims.',
    githubAvailable: '✓ GitHub OAuth: Available',
    googlePreserved: '✓ Google & Email Login: Preserved',
    passportRoadmap: '⏳ Contributor Passport: Proposed Opt-In Path'
  },
  es: {
    title: 'Accede a MyZubster',
    desc: 'Introduce las credenciales de tu cuenta MyZubster.',
    email: 'Email',
    password: 'Contraseña MyZubster',
    login: 'Acceder con email y contraseña',
    loading: 'Accediendo…',
    or: 'o',
    google: 'Continuar con Google',
    github: 'Continuar con GitHub',
    facebook: 'Continuar con Facebook',
    initial: 'Accede con tu email y contraseña de MyZubster.',
    required: 'Introduce email y contraseña.',
    working: 'Accediendo a MyZubster…',
    success: '✓ Acceso realizado. Continuando…',
    socialWorking: 'Verificando cuenta social…',
    socialSuccess: '✓ Acceso social verificado. Continuando…',
    socialError: 'El acceso social ha fallado.',
    privacy: 'Tu contraseña se envía solo al endpoint de autenticación de MyZubster y no se guarda en el navegador.',
    back: '← Volver a MyZubster',
    passportTitle: 'Identidad GitHub y Pasaporte Contribuidor',
    passportBadge: 'PROPUESTA / EN DESARROLLO',
    passportDesc: 'El inicio con GitHub está activo para verificar tu identidad de desarrollador. El Pasaporte Contribuidor es una ruta opt-in para mostrar habilidades, repositorios y ofertas Seller Free sin afirmaciones automáticas de gobernanza.',
    githubAvailable: '✓ GitHub OAuth: Disponible',
    googlePreserved: '✓ Google y Contraseña: Preservados',
    passportRoadmap: '⏳ Pasaporte Contribuidor: Ruta Propuesta'
  },
  fr: {
    title: 'Se connecter à MyZubster',
    desc: 'Saisissez les identifiants de votre compte MyZubster.',
    email: 'Email',
    password: 'Mot de passe MyZubster',
    login: 'Connexion par email et mot de passe',
    loading: 'Connexion…',
    or: 'ou',
    google: 'Continuer avec Google',
    github: 'Continuer avec GitHub',
    facebook: 'Continuer avec Facebook',
    initial: 'Connectez-vous avec votre email et mot de passe MyZubster.',
    required: 'Saisissez votre email et mot de passe.',
    working: 'Connexion à MyZubster…',
    success: '✓ Connecté. Continuons…',
    socialWorking: 'Vérification du compte social…',
    socialSuccess: '✓ Connexion sociale vérifiée. Continuons…',
    socialError: 'Échec de la connexion sociale.',
    privacy: "Votre mot de passe est envoyé uniquement au point d'authentification MyZubster et n'est pas stocké dans le navigateur.",
    back: '← Retour à MyZubster',
    passportTitle: 'Identité GitHub et Passeport Contributeur',
    passportBadge: 'PROPOSÉ / EN COURS',
    passportDesc: 'La connexion GitHub est active pour vérifier votre identité de développeur. Le Passeport Contributeur est un parcours volontaire pour valoriser compétences vérifiées, dépôts et offres Seller Free sans automatismes non vérifiés.',
    githubAvailable: '✓ GitHub OAuth : Disponible',
    googlePreserved: '✓ Google et Mot de passe : Préservés',
    passportRoadmap: '⏳ Passeport Contributeur : Parcours Proposé'
  },
  de: {
    title: 'Bei MyZubster anmelden',
    desc: 'Gib die Zugangsdaten deines MyZubster-Kontos ein.',
    email: 'E-Mail',
    password: 'MyZubster-Passwort',
    login: 'Mit E-Mail und Passwort anmelden',
    loading: 'Anmeldung…',
    or: 'oder',
    google: 'Mit Google fortfahren',
    github: 'Mit GitHub fortfahren',
    facebook: 'Mit Facebook fortfahren',
    initial: 'Melde dich mit MyZubster E-Mail und Passwort an.',
    required: 'E-Mail und Passwort eingeben.',
    working: 'Anmeldung bei MyZubster…',
    success: '✓ Angemeldet. Weiter…',
    socialWorking: 'Social-Konto wird geprüft…',
    socialSuccess: '✓ Social Login bestätigt. Weiter…',
    socialError: 'Social Login fehlgeschlagen.',
    privacy: 'Dein Passwort wird nur an den MyZubster-Authentifizierungsendpunkt gesendet und nicht im Browser gespeichert.',
    back: '← Zurück zu MyZubster',
    passportTitle: 'GitHub-Identität & Mitwirkenden-Pass',
    passportBadge: 'VORSCHLAG / IN ENTWICKLUNG',
    passportDesc: 'GitHub-Login ist aktiv, um deine Entwickler-Identität zu bestätigen. Der Mitwirkenden-Pass ist ein freiwilliger Weg zur Dokumentation von Fähigkeiten, Repositories und Seller-Free-Angeboten ohne ungeprüfte Governance-Ansprüche.',
    githubAvailable: '✓ GitHub OAuth: Verfügbar',
    googlePreserved: '✓ Google & Passwort: Beibehalten',
    passportRoadmap: '⏳ Mitwirkenden-Pass: Vorgeschlagener Pfad'
  }
};

function validReturnTo(v){return v&&v.startsWith('/')&&!v.startsWith('//')?v:''}
function safeReturnTo(){const q=validReturnTo(new URLSearchParams(window.location.search).get('returnTo'));if(q){sessionStorage.setItem(RETURN_TO_KEY,q);return q}return validReturnTo(sessionStorage.getItem(RETURN_TO_KEY))||'/zorgax'}
function finishReturnTo(){const d=safeReturnTo();sessionStorage.removeItem(RETURN_TO_KEY);return d}

function trackCompletedAuth(payload, provider) {
  trackConversion('authentication_completed', conversionContext({ provider }));
  const created = payload?.data?.isNewUser === true || payload?.data?.created === true || payload?.data?.userCreated === true;
  if (created) trackConversion('signup_completed', conversionContext({ provider }));
}

function SocialLoginPage() {
  const [lang, setLangState] = useState(getLanguage);
  const t = COPY[lang] || COPY.en;
  const [status, setStatus] = useState(t.initial);
  const [tone, setTone] = useState('#cbd5e1');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState({ google: false, github: false, facebook: false });

  const changeLang = e => {
    const l = setLanguage(e.target.value);
    setLangState(l);
    setStatus((COPY[l] || COPY.en).initial);
  };

  useEffect(() => {
    safeReturnTo();
    let cancelled = false;
    fetch('/api/auth/social/providers')
      .then(r => r.json())
      .then(d => {
        if (!cancelled && d.success && d.data?.providers) setProviders(d.data.providers);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const s = p.get('social_login');
    const ticket = p.get('social_login_ticket');
    const provider = p.get('provider');

    if (s === 'error') {
      setTone('#fca5a5');
      setStatus(p.get('social_login_message') || t.socialError);
      return;
    }
    if (s !== 'verified' || !ticket) return;

    let cancelled = false;
    let timer;
    setLoading(true);
    setStatus(t.socialWorking);

    (async () => {
      try {
        const r = await fetch('/api/auth/social/exchange-ticket', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticket })
        });
        const d = await r.json();
        if (!r.ok || !d.success || !d.data?.token) throw new Error(d.message || t.socialError);
        if (cancelled) return;
        localStorage.setItem('myzubster-token',d.data.token);
        localStorage.setItem('myzubster-identity-provider', d.data.provider || provider || 'social');
        if (d.data.characterId) localStorage.setItem('myzubster-metaverse-character-id', d.data.characterId);
        trackCompletedAuth(d, d.data.provider || provider || 'social');
        const destination = finishReturnTo();
        setTone('#86efac');
        setStatus(t.socialSuccess);
        timer = setTimeout(() => window.location.assign(destination), 500);
      } catch (e) {
        if (!cancelled) {
          setTone('#fca5a5');
          setStatus(e.message || t.socialError);
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [t]);

  async function handlePasswordLogin(e) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setTone('#fca5a5');
      setStatus(t.required);
      return;
    }
    setLoading(true);
    setStatus(t.working);
    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password })
      });
      const d = await r.json();
      if (!r.ok || !d.success || !d.data?.token) throw new Error(d.message || t.socialError);
      localStorage.setItem('myzubster-token', d.data.token);
      localStorage.setItem('myzubster-identity-provider', 'password');
      if (d.data.user) localStorage.setItem('myzubster-user', JSON.stringify(d.data.user));
      if (d.data.character?.characterId) localStorage.setItem('myzubster-metaverse-character-id', d.data.character.characterId);
      trackCompletedAuth(d, 'password');
      const destination = finishReturnTo();
      setTone('#86efac');
      setStatus(t.success);
      setPassword('');
      setTimeout(() => window.location.assign(destination), 500);
    } catch (e) {
      setTone('#fca5a5');
      setStatus(e.message || t.socialError);
    } finally {
      setLoading(false);
    }
  }

  const button = {
    display: 'block',
    width: '100%',
    textAlign: 'center',
    color: '#fff',
    background: '#17263b',
    border: '1px solid #34465f',
    borderRadius: 12,
    padding: '13px 16px',
    fontWeight: 800,
    textDecoration: 'none',
    boxSizing: 'border-box'
  };

  const input = {
    width: '100%',
    boxSizing: 'border-box',
    color: '#f8fafc',
    background: '#070b16',
    border: '1px solid #34465f',
    borderRadius: 12,
    padding: '13px 14px',
    fontSize: 15
  };

  const oauthHref = p => {
    safeReturnTo();
    return `/api/auth/social/${p}/start`;
  };

  return (
    <main style={{ minHeight: '100vh', background: '#070b16', color: '#f8fafc', display: 'grid', placeItems: 'center', padding: 20 }}>
      <section style={{ width: 'min(92vw, 540px)', background: '#0d1726', border: '1px solid #26364b', borderRadius: 20, padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ fontSize: 12, color: '#67e8f9', fontWeight: 900 }}>MYZUBSTER · ZORGAX IDENTITY</div>
          <select value={lang} onChange={changeLang} style={{ background: '#101a2d', color: '#fff', border: '1px solid #34465f', borderRadius: 6, padding: '2px 6px' }}>
            {Object.entries(LANGUAGE_NAMES).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        <h1 style={{ fontSize: 26, margin: '14px 0 6px' }}>{t.title}</h1>
        <p style={{ color: '#aebdca', margin: '0 0 16px', fontSize: 14 }}>{t.desc}</p>

        <form onSubmit={handlePasswordLogin} style={{ display: 'grid', gap: 10, margin: '18px 0' }}>
          <input style={input} type="email" placeholder={t.email} value={email} onChange={e => setEmail(e.target.value)} disabled={loading} />
          <input style={input} type="password" placeholder={t.password} value={password} onChange={e => setPassword(e.target.value)} disabled={loading} />
          <button disabled={loading} style={{ ...button, background: '#0284c7', border: 'none', cursor: 'pointer' }}>
            {loading ? t.loading : t.login}
          </button>
        </form>

        {(providers.google || providers.github || providers.facebook) && (
          <>
            <div style={{ textAlign: 'center', margin: '12px 0', color: '#64748b', fontSize: 13 }}>{t.or}</div>
            <div style={{ display: 'grid', gap: 10 }}>
              {providers.github && <a href={oauthHref('github')} style={{ ...button, background: '#24292f' }}>{t.github}</a>}
              {providers.google && <a href={oauthHref('google')} style={{ ...button, background: '#1e293b' }}>{t.google}</a>}
              {providers.facebook && <a href={oauthHref('facebook')} style={{ ...button, background: '#1877f2' }}>{t.facebook}</a>}
            </div>
          </>
        )}

        {/* Honest Contributor Passport & GitHub Identity Panel */}
        <div style={{ marginTop: 22, padding: 16, borderRadius: 14, border: '1px solid rgba(56, 189, 248, 0.25)', background: 'rgba(15, 23, 42, 0.6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 900, color: '#38bdf8', letterSpacing: '.06em' }}>
              {t.passportTitle}
            </span>
            <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 999, background: 'rgba(250, 204, 21, 0.12)', color: '#facc15', border: '1px solid rgba(250, 204, 21, 0.3)' }}>
              {t.passportBadge}
            </span>
          </div>
          <p style={{ margin: '0 0 10px', fontSize: 12.5, color: '#94a3b8', lineHeight: 1.5 }}>
            {t.passportDesc}
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 11.5 }}>
            <span style={{ color: '#86efac' }}>{t.githubAvailable}</span>
            <span style={{ color: '#cbd5e1' }}>{t.googlePreserved}</span>
            <span style={{ color: '#facc15' }}>{t.passportRoadmap}</span>
          </div>
        </div>

        <div style={{ padding: 12, marginTop: 14, borderRadius: 10, background: '#0a1220', color: tone, fontSize: 13 }}>
          {status}
        </div>
        <p style={{ fontSize: 12, color: '#7f91a6', margin: '14px 0 10px', lineHeight: 1.4 }}>{t.privacy}</p>
        <a href="/" style={{ color: '#67e8f9', textDecoration: 'none', fontSize: 14, fontWeight: 700 }}>{t.back}</a>
      </section>
    </main>
  );
}

export default SocialLoginPage;
