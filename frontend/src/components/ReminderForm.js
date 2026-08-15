import React, { useState } from 'react';
import './ReminderForm.css';

const TYPES = [
  { value: 'watering', label: '💧 Irrigazione' },
  { value: 'fertilizing', label: '🧪 Fertilizzazione' },
  { value: 'harvesting', label: '🌾 Raccolto' },
  { value: 'pruning', label: '✂️ Potatura' },
];
const FREQUENCIES = [
  { value: 'daily', label: 'Giornaliero' },
  { value: 'every_2_days', label: 'Ogni 2 giorni' },
  { value: 'every_3_days', label: 'Ogni 3 giorni' },
  { value: 'weekly', label: 'Settimanale' },
  { value: 'biweekly', label: 'Bisettimanale' },
  { value: 'monthly', label: 'Mensile' },
  { value: 'custom', label: 'Personalizzato' },
];
const CHANNELS = [
  { value: 'push', label: '🔔 Push' },
  { value: 'email', label: '📧 Email' },
  { value: 'telegram', label: '✈️ Telegram' },
];

const ReminderForm = ({ gardenId, ownerId, onCreated }) => {
  const [form, setForm] = useState({
    type: 'watering', frequency: 'weekly', customIntervalDays: '',
    channel: 'push', notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const body = {
        gardenId, ownerId,
        type: form.type,
        frequency: form.frequency,
        customIntervalDays: form.frequency === 'custom' ? parseInt(form.customIntervalDays) || 7 : undefined,
        channel: form.channel,
        notes: form.notes,
      };

      const res = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setForm({ type: 'watering', frequency: 'weekly', customIntervalDays: '', channel: 'push', notes: '' });
        onCreated?.();
      } else {
        setError(data.message || 'Errore creazione');
      }
    } catch (err) {
      setError('Errore di rete: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="reminder-form" onSubmit={handleSubmit}>
      <h3>📅 Nuovo Promemoria</h3>

      <div className="form-row">
        <label>Tipo</label>
        <select name="type" value={form.type} onChange={handleChange}>
          {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      <div className="form-row">
        <label>Frequenza</label>
        <select name="frequency" value={form.frequency} onChange={handleChange}>
          {FREQUENCIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
      </div>

      {form.frequency === 'custom' && (
        <div className="form-row">
          <label>Intervallo (giorni)</label>
          <input type="number" name="customIntervalDays" min="1" max="365"
            value={form.customIntervalDays} onChange={handleChange} placeholder="es. 5" />
        </div>
      )}

      <div className="form-row">
        <label>Canale notifica</label>
        <select name="channel" value={form.channel} onChange={handleChange}>
          {CHANNELS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      <div className="form-row">
        <label>Note</label>
        <textarea name="notes" value={form.notes} onChange={handleChange}
          placeholder="es. Usa fertilizzante organico..." rows="2" maxLength="500" />
      </div>

      {error && <div className="form-error">{error}</div>}

      <button type="submit" disabled={submitting} className="form-submit">
        {submitting ? 'Creazione...' : '✨ Crea Promemoria'}
      </button>
    </form>
  );
};

export default ReminderForm;
