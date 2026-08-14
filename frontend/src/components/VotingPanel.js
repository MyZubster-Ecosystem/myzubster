import React, { useState, useEffect } from 'react';
import './VotingPanel.css';

const VotingPanel = ({ proposalId, userId }) => {
  const [proposal, setProposal] = useState(null);
  const [votes, setVotes] = useState([]);
  const [myVote, setMyVote] = useState(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchProposal(); }, [proposalId]);

  const fetchProposal = async () => {
    try {
      const res = await fetch('/api/dao/proposals/' + proposalId);
      const data = await res.json();
      if (data.success) {
        setProposal(data.data);
        setVotes(data.votes || []);
        setMyVote(data.votes?.find(v => v.voterId === userId) || null);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const castVote = async (choice) => {
    const method = myVote ? 'PUT' : 'POST';
    await fetch('/api/dao/vote', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proposalId, voterId: userId, choice, reason }),
    });
    fetchProposal();
  };

  if (loading) return <div className="vp-loading">Caricamento...</div>;
  if (!proposal) return <div className="vp-error">Proposta non trovata</div>;

  const total = proposal.votesFor + proposal.votesAgainst + proposal.votesAbstain;
  const pctFor = total > 0 ? (proposal.votesFor / total * 100).toFixed(1) : 0;
  const pctAgainst = total > 0 ? (proposal.votesAgainst / total * 100).toFixed(1) : 0;
  const isActive = proposal.status === 'active';
  const hasEnded = proposal.votingEndsAt && new Date() > new Date(proposal.votingEndsAt);

  return (
    <div className="voting-panel">
      <h3>🗳️ Votazione: {proposal.title}</h3>

      <div className="vp-bar">
        <div className="vp-bar-for" style={{ width: pctFor + '%' }}>{pctFor}%</div>
        <div className="vp-bar-against" style={{ width: pctAgainst + '%' }}>{pctAgainst}%</div>
      </div>
      <div className="vp-labels">
        <span>👍 {proposal.votesFor} ({pctFor}%)</span>
        <span>👎 {proposal.votesAgainst} ({pctAgainst}%)</span>
        <span>🤷 {proposal.votesAbstain}</span>
      </div>

      {isActive && !hasEnded && (
        <div className="vp-vote-actions">
          {myVote && <p className="vp-current">Hai votato: <strong>{myVote.choice}</strong></p>}
          <div className="vp-buttons">
            <button onClick={() => castVote('for')} className="vp-btn-for">👍 Vota a favore</button>
            <button onClick={() => castVote('against')} className="vp-btn-against">👎 Vota contro</button>
            <button onClick={() => castVote('abstain')} className="vp-btn-abstain">🤷 Astieniti</button>
          </div>
          <textarea
            className="vp-reason"
            placeholder="Motivazione (opzionale)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength="500"
            rows="2"
          />
        </div>
      )}

      {(hasEnded || !isActive) && (
        <div className="vp-result">
          {proposal.status === 'passed' ? '✅ Proposta approvata' : proposal.status === 'rejected' ? '❌ Proposta respinta' : 'Votazione chiusa'}
        </div>
      )}

      <h4>📋 Votanti ({votes.length})</h4>
      <div className="vp-voters">
        {votes.map(v => (
          <div key={v.id} className="vp-voter">
            <span>{v.choice === 'for' ? '👍' : v.choice === 'against' ? '👎' : '🤷'}</span>
            <span className="vp-voter-id">{v.voterId.substring(0, 8)}...</span>
            <span className="vp-weight">({v.weight} token)</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VotingPanel;
