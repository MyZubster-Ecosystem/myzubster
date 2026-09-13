import {DEMO_SELLERS,MARKETPLACE_CATEGORIES} from './MarketplacePage';

describe('Marketplace demo category coverage',()=>{
  test('provides at least one demo seller for every category',()=>{
    const covered=new Set(DEMO_SELLERS.map(seller=>seller.category));
    const missing=MARKETPLACE_CATEGORIES.filter(category=>!covered.has(category));

    expect(missing).toEqual([]);
  });

  test('uses valid categories and unique demo ids',()=>{
    const allowed=new Set(MARKETPLACE_CATEGORIES);
    const ids=DEMO_SELLERS.map(seller=>seller.id);

    expect(DEMO_SELLERS.every(seller=>allowed.has(seller.category))).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
