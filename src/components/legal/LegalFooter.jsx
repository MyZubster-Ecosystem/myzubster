import React from 'react';
import { Link } from 'react-router-dom';

const LegalFooter = () => {
  return (
    <footer className="legal-footer">
      <div className="legal-links">
        <Link to="/legal/terms">Termini di Servizio</Link>
        <Link to="/legal/privacy">Privacy Policy</Link>
        <Link to="/legal/cookies">Cookie Policy</Link>
        <Link to="/legal/refund">Rimborsi e Dispute</Link>
        <Link to="/legal/cla">Contributor License Agreement</Link>
        <Link to="/legal/dpa">Data Processing Agreement</Link>
        <Link to="/legal/gdpr">GDPR Compliance</Link>
        <Link to="/legal/ip">Intellectual Property</Link>
      </div>
      <div className="copyright">
        © {new Date().getFullYear()} MyZubster. Tutti i diritti riservati.
      </div>
    </footer>
  );
};

export default LegalFooter;
