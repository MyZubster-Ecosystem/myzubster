import{DEMO_SELLERS,MARKETPLACE_CATEGORIES,demoPaymentMode,filterDemoSellers,isDemoDeepLink}from'./MarketplacePage';

describe('Marketplace Demo v2',()=>{
  test('provides at least one demo seller for every category',()=>{const covered=new Set(DEMO_SELLERS.map(s=>s.category));expect(MARKETPLACE_CATEGORIES.filter(c=>!covered.has(c))).toEqual([])});
  test('uses valid categories and unique demo ids',()=>{const allowed=new Set(MARKETPLACE_CATEGORIES),ids=DEMO_SELLERS.map(s=>s.id);expect(DEMO_SELLERS.every(s=>allowed.has(s.category))).toBe(true);expect(new Set(ids).size).toBe(ids.length)});
  test('every demo has a visual, detail content and availability',()=>{expect(DEMO_SELLERS.every(s=>s.icon&&s.description&&s.availability&&Array.isArray(s.details)&&s.details.length)).toBe(true)});
  test('filters demos by category, location, text and payment mode',()=>{expect(filterDemoSellers(DEMO_SELLERS,{category:'pet_adoption'}).map(s=>s.id)).toContain('demo-pet-adoption');expect(filterDemoSellers(DEMO_SELLERS,{location:'Cesena'}).every(s=>s.location.includes('Cesena'))).toBe(true);expect(filterDemoSellers(DEMO_SELLERS,{query:'volontario'}).map(s=>s.id)).toContain('demo-volunteering');expect(filterDemoSellers(DEMO_SELLERS,{payment:'BARTER'}).every(s=>demoPaymentMode(s.price)==='BARTER')).toBe(true)});
  test('specialized community categories expose purpose-specific fields',()=>{for(const category of['volunteering','pet_adoption','pet_lost_found','pet_services']){const demo=DEMO_SELLERS.find(s=>s.category===category);expect(demo.details.length).toBeGreaterThanOrEqual(3)}});
  test('recognizes only the explicit demo deep link',()=>{expect(isDemoDeepLink('?demo=1&utm_source=facebook')).toBe(true);expect(isDemoDeepLink('?demo=0')).toBe(false);expect(isDemoDeepLink('?utm_source=facebook')).toBe(false)});
});
