import React from 'react';

const links = [
  ['Instagram', 'https://www.instagram.com/daniel.nonso.9699?igsi=cG1lZzV5aDNxbmo0'],
  ['Facebook', 'https://www.facebook.com/share/19k8akLkgZ/'],
  ['TikTok', 'https://www.tiktok.com/@h4x0r_23'],
];

export default function CreatorSocialLinks() {
  return (
    <aside aria-label="Creator social profiles" style={{ position: 'fixed', right: 14, bottom: 14, zIndex: 50, display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: 'calc(100vw - 28px)' }}>
      {links.map(([label, href]) => (
        <a key={label} href={href} target="_blank" rel="noreferrer" style={{ padding: '9px 12px', borderRadius: 999, background: '#0f1b27', border: '1px solid #334155', color: '#f8fafc', textDecoration: 'none', fontWeight: 800, boxShadow: '0 6px 18px rgba(0,0,0,.28)' }}>
          {label}
        </a>
      ))}
    </aside>
  );
}
