(() => {
  const section = document.createElement('section');
  section.className = 'card comic';
  section.innerHTML = `
    <p>AI COMIC RENDER / EXPLICIT ACTION</p>
    <h2>Render the storyboard as an AI comic</h2>
    <p>This step sends the sanitized character + storyboard to the configured image provider. No image request is made until you press the button.</p>
    <div class="consent"><input type="checkbox" id="likenessConsent"><label for="likenessConsent">I authorize the use of this character/likeness for this generated scene. If this character represents a real person, I have permission to use that likeness.</label></div>
    <div class="consent"><input type="checkbox" id="galleryConsent"><label for="galleryConsent">I explicitly allow this generated proposal scene to be published in the MyZubster Visual gallery if gallery publishing is enabled on the server.</label></div>
    <div class="actions">
      <button class="primary" id="aiGenerateBtn" type="button">Generate AI comic</button>
      <button class="secondary" id="downloadAiBtn" type="button" disabled>Download AI image</button>
      <button class="secondary" id="publishGalleryBtn" type="button" disabled>Publish approved scene</button>
      <a class="button secondary" href="/visual/gallery" target="_blank" rel="noreferrer">Open Visual gallery</a>
    </div>
    <p id="aiStatus" class="small">Provider is called only after explicit generation consent.</p>
    <div id="aiResult" class="hidden" style="margin-top:18px">
      <img id="aiComicImage" alt="Generated MyZubster Visual comic" style="display:block;max-width:100%;border-radius:16px;border:1px solid var(--line)" />
      <p class="small disclaimer">Generated creative proposal only. This image does not prove a partnership, endorsement, contract or commitment.</p>
    </div>`;

  const comicSection = document.getElementById('comicSection');
  comicSection.insertAdjacentElement('afterend', section);

  const byId = id => document.getElementById(id);
  let aiImage = null;

  function requireStory() {
    if (!lastProfile || !lastStory) {
      alert('Generate a character and storyboard first.');
      return false;
    }
    return true;
  }

  byId('aiGenerateBtn').addEventListener('click', async () => {
    if (!requireStory()) return;
    if (!byId('likenessConsent').checked) {
      alert('Explicit character/likeness authorization is required for AI generation.');
      return;
    }

    lastProfile.consent.authorized_likeness = true;
    lastProfile.consent.public_gallery = byId('galleryConsent').checked;
    const status = byId('aiStatus');
    status.textContent = 'Generating AI comic…';
    byId('aiGenerateBtn').disabled = true;

    try {
      const response = await fetch('/api/visual/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ character: lastProfile, story: lastStory })
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error || 'AI image generation failed');

      aiImage = payload.image;
      const src = aiImage.data_url || aiImage.url;
      if (!src) throw new Error('Provider returned no displayable image');

      byId('aiComicImage').src = src;
      byId('aiResult').classList.remove('hidden');
      byId('downloadAiBtn').disabled = false;
      byId('publishGalleryBtn').disabled = !byId('galleryConsent').checked;
      status.textContent = `Generated with ${aiImage.provider} / ${aiImage.model}.`;
    } catch (error) {
      status.textContent = `AI generation unavailable: ${error.message}`;
    } finally {
      byId('aiGenerateBtn').disabled = false;
    }
  });

  byId('downloadAiBtn').addEventListener('click', () => {
    if (!aiImage) return;
    const src = aiImage.data_url || aiImage.url;
    const a = document.createElement('a');
    a.href = src;
    a.download = `${lastStory.id}-ai.png`;
    a.target = '_blank';
    a.rel = 'noreferrer';
    a.click();
  });

  byId('galleryConsent').addEventListener('change', () => {
    if (lastProfile) lastProfile.consent.public_gallery = byId('galleryConsent').checked;
    byId('publishGalleryBtn').disabled = !(aiImage && byId('galleryConsent').checked);
  });

  byId('publishGalleryBtn').addEventListener('click', async () => {
    if (!requireStory() || !aiImage || !byId('galleryConsent').checked) return;
    lastProfile.consent.public_gallery = true;
    const status = byId('aiStatus');
    status.textContent = 'Publishing approved proposal scene…';

    try {
      const response = await fetch('/api/visual/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          character: lastProfile,
          story: lastStory,
          image_url: aiImage.url || null,
          image_data_url: aiImage.data_url || null
        })
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error || 'Gallery publishing failed');
      status.textContent = 'Approved proposal scene published to the Visual gallery.';
    } catch (error) {
      status.textContent = `Gallery publishing unavailable: ${error.message}`;
    }
  });
})();
