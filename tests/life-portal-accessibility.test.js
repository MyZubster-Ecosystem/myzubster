const fs = require('fs');
const path = require('path');

const portalSource = fs.readFileSync(
  path.join(__dirname, '..', 'frontend', 'src', 'pages', 'LifePortalPage.js'),
  'utf8'
);

describe('Life portal accessibility contract', () => {
  test('exposes navigation and manages focus on view changes', () => {
    expect(portalSource).toContain('role="navigation" aria-label="Navigazione principale"');
    expect(portalSource).toContain('href="#main-content"');
    expect(portalSource).toContain('<main id="main-content" tabIndex={-1}');
    expect(portalSource).toContain('const isInitialRender = useRef(true);');
    expect(portalSource).toContain("document.getElementById('main-content')?.focus();");
    expect(portalSource).toContain('}, [view]);');
  });

  test.each([
    'Username',
    'Email account',
    'Password account',
    'Indirizzo pubblico Monero o XMR',
    'Nome Comune o Ente',
    'Provincia',
    'Regione',
    'Email referente',
    'Cerca repository',
  ])('provides the accessible input name %s', (label) => {
    expect(portalSource).toContain(`aria-label="${label}"`);
  });

  test('announces asynchronous form and repository status updates', () => {
    expect(portalSource.match(/role="status" aria-live="polite"/g)).toHaveLength(3);
    expect(portalSource).toContain("const [repoStatus, setRepoStatus] = useState('loading');");
    expect(portalSource).toContain("setRepoStatus('ready');");
    expect(portalSource).toContain("setRepoStatus('error');");
    expect(portalSource).toContain('Repository temporaneamente non disponibili.');
  });
});
