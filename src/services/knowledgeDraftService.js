function clean(value, max) { return typeof value === 'string' ? value.trim().slice(0, max) : ''; }

function normalizeKnowledgeDraft(input) {
  const value = input && typeof input === 'object' ? input : {};
  const title = clean(value.title, 180);
  const domain = clean(value.domain, 120);
  const description = clean(value.description, 3000);
  if (!title || !domain || !description) throw new Error('Titolo, ambito e attività sono obbligatori');
  const refs = Array.isArray(value.evidence) ? value.evidence : [];
  if (refs.length > 12) throw new Error('Massimo 12 fonti per scheda');
  const evidence = refs.map(item => {
    const label = clean(item?.label, 160);
    const url = clean(item?.url, 1000);
    const note = clean(item?.note, 500);
    if (!label) throw new Error('Ogni fonte deve avere un nome');
    if (url) {
      let parsed;
      try { parsed = new URL(url); } catch (_) { throw new Error('URL fonte non valido'); }
      if (!['https:', 'http:'].includes(parsed.protocol)) throw new Error('URL fonte non valido');
    }
    return { label, url, note };
  });
  return { title, domain, description, evidence, verificationNote: clean(value.verificationNote, 1000) };
}

module.exports = { normalizeKnowledgeDraft };
