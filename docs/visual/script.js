(() => {
  const button = document.getElementById('toggleEvidence');
  const details = [...document.querySelectorAll('.evidence')];
  let visible = true;
  if (!button) return;
  const render = () => {
    button.textContent = `Evidence mode: ${visible ? 'ON' : 'OFF'}`;
    button.setAttribute('aria-pressed', String(visible));
    details.forEach((el) => {
      el.hidden = !visible;
      if (!visible) el.open = false;
    });
  };
  button.addEventListener('click', () => {
    visible = !visible;
    render();
  });
  render();
})();
