import React, { useState, useEffect } from 'react';

const CookieBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setShowBanner(false);
  };

  const declineCookies = () => {
    localStorage.setItem('cookie-consent', 'declined');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="cookie-banner">
      <div className="cookie-content">
        <p>
          Utilizziamo i cookie per migliorare la tua esperienza. Continuando a navigare,
          accetti il nostro utilizzo dei cookie.
          <button 
            className="cookie-details-btn" 
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? 'Nascondi dettagli' : 'Scopri di più'}
          </button>
        </p>
        {showDetails && (
          <div className="cookie-details">
            <p>Utilizziamo i seguenti cookie:</p>
            <ul>
              <li><strong>Tecnici:</strong> Necessari per il funzionamento del sito</li>
              <li><strong>Analitici:</strong> Per analizzare il traffico</li>
              <li><strong>Funzionali:</strong> Per ricordare le tue preferenze</li>
            </ul>
            <p>
              <a href="/legal/cookies" target="_blank">Leggi la Cookie Policy completa</a>
            </p>
          </div>
        )}
        <div className="cookie-actions">
          <button className="cookie-accept" onClick={acceptCookies}>Accetta tutti</button>
          <button className="cookie-decline" onClick={declineCookies}>Rifiuta</button>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;
