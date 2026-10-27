import React, { useEffect, useState } from 'react';
import MapPage from './pages/MapPage';
import GardensPage from './pages/GardensPage';
import ClowbotBountiesPage from './pages/ClowbotBountiesPage';
import MetaversePage from './pages/MetaversePage';
import MetaverseRoomPage from './pages/MetaverseRoomPage';
import MetaverseRoomCreatePage from './pages/MetaverseRoomCreatePage';
import MarketplacePage from './pages/MarketplacePage';
import MarketplaceOpsPage from './pages/MarketplaceOpsPage';
import SocialLoginPage from './pages/SocialLoginPage';
import ZorgaxLifePilotPage from './pages/ZorgaxLifePilotPage';
import AppsDownloadPage from './pages/AppsDownloadPage';
import KnowledgeGraphPage from './pages/KnowledgeGraphPage';
import ComicsPage from './pages/ComicsPage';
import RobotPublicWalletPanel from './components/RobotPublicWalletPanel';
import { conversionContext, trackConversion } from './analytics/conversionAnalytics';

const TABS = {
  WORLD: 'world',
  EXPLORE: 'explore',
  GARDENS: 'gardens',
  MISSIONS: 'missions',
  MARKETPLACE: 'marketplace',
  MARKETPLACE_OPS: 'marketplace-ops'
};

const LANGS = {
  it: {
    name: 'Italiano',
    searchServices: '🔍 Cerca servizi',
    offerService: '➕ Offri un servizio',
    metaverse: '🪐 Metaverso',
    profileOrLogin: '👤 Accedi / Profilo',
    backToHome: 'Torna alla Home',
    askZorgax: '👽 Chiedi a Zorgax',
    heroEyebrow: '🛒 MARKETPLACE DI SERVIZI E COMPETENZE',
    heroTitle: 'Trova o offri servizi e competenze nella tua comunità',
    heroDesc: 'Dalla riparazione all’assistenza tecnica, dall’artigianato locale ai servizi per la comunità. Contatto diretto tra persone, annunci dedicati e scambi peer-to-peer.',
    heroBadge: 'Piattaforma di mutuo aiuto open source · Registrazione gratuita · Assistente Zorgax integrato',
    sixAreasEyebrow: '6 PUNTI DI INGRESSO CHIAVE',
    sixAreasTitle: 'Esplora i percorsi principali di MyZubster',
    sixAreasSubtitle: 'Sei aree chiare con Marketplace e Zorgax in evidenza per orientamento, scambi e contributi.',
    sixAreas: [
      { key: 'marketplace', icon: '🛒', title: 'Marketplace', desc: 'Cerca servizi reali tra pari o pubblica gratuitamente la tua offerta con Seller Free.', badge: 'ATTIVO · LIVE', href: '/marketplace', cta: 'Cerca servizi →', secondaryHref: '/marketplace?action=new', secondaryCta: '➕ Offri un servizio' },
      { key: 'zorgax', icon: '👽', title: 'Zorgax Copilota', desc: 'Assistente per orientarsi nell’ecosistema, porre domande e trovare le sezioni giuste.', badge: 'ATTIVO · LIVE', isZorgax: true, href: '/zorgax', cta: 'Apri Zorgax →' },
      { key: 'metaverse', icon: '🪐', title: 'Metaverso · Neon Plaza', desc: 'Spazio virtuale 3D interattivo e Space Station accessibili direttamente dal browser.', badge: 'ATTIVO · LIVE', href: '/metaverse', cta: 'Entra nel Metaverso →' },
      { key: 'passport', icon: '🐙', title: 'GitHub & Contributor Passport', desc: 'Accedi con GitHub (Google preservato) e scopri il passaporto opt-in per competenze e offerte.', badge: 'LOGIN LIVE · PASSPORT PROPOSTO', badgeType: 'warning', href: '/social-login', cta: 'Accedi / Profilo →' },
      { key: 'knowledge', icon: '🧠', title: 'Knowledge & Conoscenze', desc: 'Grafo delle conoscenze aperte, evidenze territoriali e documentazione verificata.', badge: 'ATTIVO · LIVE', href: '/conoscenze', cta: 'Esplora il Grafo →' },
      { key: 'comics', icon: '📖', title: 'Fumetto & Narrazione', desc: 'Galleria visuale con le tavole di Daniel e Nicola, foto GitHub e provenienza trasparente.', badge: 'GALLERIA LIVE · TOKEN DISTINTI', href: '/fumetto', cta: 'Leggi il Fumetto →' }
    ],
    featuredEyebrow: 'CATEGORIE E SERVIZI NELLA COMMUNITY',
    featuredTitle: 'Competenze e scambi condivisi tra persone',
    viewAllMarket: 'Vedi tutti i servizi nel Marketplace →',
    categorySample: 'Categoria di esempio',
    exploreCategory: 'Esplora categoria →',
    free: 'Gratis',
    barter: 'Baratto',
    categories: [
      { icon: '🔧', title: 'Riparazioni & Assistenza Casa', desc: 'Piccoli interventi domestici, idraulica, infissi e manutenzione.', slug: 'services' },
      { icon: '💻', title: 'Informatica & Supporto Tecnico', desc: 'Configurazioni, assistenza PC, reti e strumenti digitali.', slug: 'development_services' },
      { icon: '🎨', title: 'Arte & Creazioni Artigianali', desc: 'Opere originali, artigianato indipendente, illustrazioni e grafica.', slug: 'art' },
      { icon: '🌿', title: 'Benessere & Cura Personale', desc: 'Pratiche di benessere, relax, cura della persona e movimento.', slug: 'wellness' },
      { icon: '🌾', title: 'Semi & Orti Comunitari', desc: 'Scambio di semi locali, piantine per orto e autoproduzione.', slug: 'seeds' },
      { icon: '🐾', title: 'Pet Care & Supporto Animali', desc: 'Passeggiate, assistenza temporanea e adozioni responsabili.', slug: 'pet_services' }
    ],
    footerTitle: '🌍 MYZUBSTER',
    footerDesc: 'Marketplace di servizi e competenze di mutuo aiuto open source. Contatto diretto e supporto peer-to-peer.',
    footerCommunity: 'Progetto open source della community',
    footerRights: '© 2026 MyZubster Ecosystem · Tutti i diritti riservati',
    footerSecurity: 'Privacy First · Decentralized & Local First · Scambi Peer-to-Peer',
    footerMarketplace: 'Marketplace',
    footerEcosystem: 'Ecosistema & Progetti',
    footerCode: 'Codice & Contributi',
    footerPublish: 'Pubblica un annuncio',
    footerSellerProfile: 'Profilo Seller',
    footerCopilot: 'Assistente Zorgax',
    footerMetaverse: 'Metaverso Neon Plaza',
    footerComics: 'Fumetto Community',
    footerKnowledge: 'Knowledge Graph',
    footerApps: 'Download App',
    footerAllProjects: 'Tutti i progetti (Ecosistema)',
    what: "COS'È MYZUBSTER?",
    headline: 'Un ecosistema open source dove persone, progetti e idee diventano collaborazione e valore.',
    intro: 'MyZubster riunisce un mondo digitale, missioni, progetti ambientali e un Marketplace.',
    minute: 'Capisci MyZubster in 1 minuto',
    exploreMarket: 'Esplora il Marketplace',
    join: 'Entra nella comunità',
    enter: 'Entra',
    explore: 'Esplora',
    ask: 'Chiedi a Zorgax',
    close: 'Chiudi Zorgax',
    copilot: 'ZORGAX · COPILOTA MYZUBSTER',
    want: '👽 Cosa vuoi fare?',
    you: 'Tu',
    thinking: 'Zorgax sta pensando…',
    send: 'Invia',
    placeholder: 'Es. Cerco un idraulico o voglio offrire un servizio',
    hello: 'Ciao! Sono Zorgax 👽. Dimmi cosa vuoi fare e ti accompagno nel punto giusto di MyZubster.',
    brain: 'In questo momento non riesco a collegarmi al cervello di Zorgax. Posso comunque accompagnarti nelle sezioni di MyZubster.'
  },
  en: {
    name: 'English',
    searchServices: '🔍 Search services',
    offerService: '➕ Offer a service',
    metaverse: '🪐 Metaverse',
    profileOrLogin: '👤 Sign in / Profile',
    backToHome: 'Back to Home',
    askZorgax: '👽 Ask Zorgax',
    heroEyebrow: '🛒 SERVICES & SKILLS MARKETPLACE',
    heroTitle: 'Find or offer services and skills in your community',
    heroDesc: 'From repairs to technical assistance, local crafts to community services. Direct person-to-person contact, dedicated listings, and peer-to-peer exchange.',
    heroBadge: 'Open-source mutual aid platform · Free registration · Integrated Zorgax assistant',
    sixAreasEyebrow: '6 KEY ENTRY POINTS',
    sixAreasTitle: 'Explore MyZubster’s Core Pathways',
    sixAreasSubtitle: 'Six distinct entry points with Marketplace and Zorgax prominent for orientation, exchange, and collaboration.',
    sixAreas: [
      { key: 'marketplace', icon: '🛒', title: 'Marketplace', desc: 'Search real community services or offer your skills freely through Seller Free.', badge: 'ACTIVE · LIVE', href: '/marketplace', cta: 'Search services →', secondaryHref: '/marketplace?action=new', secondaryCta: '➕ Offer a service' },
      { key: 'zorgax', icon: '👽', title: 'Zorgax Copilot', desc: 'Assistant for navigation, questions, and guidance across ecosystem pathways.', badge: 'ACTIVE · LIVE', isZorgax: true, href: '/zorgax', cta: 'Open Zorgax →' },
      { key: 'metaverse', icon: '🪐', title: 'Metaverse · Neon Plaza', desc: 'Interactive 3D virtual world and Space Station accessible in the browser without headset.', badge: 'ACTIVE · LIVE', href: '/metaverse', cta: 'Enter Metaverse →' },
      { key: 'passport', icon: '🐙', title: 'GitHub & Contributor Passport', desc: 'Sign in with GitHub (Google preserved) and explore the opt-in contributor passport path.', badge: 'LOGIN LIVE · PASSPORT PROPOSED', badgeType: 'warning', href: '/social-login', cta: 'Sign in / Profile →' },
      { key: 'knowledge', icon: '🧠', title: 'Knowledge & Conoscenze', desc: 'Public knowledge graph, verifiable evidence, and community-shared research.', badge: 'ACTIVE · LIVE', href: '/conoscenze', cta: 'Explore Graph →' },
      { key: 'comics', icon: '📖', title: 'Comics & Visual Story', desc: 'Visual narrative gallery with Daniel & Nicola artworks, GitHub photos, and clear provenance.', badge: 'GALLERY LIVE · TOKENS SEPARATE', href: '/fumetto', cta: 'Read the Comic →' }
    ],
    featuredEyebrow: 'FEATURED COMMUNITY CATEGORIES & SERVICES',
    featuredTitle: 'Skills and exchanges shared among community members',
    viewAllMarket: 'View all services in the Marketplace →',
    categorySample: 'Sample category',
    exploreCategory: 'Explore category →',
    free: 'Free',
    barter: 'Barter',
    categories: [
      { icon: '🔧', title: 'Home Repairs & Maintenance', desc: 'Household repairs, plumbing, fixtures and maintenance assistance.', slug: 'services' },
      { icon: '💻', title: 'IT & Technical Assistance', desc: 'Setup, PC repair, network troubleshooting and digital tools.', slug: 'development_services' },
      { icon: '🎨', title: 'Art & Independent Crafts', desc: 'Original artwork, handmade crafts, illustrations and graphics.', slug: 'art' },
      { icon: '🌿', title: 'Wellness & Personal Care', desc: 'Wellness practices, relaxation, personal care and activity.', slug: 'wellness' },
      { icon: '🌾', title: 'Seeds & Community Gardens', desc: 'Local seed exchange, vegetable garden starts and sustainable food.', slug: 'seeds' },
      { icon: '🐾', title: 'Pet Care & Animal Support', desc: 'Daily dog walking, temporary pet sitting and responsible adoptions.', slug: 'pet_services' }
    ],
    footerTitle: '🌍 MYZUBSTER',
    footerDesc: 'Open source mutual aid services and skills marketplace. Direct person-to-person contact and peer-to-peer support.',
    footerCommunity: 'Community open-source project',
    footerRights: '© 2026 MyZubster Ecosystem · All rights reserved',
    footerSecurity: 'Privacy First · Decentralized & Local First · Peer-to-Peer Exchange',
    footerMarketplace: 'Marketplace',
    footerEcosystem: 'Ecosystem & Projects',
    footerCode: 'Code & Contributions',
    footerPublish: 'Publish a listing',
    footerSellerProfile: 'Seller Profile',
    footerCopilot: 'Zorgax Assistant',
    footerMetaverse: 'Metaverse Neon Plaza',
    footerComics: 'Community Comics',
    footerKnowledge: 'Knowledge Graph',
    footerApps: 'Download Apps',
    footerAllProjects: 'All Projects (Ecosystem)',
    what: 'WHAT IS MYZUBSTER?',
    headline: 'An open-source ecosystem where people, projects and ideas become collaboration and value.',
    intro: 'MyZubster brings together a digital world, missions, environmental projects and a Marketplace.',
    minute: 'Understand MyZubster in 1 minute',
    exploreMarket: 'Explore the Marketplace',
    join: 'Join the community',
    enter: 'Enter',
    explore: 'Explore',
    ask: 'Ask Zorgax',
    close: 'Close Zorgax',
    copilot: 'ZORGAX · MYZUBSTER COPILOT',
    want: '👽 What do you want to do?',
    you: 'You',
    thinking: 'Zorgax is thinking…',
    send: 'Send',
    placeholder: 'E.g. I need a plumber or want to offer a service',
    hello: 'Hi! I’m Zorgax 👽. Tell me what you want to do and I’ll guide you to the right place in MyZubster.',
    brain: 'I cannot reach Zorgax’s brain right now. I can still guide you through MyZubster.'
  },
  es: {
    name: 'Español',
    searchServices: '🔍 Buscar servicios',
    offerService: '➕ Ofrecer un servicio',
    metaverse: '🪐 Metaverso',
    profileOrLogin: '👤 Iniciar sesión / Perfil',
    backToHome: 'Volver al Inicio',
    askZorgax: '👽 Pregunta a Zorgax',
    heroEyebrow: '🛒 MERCADO DE SERVICIOS Y COMPETENCIAS',
    heroTitle: 'Encuentra u ofrece servicios y habilidades en tu comunidad',
    heroDesc: 'De reparaciones a asistencia técnica, artesanía local y servicios comunitarios. Contacto directo entre personas, anuncios dedicados e intercambio peer-to-peer.',
    heroBadge: 'Plataforma de ayuda mutua de código abierto · Registro gratuito · Asistente Zorgax integrado',
    sixAreasEyebrow: '6 PUNTOS DE ENTRADA CLAVE',
    sixAreasTitle: 'Explora las vías principales de MyZubster',
    sixAreasSubtitle: 'Seis áreas claras con Marketplace y Zorgax destacados para orientación, trueques y colaboración.',
    sixAreas: [
      { key: 'marketplace', icon: '🛒', title: 'Marketplace', desc: 'Busca servicios comunitarios reales o publica tu oferta libremente con Seller Free.', badge: 'ACTIVO · LIVE', href: '/marketplace', cta: 'Buscar servicios →', secondaryHref: '/marketplace?action=new', secondaryCta: '➕ Ofrecer servicio' },
      { key: 'zorgax', icon: '👽', title: 'Copiloto Zorgax', desc: 'Asistente para orientarte en el ecosistema, resolver dudas y guiarte a cada sección.', badge: 'ACTIVO · LIVE', isZorgax: true, href: '/zorgax', cta: 'Abrir Zorgax →' },
      { key: 'metaverse', icon: '🪐', title: 'Metaverso · Neon Plaza', desc: 'Espacio virtual 3D interactivo y Space Station accesible desde el navegador.', badge: 'ACTIVO · LIVE', href: '/metaverse', cta: 'Entrar al Metaverso →' },
      { key: 'passport', icon: '🐙', title: 'GitHub y Pasaporte Contribuidor', desc: 'Inicia con GitHub (Google preservado) y conoce la ruta opt-in del pasaporte de habilidades.', badge: 'LOGIN LIVE · PASAPORTE PROPUESTO', badgeType: 'warning', href: '/social-login', cta: 'Acceder / Perfil →' },
      { key: 'knowledge', icon: '🧠', title: 'Conocimiento y Evidencias', desc: 'Grafo de conocimiento abierto, evidencias territoriales e investigación compartida.', badge: 'ACTIVO · LIVE', href: '/conoscenze', cta: 'Explorar Grafo →' },
      { key: 'comics', icon: '📖', title: 'Cómic y Narrativa Visual', desc: 'Galería narrativa con arte de Daniel y Nicola, fotos de GitHub y procedencia transparente.', badge: 'GALERÍA LIVE · TOKENS DISTINTOS', href: '/fumetto', cta: 'Leer el Cómic →' }
    ],
    featuredEyebrow: 'CATEGORÍAS Y SERVICIOS DESTACADOS',
    featuredTitle: 'Competencias e intercambios compartidos en la comunidad',
    viewAllMarket: 'Ver todos los servicios en el Marketplace →',
    categorySample: 'Categoría de ejemplo',
    exploreCategory: 'Explorar categoría →',
    free: 'Gratis',
    barter: 'Trueque',
    categories: [
      { icon: '🔧', title: 'Reparaciones y Mantenimiento del Hogar', desc: 'Pequeñas reparaciones, fontanería y mantenimiento doméstico.', slug: 'services' },
      { icon: '💻', title: 'Informática y Soporte Técnico', desc: 'Configuraciones, ayuda informática, redes y herramientas digitales.', slug: 'development_services' },
      { icon: '🎨', title: 'Arte y Creaciones Artesanales', desc: 'Obras originales, artesanía independiente, ilustración y diseño.', slug: 'art' },
      { icon: '🌿', title: 'Bienestar y Cuidado Personal', desc: 'Prácticas de relajación, cuidado personal y movimiento.', slug: 'wellness' },
      { icon: '🌾', title: 'Semillas y Huertos Comunitarios', desc: 'Intercambio de semillas locales, plantas para huertos y cultivo.', slug: 'seeds' },
      { icon: '🐾', title: 'Cuidado de Mascotas', desc: 'Paseos diarios, acogida temporal y adopción responsable.', slug: 'pet_services' }
    ],
    footerTitle: '🌍 MYZUBSTER',
    footerDesc: 'Mercado de servicios y habilidades de ayuda mutua de código abierto. Contacto directo y soporte peer-to-peer.',
    footerCommunity: 'Proyecto de código abierto de la comunidad',
    footerRights: '© 2026 MyZubster Ecosystem · Todos los derechos reservados',
    footerSecurity: 'Privacidad Primero · Descentralizado y Local · Intercambio Peer-to-Peer',
    footerMarketplace: 'Marketplace',
    footerEcosystem: 'Ecosistema y Proyectos',
    footerCode: 'Código y Contribuciones',
    footerPublish: 'Publicar un anuncio',
    footerSellerProfile: 'Perfil Seller',
    footerCopilot: 'Asistente Zorgax',
    footerMetaverse: 'Metaverso Neon Plaza',
    footerComics: 'Cómic Comunitario',
    footerKnowledge: 'Grafo de Conocimiento',
    footerApps: 'Descargar Apps',
    footerAllProjects: 'Todos los proyectos (Ecosistema)',
    what: '¿QUÉ ES MYZUBSTER?',
    headline: 'Un ecosistema de código abierto donde personas, proyectos e ideas se convierten en colaboración y valor.',
    intro: 'MyZubster reúne un mundo digital, misiones, proyectos ambientales y un Marketplace.',
    minute: 'Entiende MyZubster en 1 minuto',
    exploreMarket: 'Explora el Marketplace',
    join: 'Únete a la comunidad',
    enter: 'Entrar',
    explore: 'Explorar',
    ask: 'Pregunta a Zorgax',
    close: 'Cerrar Zorgax',
    copilot: 'ZORGAX · COPILOTO MYZUBSTER',
    want: '👽 ¿Qué quieres hacer?',
    you: 'Tú',
    thinking: 'Zorgax está pensando…',
    send: 'Enviar',
    placeholder: 'Ej. Busco fontanero o quiero ofrecer un servicio',
    hello: '¡Hola! Soy Zorgax 👽. Dime qué quieres hacer y te guiaré al lugar adecuado de MyZubster.',
    brain: 'Ahora mismo no puedo conectar con el cerebro de Zorgax. Aun así puedo guiarte por MyZubster.'
  },
  fr: {
    name: 'Français',
    searchServices: '🔍 Chercher des services',
    offerService: '➕ Proposer un service',
    metaverse: '🪐 Métavers',
    profileOrLogin: '👤 Connexion / Profil',
    backToHome: 'Retour à l’accueil',
    askZorgax: '👽 Demander à Zorgax',
    heroEyebrow: '🛒 MARCHÉ DE SERVICES ET COMPÉTENCES',
    heroTitle: 'Trouvez ou proposez des services et compétences dans votre communauté',
    heroDesc: 'Des réparations à l’assistance technique, de l’artisanat local aux services communautaires. Contact direct entre personnes, annonces dédiées et échanges de pair à pair.',
    heroBadge: 'Plateforme d’entraide open source · Inscription gratuite · Assistant Zorgax intégré',
    sixAreasEyebrow: '6 POINTS D’ENTRÉE CLÉS',
    sixAreasTitle: 'Découvrez les parcours principaux de MyZubster',
    sixAreasSubtitle: 'Six domaines distincts avec Marketplace et Zorgax mis en avant pour orientation et entraide.',
    sixAreas: [
      { key: 'marketplace', icon: '🛒', title: 'Marketplace', desc: 'Recherchez de vrais services d’entraide ou proposez vos compétences avec Seller Free.', badge: 'ACTIF · LIVE', href: '/marketplace', cta: 'Chercher services →', secondaryHref: '/marketplace?action=new', secondaryCta: '➕ Proposer service' },
      { key: 'zorgax', icon: '👽', title: 'Copilote Zorgax', desc: 'Assistant d’orientation pour naviguer, poser des questions et trouver chaque ressource.', badge: 'ACTIF · LIVE', isZorgax: true, href: '/zorgax', cta: 'Ouvrir Zorgax →' },
      { key: 'metaverse', icon: '🪐', title: 'Métavers · Neon Plaza', desc: 'Monde virtuel 3D interactif et Space Station accessible par navigateur sans casque.', badge: 'ACTIF · LIVE', href: '/metaverse', cta: 'Entrer dans le Métavers →' },
      { key: 'passport', icon: '🐙', title: 'GitHub & Passeport Contributeur', desc: 'Connexion GitHub (Google préservé) et découverte du passeport volontaire de compétences.', badge: 'LOGIN LIVE · PASSEPORT PROPOSÉ', badgeType: 'warning', href: '/social-login', cta: 'Connexion / Profil →' },
      { key: 'knowledge', icon: '🧠', title: 'Connaissances & Preuves', desc: 'Graphe de connaissances ouvertes, preuves territoriales et recherche partagée.', badge: 'ACTIF · LIVE', href: '/conoscenze', cta: 'Explorer le Graphe →' },
      { key: 'comics', icon: '📖', title: 'Bande Dessinée & Récit', desc: 'Galerie narrative avec les planches de Daniel et Nicola, photos GitHub et provenance claire.', badge: 'GALERIE LIVE · TOKENS DISTINCTS', href: '/fumetto', cta: 'Lire la BD →' }
    ],
    featuredEyebrow: 'CATÉGORIES ET SERVICES EN VEDETTE',
    featuredTitle: 'Compétences et échanges partagés au sein de la communauté',
    viewAllMarket: 'Voir tous les services du Marketplace →',
    categorySample: 'Catégorie d’exemple',
    exploreCategory: 'Explorer la catégorie →',
    free: 'Gratuit',
    barter: 'Troc',
    categories: [
      { icon: '🔧', title: 'Réparations & Entretien Maison', desc: 'Petits travaux, plomberie et maintenance du quotidien.', slug: 'services' },
      { icon: '💻', title: 'Informatique & Support Technique', desc: 'Dépannage PC, réseaux et outils numériques utiles.', slug: 'development_services' },
      { icon: '🎨', title: 'Art & Créations Artisanales', desc: 'Œuvres originales, artisanat indépendant et créations visuelles.', slug: 'art' },
      { icon: '🌿', title: 'Bien-être & Soin Personnel', desc: 'Pratiques de relaxation, mouvement et bien-être au quotidien.', slug: 'wellness' },
      { icon: '🌾', title: 'Graines & Potagers Partagés', desc: 'Échange de semences locales et plants pour potagers.', slug: 'seeds' },
      { icon: '🐾', title: 'Services pour Animaux', desc: 'Promenades quotidiennes, garde temporaire et adoptions responsables.', slug: 'pet_services' }
    ],
    footerTitle: '🌍 MYZUBSTER',
    footerDesc: 'Marché de services et compétences d’entraide open source. Contact direct et soutien de pair à pair.',
    footerCommunity: 'Projet open source communautaire',
    footerRights: '© 2026 MyZubster Ecosystem · Tous droits réservés',
    footerSecurity: 'Confidentialité avant tout · Décentralisé et local · Échanges de pair à pair',
    footerMarketplace: 'Marketplace',
    footerEcosystem: 'Écosystème & Projets',
    footerCode: 'Code & Contributions',
    footerPublish: 'Publier une annonce',
    footerSellerProfile: 'Profil Seller',
    footerCopilot: 'Assistant Zorgax',
    footerMetaverse: 'Métavers Neon Plaza',
    footerComics: 'Bande Dessinée',
    footerKnowledge: 'Graphe de Connaissances',
    footerApps: 'Télécharger les Apps',
    footerAllProjects: 'Tous les projets (Écosystème)',
    what: "QU'EST-CE QUE MYZUBSTER ?",
    headline: 'Un écosystème open source où personnes, projets et idées deviennent collaboration et valeur.',
    intro: 'MyZubster réunit un monde numérique, des missions, des projets environnementaux et un Marketplace.',
    minute: 'Comprendre MyZubster en 1 minute',
    exploreMarket: 'Explorer le Marketplace',
    join: 'Rejoindre la communauté',
    enter: 'Entrer',
    explore: 'Explorer',
    ask: 'Demander à Zorgax',
    close: 'Fermer Zorgax',
    copilot: 'ZORGAX · COPILOTE MYZUBSTER',
    want: '👽 Que voulez-vous faire ?',
    you: 'Vous',
    thinking: 'Zorgax réfléchit…',
    send: 'Envoyer',
    placeholder: 'Ex. Je cherche un plombier ou je veux proposer un service',
    hello: 'Bonjour ! Je suis Zorgax 👽. Dites-moi ce que vous voulez faire et je vous guiderai dans MyZubster.',
    brain: 'Je ne peux pas joindre le cerveau de Zorgax pour le moment. Je peux quand même vous guider dans MyZubster.'
  },
  de: {
    name: 'Deutsch',
    searchServices: '🔍 Dienstleistungen suchen',
    offerService: '➕ Dienstleistung anbieten',
    metaverse: '🪐 Metaversum',
    profileOrLogin: '👤 Anmelden / Profil',
    backToHome: 'Zurück zur Startseite',
    askZorgax: '👽 Zorgax fragen',
    heroEyebrow: '🛒 MARKTPLATZ FÜR DIENSTE & FÄHIGKEITEN',
    heroTitle: 'Finde oder biete Dienstleistungen und Fähigkeiten in deiner Community an',
    heroDesc: 'Von Reparaturen bis zu technischer Hilfe, lokalem Handwerk und Community-Diensten. Direkter persönlicher Kontakt, dedizierte Angebote und Peer-to-Peer-Austausch.',
    heroBadge: 'Open-Source-Plattform für gegenseitige Hilfe · Kostenlose Registrierung · Integrierter Zorgax-Assistent',
    sixAreasEyebrow: '6 WICHTIGSTE EINSTIEGSPUNKTE',
    sixAreasTitle: 'Erkunde die Kernbereiche von MyZubster',
    sixAreasSubtitle: 'Sechs klare Einstiegspunkte mit Marktplatz und Zorgax im Fokus für Orientierung und Austausch.',
    sixAreas: [
      { key: 'marketplace', icon: '🛒', title: 'Marktplatz', desc: 'Finde echte Hilfsdienste in der Community oder biete deine Hilfe mit Seller Free an.', badge: 'AKTIV · LIVE', href: '/marketplace', cta: 'Dienste suchen →', secondaryHref: '/marketplace?action=new', secondaryCta: '➕ Dienst anbieten' },
      { key: 'zorgax', icon: '👽', title: 'Zorgax Copilot', desc: 'Assistent für Orientierung, Fragen und Navigation durch das gesamte Ökosystem.', badge: 'AKTIV · LIVE', isZorgax: true, href: '/zorgax', cta: 'Zorgax öffnen →' },
      { key: 'metaverse', icon: '🪐', title: 'Metaversum · Neon Plaza', desc: 'Interaktive 3D-Welt und Space Station direkt im Browser ohne Headset erkunden.', badge: 'AKTIV · LIVE', href: '/metaverse', cta: 'Metaversum betreten →' },
      { key: 'passport', icon: '🐙', title: 'GitHub & Mitwirkenden-Pass', desc: 'Mit GitHub anmelden (Google beibehalten) und freiwilligen Fähigkeiten-Pass entdecken.', badge: 'LOGIN LIVE · PASS VORGESCHLAGEN', badgeType: 'warning', href: '/social-login', cta: 'Anmelden / Profil →' },
      { key: 'knowledge', icon: '🧠', title: 'Knowledge & Wissen', desc: 'Offener Wissensgraph, territoriale Nachweise und gemeinsame Forschung.', badge: 'AKTIV · LIVE', href: '/conoscenze', cta: 'Graph erkunden →' },
      { key: 'comics', icon: '📖', title: 'Comic & Bildgeschichte', desc: 'Visuelle Galerie mit Kunstwerken von Daniel und Nicola, GitHub-Fotos und klarer Herkunft.', badge: 'GALERIE LIVE · TOKEN GETRENNT', href: '/fumetto', cta: 'Comic lesen →' }
    ],
    featuredEyebrow: 'HERVORGEHOBENE KATEGORIEN & DIENSTE',
    featuredTitle: 'Fähigkeiten und Austauschmöglichkeiten in der Community',
    viewAllMarket: 'Alle Angebote im Marketplace ansehen →',
    categorySample: 'Beispiel-Kategorie',
    exploreCategory: 'Kategorie erkunden →',
    free: 'Kostenlos',
    barter: 'Tausch',
    categories: [
      { icon: '🔧', title: 'Reparaturen & Haushaltshilfe', desc: 'Kleinreparaturen, Sanitär und praktische Hilfe im Haushalt.', slug: 'services' },
      { icon: '💻', title: 'IT & Technische Unterstützung', desc: 'PC-Hilfe, Router-Setup, Netzwerke und digitale Werkzeuge.', slug: 'development_services' },
      { icon: '🎨', title: 'Kunst & Eigenes Handwerk', desc: 'Originale Werke, Kunsthandwerk, Illustration und Design.', slug: 'art' },
      { icon: '🌿', title: 'Wohlbefinden & Persönliche Pflege', desc: 'Entspannung, Bewegung und Achtsamkeit im Alltag.', slug: 'wellness' },
      { icon: '🌾', title: 'Saatgut & Gemeinschaftsgärten', desc: 'Lokaler Samentausch, Jungpflanzen und Anbauprojekte.', slug: 'seeds' },
      { icon: '🐾', title: 'Tierbetreuung & Hilfsdienste', desc: 'Gassigehen, vorübergehende Betreuung und verantwortungsvolle Vermittlung.', slug: 'pet_services' }
    ],
    footerTitle: '🌍 MYZUBSTER',
    footerDesc: 'Open-Source-Marktplatz für gegenseitige Hilfe und Fähigkeiten. Direkter Kontakt und Peer-to-Peer-Unterstützung.',
    footerCommunity: 'Open-Source-Community-Projekt',
    footerRights: '© 2026 MyZubster Ecosystem · Alle Rechte vorbehalten',
    footerSecurity: 'Datenschutz zuerst · Dezentral & Local First · Peer-to-Peer-Austausch',
    footerMarketplace: 'Marketplace',
    footerEcosystem: 'Ökosystem & Projekte',
    footerCode: 'Code & Mitwirken',
    footerPublish: 'Anzeige aufgeben',
    footerSellerProfile: 'Seller-Profil',
    footerCopilot: 'Zorgax-Assistent',
    footerMetaverse: 'Metaversum Neon Plaza',
    footerComics: 'Community-Comics',
    footerKnowledge: 'Knowledge Graph',
    footerApps: 'Apps herunterladen',
    footerAllProjects: 'Alle Projekte (Ökosystem)',
    what: 'WAS IST MYZUBSTER?',
    headline: 'Ein Open-Source-Ökosystem, in dem Menschen, Projekte und Ideen zu Zusammenarbeit und Wert werden.',
    intro: 'MyZubster verbindet eine digitale Welt, Missionen, Umweltprojekte und einen Marketplace.',
    minute: 'MyZubster in 1 Minute verstehen',
    exploreMarket: 'Marketplace erkunden',
    join: 'Community beitreten',
    enter: 'Eintreten',
    explore: 'Erkunden',
    ask: 'Zorgax fragen',
    close: 'Zorgax schließen',
    copilot: 'ZORGAX · MYZUBSTER COPILOT',
    want: '👽 Was möchtest du tun?',
    you: 'Du',
    thinking: 'Zorgax denkt nach…',
    send: 'Senden',
    placeholder: 'Z. B. Ich suche einen Handwerker oder möchte einen Dienst anbieten',
    hello: 'Hallo! Ich bin Zorgax 👽. Sag mir, was du tun möchtest, und ich führe dich zum richtigen Bereich in MyZubster.',
    brain: 'Ich kann Zorgax gerade nicht erreichen. Ich kann dich trotzdem durch MyZubster führen.'
  }
};

const detectLang = () => {
  const saved = localStorage.getItem('myzubster-language');
  if (saved && LANGS[saved]) return saved;
  const l = (navigator.language || 'en').slice(0, 2).toLowerCase();
  return LANGS[l] ? l : 'en';
};

const lifeActionsStyle = { display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '14px' };
const lifeLinkStyle = { display: 'inline-block', padding: '11px 15px', borderRadius: '10px', textDecoration: 'none', fontWeight: 900, color: 'inherit', border: '1px solid currentColor' };
const introStyle = { margin: '8px 20px 20px', padding: '26px', borderRadius: '20px', border: '1px solid rgba(168,85,247,.38)', background: 'linear-gradient(135deg,rgba(168,85,247,.15),rgba(59,130,246,.12))' };
const zorgaxButtonStyle = { position: 'fixed', right: 12, bottom: 'max(12px,env(safe-area-inset-bottom))', zIndex: 1000, border: '1px solid rgba(168,85,247,.55)', borderRadius: 999, padding: '10px 13px', fontWeight: 900, cursor: 'pointer', boxShadow: '0 8px 28px rgba(0,0,0,.25)', maxWidth: 'calc(100vw - 24px)', fontSize: 14 };
const zorgaxPanelStyle = { position: 'fixed', right: 18, bottom: 76, zIndex: 1000, width: 'min(390px,calc(100vw - 36px))', padding: 18, borderRadius: 18, border: '1px solid rgba(168,85,247,.55)', background: 'rgba(20,20,30,.97)', color: '#fff', boxShadow: '0 16px 45px rgba(0,0,0,.38)' };

function FirstVisitIntro({ t, onOpenZorgax }) {
  const track = (name, action) => trackConversion(name, conversionContext({ placement: 'home_hero', action }));
  return (
    <section style={{ ...introStyle, margin: '16px 20px 24px', padding: '32px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 13, fontWeight: 900, color: '#38bdf8', letterSpacing: '.08em', marginBottom: 6 }}>
        {t.heroEyebrow}
      </div>
      <h2 style={{ margin: '0 0 12px', fontSize: 'clamp(26px,4vw,38px)', lineHeight: 1.15, color: '#fff' }}>
        {t.heroTitle}
      </h2>
      <p style={{ maxWidth: 720, margin: '0 auto 20px', fontSize: 16, lineHeight: 1.55, color: '#cbd5e1' }}>
        {t.heroDesc}
      </p>
      <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 12 }}>
        <a href="/marketplace" onClick={() => track('marketplace_cta_clicked', 'search_services')} style={{ ...lifeLinkStyle, background: '#0284c7', color: '#fff', fontSize: 16, padding: '13px 22px', border: 'none' }}>
          {t.searchServices}
        </a>
        <a href="/marketplace?action=new" onClick={() => track('seller_cta_clicked', 'offer_service')} style={{ ...lifeLinkStyle, background: 'rgba(255,255,255,.08)', color: '#fff', fontSize: 16, padding: '13px 22px', border: '1px solid rgba(255,255,255,.25)' }}>
          {t.offerService}
        </a>
        <button
          type="button"
          onClick={() => {
            track('zorgax_cta_clicked', 'hero_ask');
            if (onOpenZorgax) onOpenZorgax();
            else window.location.href = '/zorgax';
          }}
          style={{ ...lifeLinkStyle, background: 'rgba(168,85,247,.22)', color: '#d8b4fe', fontSize: 16, padding: '13px 22px', border: '1px solid rgba(168,85,247,.5)', cursor: 'pointer' }}
        >
          {t.askZorgax || '👽 Chiedi a Zorgax'}
        </button>
        <a href="/metaverse" onClick={() => track('metaverse_cta_clicked', 'try_neon_plaza')} style={{ ...lifeLinkStyle, background: 'transparent', color: '#cbd5e1', fontSize: 16, padding: '13px 22px', border: '1px solid rgba(255,255,255,.15)' }}>
          {t.metaverse}
        </a>
      </div>
      <div style={{ marginTop: 16, fontSize: 13, color: '#94a3b8' }}>
        {t.heroBadge}
      </div>
    </section>
  );
}

function SixEntryPointsGrid({ t, onOpenZorgax }) {
  const track = (name, action) => trackConversion(name, conversionContext({ placement: 'home_six_entry_points', action }));
  const areas = t.sixAreas || [];

  return (
    <section style={{ margin: '0 20px 28px', padding: '24px', borderRadius: 20, border: '1px solid rgba(168,85,247,.25)', background: 'rgba(15,23,42,.75)' }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 900, color: '#c084fc', letterSpacing: '.08em', marginBottom: 4 }}>
          {t.sixAreasEyebrow || '6 PUNTI DI INGRESSO CHIAVE'}
        </div>
        <h3 style={{ margin: '0 0 6px', fontSize: 24, color: '#fff' }}>
          {t.sixAreasTitle || 'Esplora i percorsi principali di MyZubster'}
        </h3>
        <p style={{ margin: 0, fontSize: 14, color: '#94a3b8', maxWidth: 760 }}>
          {t.sixAreasSubtitle || 'Sei aree chiare con Marketplace e Zorgax in evidenza per orientamento, scambi e contributi.'}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16 }}>
        {areas.map((a, idx) => {
          const isWarning = a.badgeType === 'warning';
          const badgeBg = isWarning ? 'rgba(250,204,21,.14)' : 'rgba(56,189,248,.14)';
          const badgeColor = isWarning ? '#facc15' : '#38bdf8';
          const badgeBorder = isWarning ? '1px solid rgba(250,204,21,.35)' : '1px solid rgba(56,189,248,.35)';

          return (
            <div
              key={a.key || idx}
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: 18,
                borderRadius: 16,
                border: '1px solid rgba(255,255,255,.1)',
                background: 'rgba(255,255,255,.03)'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 32 }}>{a.icon}</span>
                  <span style={{ fontSize: 10.5, fontWeight: 900, padding: '3px 8px', borderRadius: 999, background: badgeBg, color: badgeColor, border: badgeBorder, letterSpacing: '.04em' }}>
                    {a.badge}
                  </span>
                </div>
                <strong style={{ fontSize: 17, color: '#fff', display: 'block', marginBottom: 6 }}>
                  {a.title}
                </strong>
                <p style={{ margin: 0, fontSize: 13.5, color: '#94a3b8', lineHeight: 1.45 }}>
                  {a.desc}
                </p>
              </div>

              <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,.08)', display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
                {a.isZorgax ? (
                  <button
                    type="button"
                    onClick={() => {
                      track('six_areas_clicked', 'zorgax');
                      if (onOpenZorgax) onOpenZorgax();
                      else window.location.href = a.href;
                    }}
                    style={{ background: 'rgba(168,85,247,.2)', color: '#d8b4fe', border: '1px solid rgba(168,85,247,.4)', borderRadius: 10, padding: '8px 14px', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}
                  >
                    {a.cta}
                  </button>
                ) : (
                  <a
                    href={a.href}
                    onClick={() => track('six_areas_clicked', a.key)}
                    style={{ background: a.key === 'marketplace' ? '#0284c7' : 'rgba(255,255,255,.08)', color: '#fff', border: a.key === 'marketplace' ? 'none' : '1px solid rgba(255,255,255,.2)', borderRadius: 10, padding: '8px 14px', fontSize: 13, fontWeight: 800, textDecoration: 'none' }}
                  >
                    {a.cta}
                  </a>
                )}
                {a.secondaryHref && (
                  <a
                    href={a.secondaryHref}
                    onClick={() => track('six_areas_clicked', `${a.key}_secondary`)}
                    style={{ color: '#38bdf8', fontSize: 12.5, fontWeight: 700, textDecoration: 'none' }}
                  >
                    {a.secondaryCta}
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function FeaturedServicesGrid({ t }) {
  const [realListings, setRealListings] = useState([]);

  useEffect(() => {
    let active = true;
    fetch('/api/listings?limit=6')
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (!active) return;
        if (data && Array.isArray(data.listings) && data.listings.length > 0) {
          setRealListings(data.listings.slice(0, 6));
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const hasReal = realListings.length > 0;
  const items = hasReal ? realListings : (t.categories || []);

  return (
    <section style={{ margin: '0 20px 28px', padding: '24px', borderRadius: 20, border: '1px solid rgba(56,189,248,.25)', background: 'rgba(15,23,42,.65)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 900, color: '#38bdf8', letterSpacing: '.08em', marginBottom: 4 }}>
            {t.featuredEyebrow}
          </div>
          <h3 style={{ margin: 0, fontSize: 24, color: '#fff' }}>
            {t.featuredTitle}
          </h3>
        </div>
        <a href="/marketplace" style={{ color: '#38bdf8', fontWeight: 800, textDecoration: 'none', fontSize: 14 }}>
          {t.viewAllMarket}
        </a>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 16 }}>
        {items.map((item, idx) => {
          if (hasReal) {
            const priceLabel = item.currency === 'FREE' ? (t.free || 'Free') : (item.currency === 'BARTER' ? (t.barter || 'Barter') : `${item.price || 0} ${item.currency || 'EUR'}`);
            return (
              <a
                key={item.id || item._id || idx}
                href={`/marketplace?category=${encodeURIComponent(item.category || '')}`}
                style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 18, borderRadius: 16, border: '1px solid rgba(255,255,255,.1)', background: 'rgba(255,255,255,.03)' }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 28 }}>📦</span>
                    <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 999, background: 'rgba(56,189,248,.12)', color: '#38bdf8', border: '1px solid rgba(56,189,248,.3)' }}>
                      {item.category || 'listing'}
                    </span>
                  </div>
                  <strong style={{ fontSize: 17, color: '#fff', display: 'block', marginBottom: 6 }}>
                    {item.title}
                  </strong>
                  <p style={{ margin: 0, fontSize: 14, color: '#94a3b8', lineHeight: 1.45 }}>
                    {item.description || ''}
                  </p>
                </div>
                <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,.08)', paddingTop: 12 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#34d399' }}>{priceLabel}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#38bdf8' }}>{t.exploreCategory}</span>
                </div>
              </a>
            );
          }

          return (
            <a
              key={item.slug || idx}
              href={`/marketplace?category=${encodeURIComponent(item.slug || '')}`}
              style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 18, borderRadius: 16, border: '1px solid rgba(255,255,255,.1)', background: 'rgba(255,255,255,.03)' }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 32 }}>{item.icon}</span>
                  <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 999, background: 'rgba(56,189,248,.12)', color: '#38bdf8', border: '1px solid rgba(56,189,248,.3)' }}>
                    {t.categorySample}
                  </span>
                </div>
                <strong style={{ fontSize: 17, color: '#fff', display: 'block', marginBottom: 6 }}>
                  {item.title}
                </strong>
                <p style={{ margin: 0, fontSize: 14, color: '#94a3b8', lineHeight: 1.45 }}>
                  {item.desc}
                </p>
              </div>
              <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,.08)', paddingTop: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#38bdf8' }}>{t.exploreCategory}</span>
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}

function DirectionIndex({ onChoose }) {
  const cards = [
    ['👽 Zorgax', 'Parla con il copilota e trova il percorso giusto.', 'zorgax', () => onChoose('zorgax')],
    ['🪐 Metaverso', 'Entra nella Neon Plaza e crea il tuo personaggio.', 'metaverse', () => onChoose('world')],
    ['🌍 Sito e progetti', 'Esplora orti, repository, fumetto e community.', 'site', () => onChoose('explore')],
    ['🌱 LIFE / Marketplace', 'Scopri pilot ambientali, attività e opportunità concrete.', 'life', () => onChoose('life')]
  ];
  return (
    <section style={{ margin: '20px 0', padding: '26px', borderRadius: '22px', border: '1px solid rgba(126,231,255,.35)', background: 'linear-gradient(135deg,rgba(15,35,55,.98),rgba(31,20,55,.96))', color: '#fff' }}>
      <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: '.08em', color: '#7ee7ff' }}>MYZUBSTER · SCEGLI IL TUO PERCORSO</div>
      <h2 style={{ margin: '8px 0' }}>Da dove vuoi iniziare?</h2>
      <p style={{ maxWidth: 760 }}>Puoi parlare con Zorgax, entrare nel Metaverso oppure esplorare il sito e i progetti. Scegli una direzione: non serve conoscere tutto in anticipo.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 12, marginTop: 18 }}>
        {cards.map(([title, text, key, action]) => (
          <button key={key} type="button" onClick={action} style={{ textAlign: 'left', padding: 18, borderRadius: 15, border: '1px solid rgba(255,255,255,.25)', background: 'rgba(255,255,255,.08)', color: '#fff', cursor: 'pointer' }}>
            <strong style={{ fontSize: 19 }}>{title}</strong>
            <span style={{ display: 'block', marginTop: 8, lineHeight: 1.45, opacity: .88 }}>{text}</span>
            <span style={{ display: 'block', marginTop: 12, fontWeight: 900, color: '#7ee7ff' }}>Apri →</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function EcosystemHub() {
  const cards = [
    { icon: '🪐', title: 'Metaverso · Neon Plaza', desc: 'Entra nello spazio digitale 3D con avatar, senza visore o installazione.', href: '/metaverse', badge: 'Mondo Virtuale' },
    { icon: '🌱', title: 'Progetti LIFE & Ambiente', desc: 'Dati e pilot evidence-first per acqua, terra e monitoraggio ambientale.', href: '/life-pilot', badge: 'Ambiente' },
    { icon: '📖', title: 'Fumetto & Narrazione', desc: 'La narrazione di Spiral Tribe, Hakim Bey, Space Station e nodi bot.', href: '/fumetto', badge: 'Story' },
    { icon: '🧠', title: 'Conoscenze & Open Source', desc: 'Repository GitHub, evidenze scientifiche e documentazione verificata.', href: '/conoscenze', badge: 'Open Science' }
  ];
  return (
    <section style={{ margin: '20px 0', padding: '24px', borderRadius: 20, border: '1px solid rgba(255,255,255,.1)', background: 'rgba(15,23,42,.4)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 900, color: '#a855f7', letterSpacing: '.08em', marginBottom: 4 }}>ECOSISTEMA MYZUBSTER</div>
          <h3 style={{ margin: 0, fontSize: 22, color: '#fff' }}>Spazi correlati e progetti della comunità</h3>
        </div>
        <a href="/zorgax-profile-onboarding#knowledgeOnboardingCard" style={{ fontWeight: 900, background: 'rgba(34,211,238,.15)', border: '1px solid rgba(34,211,238,.5)', borderRadius: 10, padding: '8px 12px', color: '#38bdf8', textDecoration: 'none', fontSize: 13 }}>🧠 Aggiungi le tue conoscenze</a>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 14 }}>
        {cards.map((c, i) => (
          <a key={i} href={c.href} style={{ textDecoration: 'none', color: 'inherit', padding: 16, borderRadius: 14, border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 26 }}>{c.icon}</span>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'rgba(168,85,247,.12)', color: '#c084fc' }}>{c.badge}</span>
            </div>
            <strong style={{ fontSize: 16, color: '#fff', display: 'block', marginBottom: 4 }}>{c.title}</strong>
            <p style={{ margin: 0, fontSize: 13, color: '#94a3b8', lineHeight: 1.4 }}>{c.desc}</p>
          </a>
        ))}
      </div>
    </section>
  );
}

function MyzUtilitySpotlight() {
  const track = (name, action) => trackConversion(name, conversionContext({ placement: 'home_myz_utility', action }));
  return (
    <section style={{ margin: '20px 0', padding: '22px', borderRadius: '18px', border: '1px solid rgba(250,204,21,.4)', background: 'linear-gradient(135deg,rgba(250,204,21,.12),rgba(34,197,94,.1))' }}>
      <div style={{ fontSize: 13, fontWeight: 900 }}>MYZ · CREDITI DI UTILITÀ</div>
      <h2 style={{ margin: '6px 0 8px' }}>Inizia con un piccolo contributo, prova un’utilità concreta</h2>
      <p>MYZ è l’unità interna di ricompensa e partecipazione dell’ecosistema. Non è presentato come investimento, né come promessa di rendimento: il suo valore qui è legato alle attività verificabili che puoi svolgere.</p>
      <ul style={{ margin: '10px 0', paddingLeft: 22 }}>
        <li>Ottieni crediti per contributi approvati e verificabili.</li>
        <li>Usali per accedere a esperienze, missioni e iniziative della community.</li>
        <li>Consulta sempre regole, limiti e stato nel registro pubblico.</li>
      </ul>
      <div style={lifeActionsStyle}>
        <a href="/social-login?returnTo=%2Fmarketplace" onClick={() => track('myz_cta_clicked', 'create_profile')} style={{ ...lifeLinkStyle, background: '#ca8a04', color: '#111' }}>Crea il profilo</a>
        <a href="/marketplace" onClick={() => track('myz_cta_clicked', 'view_marketplace')} style={lifeLinkStyle}>Vedi le attività</a>
        <a href="/life-pilot" onClick={() => track('myz_cta_clicked', 'propose_pilot')} style={lifeLinkStyle}>Proponi un pilot</a>
      </div>
      <small style={{ display: 'block', marginTop: 12 }}>Prima di partecipare, verifica sempre termini, disponibilità e requisiti applicabili.</small>
    </section>
  );
}

function StoryVisuals() {
  const cards = [
    ['Spiral Tribe ↔ Hakim Bey · Noel', 'https://raw.githubusercontent.com/MyZubster-Ecosystem/myzubster/main/public/comics/community/MyZubster-Telegram-Bots-Hakim-Bey-Noel-Facebook.png', '/fumetto'],
    ['Yassen', 'https://raw.githubusercontent.com/MyZubster-Ecosystem/myzubster/main/public/comics/community/Yassen-Mainardi-MyZubster-Profile.png', '/fumetto'],
    ['Space Station · Bot network', 'https://raw.githubusercontent.com/MyZubster-Ecosystem/myzubster/main/public/comics/community/MyZubster-Space-Station-Comic-Updated.png', '/fumetto']
  ];
  return (
    <section style={{ margin: '20px 0', padding: '24px', borderRadius: 20, border: '1px solid rgba(255,255,255,.1)', background: 'rgba(15,23,42,.4)' }}>
      <div style={{ fontSize: 12, fontWeight: 900, color: '#7ee7ff', letterSpacing: '.08em', marginBottom: 4 }}>STORIA & PROVENIENZA</div>
      <h3 style={{ margin: '0 0 14px', fontSize: 22, color: '#fff' }}>Narrazione e radici della community</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 14 }}>
        {cards.map(([title, img, href]) => (
          <a key={title} href={href} style={{ textDecoration: 'none', color: 'inherit', padding: 14, borderRadius: 14, border: '1px solid rgba(255,255,255,.08)', background: 'rgba(255,255,255,.02)', display: 'block' }}>
            <img src={img} alt={title} style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', borderRadius: 10, marginBottom: 10, background: '#02040a' }} />
            <strong style={{ color: '#fff', fontSize: 14, display: 'block' }}>{title}</strong>
          </a>
        ))}
      </div>
      <p style={{ marginTop: 14, marginBottom: 0 }}><a href="/fumetto" style={{ color: '#7ee7ff', fontWeight: 900, textDecoration: 'none' }}>Leggi il fumetto completo →</a></p>
    </section>
  );
}

function EcosystemPage({ t, onChooseTab }) {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 20px 60px', color: '#fff' }}>
      <header style={{ marginBottom: 24 }}>
        <a href="/" style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: 800, fontSize: 14, display: 'inline-block', marginBottom: 12 }}>
          {t.backToHome || '← Torna alla Home'}
        </a>
        <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', margin: '0 0 10px', color: '#fff' }}>
          {t.footerEcosystem || 'Ecosistema & Progetti MyZubster'}
        </h1>
        <p style={{ fontSize: 16, color: '#94a3b8', lineHeight: 1.5, margin: 0, maxWidth: 800 }}>
          {t.intro || 'Spazi correlati, percorsi di community, progetti ambientali, ricerca e iniziative aperte.'}
        </p>
      </header>

      <DirectionIndex onChoose={(choice) => {
        if (choice === 'zorgax') { window.location.href = '/zorgax'; return; }
        if (choice === 'life') { window.location.href = '/life-pilot'; return; }
        if (choice === 'world') { window.location.assign('/metaverse'); return; }
        if (onChooseTab) onChooseTab(TABS.EXPLORE);
      }} />

      <EcosystemHub />
      <MyzUtilitySpotlight />
      <StoryVisuals />
      <RobotPublicWalletPanel />
    </div>
  );
}

function MarketplaceFooter({ t }) {
  return (
    <footer style={{ marginTop: 48, borderTop: '1px solid rgba(255,255,255,.1)', background: 'rgba(10,15,30,.95)', padding: '36px 20px 24px', color: '#94a3b8', fontSize: 13 }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 24, marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', marginBottom: 8 }}>{t.footerTitle || '🌍 MYZUBSTER'}</div>
          <p style={{ lineHeight: 1.5, margin: '0 0 12px' }}>
            {t.footerDesc}
          </p>
          <div style={{ color: '#64748b' }}>{t.footerCommunity}</div>
        </div>
        <div>
          <strong style={{ color: '#fff', display: 'block', marginBottom: 10, fontSize: 14 }}>{t.footerMarketplace}</strong>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 6 }}>
            <li><a href="/marketplace" style={{ color: '#cbd5e1', textDecoration: 'none' }}>{t.searchServices}</a></li>
            <li><a href="/marketplace?action=new" style={{ color: '#cbd5e1', textDecoration: 'none' }}>{t.footerPublish}</a></li>
            <li><a href="/social-login" style={{ color: '#cbd5e1', textDecoration: 'none' }}>{t.footerSellerProfile}</a></li>
            <li><a href="/zorgax" style={{ color: '#cbd5e1', textDecoration: 'none' }}>{t.footerCopilot}</a></li>
          </ul>
        </div>
        <div>
          <strong style={{ color: '#fff', display: 'block', marginBottom: 10, fontSize: 14 }}>{t.footerEcosystem}</strong>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 6 }}>
            <li><a href="/ecosystem" style={{ color: '#cbd5e1', textDecoration: 'none' }}>{t.footerAllProjects}</a></li>
            <li><a href="/metaverse" style={{ color: '#cbd5e1', textDecoration: 'none' }}>{t.footerMetaverse}</a></li>
            <li><a href="/fumetto" style={{ color: '#cbd5e1', textDecoration: 'none' }}>{t.footerComics}</a></li>
            <li><a href="/conoscenze" style={{ color: '#cbd5e1', textDecoration: 'none' }}>{t.footerKnowledge}</a></li>
            <li><a href="/apps" style={{ color: '#cbd5e1', textDecoration: 'none' }}>{t.footerApps}</a></li>
          </ul>
        </div>
        <div>
          <strong style={{ color: '#fff', display: 'block', marginBottom: 10, fontSize: 14 }}>{t.footerCode}</strong>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 6 }}>
            <li><a href="https://github.com/MyZubster-Ecosystem/myzubster" target="_blank" rel="noreferrer" style={{ color: '#cbd5e1', textDecoration: 'none' }}>GitHub Repository</a></li>
            <li><a href="https://github.com/MyZubster-Ecosystem/myzubster/issues" target="_blank" rel="noreferrer" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Issue & Roadmap</a></li>
            <li><a href="/darkode" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Darkode Storia</a></li>
          </ul>
        </div>
      </div>
      <div style={{ maxWidth: 1200, margin: '0 auto', borderTop: '1px solid rgba(255,255,255,.06)', paddingTop: 16, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, color: '#64748b', fontSize: 12 }}>
        <div>{t.footerRights}</div>
        <div>{t.footerSecurity}</div>
      </div>
    </footer>
  );
}

const COPILOT_ACTIONS = [
  { test: /seller|vend|sell|vender|vendre|verkauf/i, label: '💼 Seller · Marketplace', href: '/marketplace', action: 'seller' },
  { test: /market|prodot|product|serviz|compr|buy|acheter|kauf/i, label: '🛒 Marketplace', href: '/marketplace', action: 'marketplace' },
  { test: /metavers|avatar|space/i, label: '🪐 Metaverse', href: '/metaverse', action: 'metaverse' },
  { test: /fumett|comic|storia|disegn/i, label: '📖 Fumetto Universe', href: '/fumetto', action: 'comics' },
  { test: /conoscenz|knowledge|grafo|paper/i, label: '🧠 Knowledge Graph', href: '/conoscenze', action: 'knowledge' },
  { test: /life|ambiente|environment|environnement|umwelt|acqua|water|agua|eau|mrv|pilot/i, label: '🌱 LIFE Pilot', href: '/life-pilot', action: 'life' },
  { test: /registr|login|account|comunit|community|communaut|gemeinschaft|unirse|join|rejoindre/i, label: '🔐 Community', href: '/social-login', action: 'join' }
];

function ZorgaxAssistant({ t }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState([{ role: 'assistant', content: t.hello }]);
  const [suggestion, setSuggestion] = useState(null);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('myzubster:open-zorgax', handler);
    return () => window.removeEventListener('myzubster:open-zorgax', handler);
  }, []);

  const send = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    const userMessage = { role: 'user', content: text };
    const next = [...messages, userMessage];
    setMessages(next);
    setInput('');
    setSuggestion(COPILOT_ACTIONS.find(a => a.test.test(text)) || null);
    setBusy(true);
    try {
      const history = messages.slice(-8).map(m => ({ role: m.role, content: m.content }));
      const response = await fetch('/api/zorgax/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history, useWeb: false })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unavailable');
      setMessages([...next, { role: 'assistant', content: String(data.answer || data.response || data.message) }]);
    } catch (error) {
      setMessages([...next, { role: 'assistant', content: t.brain }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(!open)} aria-label={open ? t.close : t.ask} style={zorgaxButtonStyle}>
        👽 <span className="zorgax-fab-label">{open ? t.close : t.ask}</span>
      </button>
      <style>{`@media (max-width:600px){.zorgax-fab-label{display:none}}`}</style>
      {open && (
        <aside role="dialog" style={zorgaxPanelStyle}>
          <div style={{ fontSize: 12, fontWeight: 900, opacity: .75 }}>{t.copilot}</div>
          <h3>{t.want}</h3>
          <div style={{ display: 'grid', gap: 8, maxHeight: 280, overflowY: 'auto', marginBottom: 12 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ padding: '9px 11px', borderRadius: 12, background: m.role === 'user' ? 'rgba(59,130,246,.24)' : 'rgba(168,85,247,.18)' }}>
                <strong>{m.role === 'user' ? t.you : 'Zorgax'}:</strong> {m.content}
              </div>
            ))}
            {busy && <div>{t.thinking}</div>}
          </div>
          {suggestion && (
            <button onClick={() => { window.location.href = suggestion.href; }} style={{ width: '100%', padding: 11, marginBottom: 10, fontWeight: 900 }}>
              ✨ {suggestion.label} →
            </button>
          )}
          <form onSubmit={send} style={{ display: 'flex', gap: 8 }}>
            <input value={input} onChange={e => setInput(e.target.value)} placeholder={t.placeholder} style={{ flex: 1, minWidth: 0, padding: 11 }} />
            <button type="submit" disabled={busy || !input.trim()}>{t.send}</button>
          </form>
        </aside>
      )}
    </>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState(null);
  const [lang, setLang] = useState(detectLang);
  const [account, setAccount] = useState({ loading: false, user: null, error: null });
  const t = LANGS[lang] || LANGS.en;

  useEffect(() => {
    const token = localStorage.getItem('myzubster-token') || localStorage.getItem('token') || localStorage.getItem('accessToken') || sessionStorage.getItem('token');
    if (!token) return;
    setAccount({ loading: true, user: null, error: null });
    fetch('/api/auth/profile', {
      headers: { Authorization: 'Bearer ' + token },
      cache: 'no-store'
    })
      .then(async r => {
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.message || 'Sessione non valida');
        setAccount({ loading: false, user: (j.data && j.data.user) || null, error: null });
      })
      .catch(error => {
        setAccount({ loading: false, user: null, error: error.message || 'Sessione non valida' });
      });
  }, []);

  const changeLang = e => {
    const l = e.target.value;
    setLang(l);
    localStorage.setItem('myzubster-language', l);
    document.documentElement.lang = l;
  };

  const openZorgax = () => {
    window.dispatchEvent(new CustomEvent('myzubster:open-zorgax'));
  };

  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  if (path === '/social-login' || path === '/social-login.html') return <SocialLoginPage />;
  if (path === '/life-pilot' || path === '/zorgax/life-pilot') return <ZorgaxLifePilotPage />;
  if (path === '/apps') return <AppsDownloadPage />;
  if (path === '/conoscenze' || path === '/knowledge') return <KnowledgeGraphPage />;
  if (path === '/marketplace') return <MarketplacePage />;
  if (path === '/metaverse') return <MetaversePage />;
  if (path === '/fumetto' || path === '/comic' || path === '/fumetto.html' || path === '/comic.html') return <ComicsPage />;
  if (path === '/metaverse/rooms/new') return <MetaverseRoomCreatePage />;
  if (path.startsWith('/metaverse/rooms/')) return <MetaverseRoomPage roomKey={decodeURIComponent(path.split('/').pop())} />;

  if (path === '/ecosystem' || path === '/progetti') {
    return (
      <div className="App" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <header style={{ borderBottom: '1px solid rgba(255,255,255,.1)', background: 'rgba(15,23,42,.85)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 100 }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <a href="/" style={{ textDecoration: 'none', color: '#fff', fontSize: 20, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>🌍</span><span>MYZUBSTER</span>
              </a>
              <select aria-label="Language" value={lang} onChange={changeLang} style={{ background: 'rgba(255,255,255,.08)', color: '#cbd5e1', border: '1px solid rgba(255,255,255,.2)', borderRadius: 8, padding: '4px 8px', fontSize: 13 }}>
                {Object.entries(LANGS).map(([k, v]) => (
                  <option key={k} value={k} style={{ background: '#0f172a', color: '#fff' }}>{v.name}</option>
                ))}
              </select>
            </div>
            <nav style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <a href="/marketplace" style={{ ...lifeLinkStyle, background: '#0284c7', color: '#fff', fontSize: 14, padding: '8px 16px', border: 'none' }}>
                {t.searchServices}
              </a>
              <a href="/marketplace?action=new" style={{ ...lifeLinkStyle, background: 'rgba(255,255,255,.08)', color: '#fff', fontSize: 14, padding: '8px 16px', border: '1px solid rgba(255,255,255,.25)' }}>
                {t.offerService}
              </a>
              <button onClick={() => openZorgax()} style={{ ...lifeLinkStyle, background: 'rgba(168,85,247,.15)', color: '#d8b4fe', fontSize: 14, padding: '8px 16px', border: '1px solid rgba(168,85,247,.4)', cursor: 'pointer' }}>
                {t.askZorgax || '👽 Chiedi a Zorgax'}
              </button>
              <a href="/metaverse" style={{ ...lifeLinkStyle, background: 'transparent', color: '#cbd5e1', fontSize: 14, padding: '8px 16px', border: '1px solid rgba(255,255,255,.25)' }}>
                {t.metaverse}
              </a>
              <a href="/social-login" style={{ ...lifeLinkStyle, background: 'rgba(168,85,247,.15)', color: '#d8b4fe', fontSize: 14, padding: '8px 16px', border: '1px solid rgba(168,85,247,.4)' }}>
                {account.user ? `👤 @${account.user.username || ((account.user.email && account.user.email.split('@')[0]) || 'Profilo')}` : t.profileOrLogin}
              </a>
            </nav>
          </div>
        </header>
        <main style={{ flex: 1 }}>
          <EcosystemPage t={t} onChooseTab={setActiveTab} />
          {activeTab === TABS.EXPLORE && <MapPage />}
          {activeTab === TABS.GARDENS && <GardensPage />}
          {activeTab === TABS.MISSIONS && <ClowbotBountiesPage />}
          {activeTab === TABS.MARKETPLACE && <MarketplacePage />}
          {activeTab === TABS.MARKETPLACE_OPS && <MarketplaceOpsPage />}
        </main>
        <MarketplaceFooter t={t} />
        <ZorgaxAssistant key={lang} t={t} />
      </div>
    );
  }

  return (
    <div className="App" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {(account.loading || account.user || account.error) && (
        <section style={{ margin: '12px 20px 0', padding: '14px 16px', border: '1px solid rgba(34,211,238,.35)', borderRadius: 14, background: 'rgba(34,211,238,.08)' }}>
          <strong>👤 Account MyZubster</strong>
          {account.loading && <div>Verifica account e privilegi…</div>}
          {account.user && (
            <div>
              <div style={{ fontSize: 17, marginTop: 5 }}>
                <strong>{account.user.username || account.user.email}</strong>
              </div>
              <div style={{ opacity: .85, marginTop: 3 }}>
                {account.user.email} · privilegio: <strong>{account.user.role || 'user'}</strong>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                {account.user.socialIdentities && Object.entries(account.user.socialIdentities).filter(([, v]) => (v && v.id)).map(([provider]) => (
                  <span key={provider} style={{ padding: '4px 8px', border: '1px solid rgba(255,255,255,.2)', borderRadius: 999 }}>
                    ✓ {provider}
                  </span>
                ))}
                {(account.user.github && account.user.github.id) && (
                  <span key="github" style={{ padding: '4px 8px', border: '1px solid rgba(255,255,255,.2)', borderRadius: 999 }}>
                    ✓ GitHub{account.user.github.login ? ` verificato: @${account.user.github.login}` : ''}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 12 }}>
                <a href="/social-login">🔄 Cambia/collega account</a>
                <a href="/marketplace">🛒 Marketplace</a>
                <a href="/life-pilot">🌱 LIFE Pilot</a>
                <a href="/zorgax">👽 Zorgax</a>
                {account.user.role === 'admin' && (
                  <a href="/api/admin/dashboard/overview-ui" style={{ fontWeight: 900 }}>⚙️ Amministrazione</a>
                )}
              </div>
            </div>
          )}
          {account.error && <div>{account.error} · <a href="/social-login">Accedi di nuovo</a></div>}
        </section>
      )}

      <header style={{ borderBottom: '1px solid rgba(255,255,255,.1)', background: 'rgba(15,23,42,.85)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <a href="/" style={{ textDecoration: 'none', color: '#fff', fontSize: 20, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>🌍</span><span>MYZUBSTER</span>
            </a>
            <select aria-label="Language" value={lang} onChange={changeLang} style={{ background: 'rgba(255,255,255,.08)', color: '#cbd5e1', border: '1px solid rgba(255,255,255,.2)', borderRadius: 8, padding: '4px 8px', fontSize: 13 }}>
              {Object.entries(LANGS).map(([k, v]) => (
                <option key={k} value={k} style={{ background: '#0f172a', color: '#fff' }}>{v.name}</option>
              ))}
            </select>
          </div>
          <nav style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <a href="/marketplace" style={{ ...lifeLinkStyle, background: '#0284c7', color: '#fff', fontSize: 14, padding: '8px 16px', border: 'none' }}>
              {t.searchServices}
            </a>
            <a href="/marketplace?action=new" style={{ ...lifeLinkStyle, background: 'rgba(255,255,255,.08)', color: '#fff', fontSize: 14, padding: '8px 16px', border: '1px solid rgba(255,255,255,.25)' }}>
              {t.offerService}
            </a>
            <button onClick={() => openZorgax()} style={{ ...lifeLinkStyle, background: 'rgba(168,85,247,.15)', color: '#d8b4fe', fontSize: 14, padding: '8px 16px', border: '1px solid rgba(168,85,247,.4)', cursor: 'pointer' }}>
              {t.askZorgax || '👽 Chiedi a Zorgax'}
            </button>
            <button onClick={() => window.location.assign('/metaverse')} style={{ ...lifeLinkStyle, background: 'transparent', color: '#cbd5e1', fontSize: 14, padding: '8px 16px', border: '1px solid rgba(255,255,255,.25)', cursor: 'pointer' }}>
              {t.metaverse}
            </button>
            <a href="/social-login" style={{ ...lifeLinkStyle, background: 'rgba(168,85,247,.15)', color: '#d8b4fe', fontSize: 14, padding: '8px 16px', border: '1px solid rgba(168,85,247,.4)' }}>
              {account.user ? `👤 @${account.user.username || ((account.user.email && account.user.email.split('@')[0]) || 'Profilo')}` : t.profileOrLogin}
            </a>
          </nav>
        </div>
      </header>

      <main style={{ flex: 1 }}>
        <FirstVisitIntro t={t} onOpenZorgax={openZorgax} />
        <SixEntryPointsGrid t={t} onOpenZorgax={openZorgax} />
        <FeaturedServicesGrid t={t} />
        {activeTab === TABS.EXPLORE && <MapPage />}
        {activeTab === TABS.GARDENS && <GardensPage />}
        {activeTab === TABS.MISSIONS && <ClowbotBountiesPage />}
        {activeTab === TABS.MARKETPLACE && <MarketplacePage />}
        {activeTab === TABS.MARKETPLACE_OPS && <MarketplaceOpsPage />}
      </main>

      <MarketplaceFooter t={t} />
      <ZorgaxAssistant key={lang} t={t} />
    </div>
  );
}

export {
  LANGS,
  detectLang,
  FeaturedServicesGrid,
  SixEntryPointsGrid,
  DirectionIndex,
  EcosystemHub,
  MyzUtilitySpotlight,
  StoryVisuals,
  EcosystemPage,
  MarketplaceFooter,
  ComicsPage
};

export default App;
