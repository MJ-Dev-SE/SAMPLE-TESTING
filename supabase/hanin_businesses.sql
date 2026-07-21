-- =============================================================================
-- HANIN.TV BUSINESSES — per-domain directory scope + seed (run once, AFTER
-- content.sql + manilatour.sql + seo.sql + address_contact.sql).
-- Dashboard → SQL Editor → New query → paste → Run.
--
-- WHY: hanin.tv's showcase / wing / directory listings currently render from a
-- STATIC file (src/data/haninBusinesses.ts) so the site worked with no seeding.
-- Static means "developer edits code to change a phone number". This migration
-- turns them into ordinary `businesses` rows, so from here on they are edited
-- in the ADMIN CONSOLE (Businesses tab) like every other listing — add, edit,
-- delete, reorder, change photos, toggle showcase.
--
-- Once a slug below exists as a row, the app STOPS injecting its static twin
-- (lib/content.listBrandBusinessSlugs), so nothing is ever duplicated and
-- there is no cutover moment to coordinate.
--
--   1) businesses.brand    — per-domain scope. NULL = shared on every domain
--                            (all pre-existing rows keep this: manilatour.com
--                            is completely unchanged). 'hanin' = hanin.tv only.
--   2) businesses.showcase — featured in that domain's homepage showcase grid.
--   3) Seed the 14 hanin.tv listings (8 showcase + 6 wing-linked).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1) + 2) Columns.
-- ---------------------------------------------------------------------------
alter table public.businesses
  add column if not exists brand    text,
  add column if not exists showcase boolean not null default false;

comment on column public.businesses.brand is
  'Domain scope: NULL = shown on every domain; a brand id from src/config/brand.ts (e.g. ''hanin'') = that domain only.';
comment on column public.businesses.showcase is
  'true = featured in the homepage showcase grid of this listing''s own domain.';

create index if not exists businesses_brand_idx on public.businesses (brand, status, display_order);

-- ---------------------------------------------------------------------------
-- 3) SEED — the 14 hanin.tv listings. Idempotent: skips any slug that already
--    exists, so re-running never duplicates and never overwrites admin edits.
--    Images are committed /public assets, so they resolve with no Storage upload.
-- ---------------------------------------------------------------------------
insert into public.businesses (
  brand, slug, name, category, category_id, region, location,
  address, address_province, address_city, address_barangay,
  phone, mobile_phone,
  short_intro, detailed_intro, excerpt, description,
  thumb_url, main_image_url, status, display_order, showcase
)
select
  'hanin', v.slug, v.name, v.category,
  (select c.id from public.categories c where c.slug = v.category and c.kind = 'business' limit 1),
  v.region, v.region,
  v.address, v.province, v.city, v.barangay,
  v.phone, v.mobile,
  jsonb_build_object('en', v.short_en, 'ko', v.short_ko),
  jsonb_build_object('en', v.det_en,   'ko', v.det_ko),
  jsonb_build_object('en', v.short_en, 'ko', v.short_ko),
  jsonb_build_object('en', v.det_en,   'ko', v.det_ko),
  v.image, v.image, 'active', v.ord, v.showcase
from (values
  -- ---- showcase businesses (homepage grid + directory) ----
  ('hanin-chuiyoung-salon', 'Chuiyoung Salon', 'food',
   'Parañaque', 'K1 Center, Prestige Bay, Bradco Ave, Aseana City, Parañaque, 1700 Metro Manila',
   'Metro Manila', 'Parañaque', 'Aseana City', '0956 867 3549', '0962 589 4755',
   'Korean cuisine at K1 Center, Aseana City.', 'K1 센터 아세아나시티의 한식 전문.',
   'Authentic Korean flavors just like in Korea. Open 10:00 AM – 4:00 AM · ₱500–1,000 per person · LGBTQ+ friendly.',
   '한국에서처럼 정통의 맛. 오전 10시 – 오전 4시 · 1인당 ₱500–1,000 · LGBTQ+ 친화적.',
   '/brand/hanin/showcase/chuiyoung.png', 1, true),

  ('hanin-korean-dental', 'Korean Dental Clinic', 'hospital',
   'Parañaque', '2F Central Square Building, President''s Ave, BF Homes, Parañaque, 1700 Metro Manila',
   'Metro Manila', 'Parañaque', 'BF Homes', '0928 416 4180', null,
   'Korean-run dental clinic at Central Square, BF Homes.', 'BF홈즈 센트럴스퀘어의 한인 치과.',
   'Modern Korean-run dental clinic. Open · Closes 5:30 PM.',
   '현대적인 한인 운영 치과. 영업 · 오후 5시 30분 마감.',
   '/brand/hanin/showcase/dentalclinic.png', 2, true),

  ('hanin-k2-hopping-tour', 'K2 Hopping Tour', 'travel',
   'Zambales', 'R79H+F7, Subic Bay Freeport Zone, Zambales',
   'Zambales', 'Subic Bay Freeport Zone', null, null, null,
   'Island hopping & boat tours out of Subic Bay.', '수빅베이 아일랜드 호핑·보트 투어.',
   'Island hopping and boat tours out of Subic Bay Freeport Zone, Zambales. Open · Closes 6:00 PM · jkntree.com',
   '수빅베이 자유무역지대(잠발레스)에서 출발하는 아일랜드 호핑·보트 투어. 영업 · 오후 6시 마감 · jkntree.com',
   '/brand/hanin/showcase/k2beach.png', 3, true),

  ('hanin-shabu-yaki', 'Shabu Yaki', 'food',
   null, null, null, null, null, null, null,
   'Korean hot pot & yakiniku.', '한국식 샤부샤부 & 야키니쿠.',
   'Korean hot pot & yakiniku — handmade Korean sausage, chicken soup, chilled buckwheat noodles.',
   '한국식 샤부샤부 & 야키니쿠 — 수제 순대, 닭곰탕, 냉면.',
   '/brand/hanin/showcase/shabuyaki.jpg', 4, true),

  ('hanin-kaya-restaurant', 'Kaya Korean Restaurant', 'food',
   null, null, null, null, null, null, null,
   'Classic home-style Korean dishes.', '정통 가정식 한식.',
   'Korean restaurant serving classic home-style dishes.', '정통 가정식 한식을 제공하는 한식당.',
   '/brand/hanin/showcase/kaya.jpg', 5, true),

  ('hanin-daraejung', 'Daraejung Korean Restaurant', 'food',
   'Pasay', null, null, 'Pasay', null, null, null,
   'Branches in Pasay, BGC, Quezon City & Angeles.', '파사이·BGC·케손시티·앙헬레스 지점.',
   'Korean restaurant with branches in Pasay (main), BGC, Quezon City and Angeles.',
   '파사이(본점), BGC, 케손시티, 앙헬레스 지점을 둔 한식당.',
   '/brand/hanin/showcase/daraejung.jpg', 6, true),

  ('hanin-mega-mart', 'Mega Mart Fresh Food Market', 'mart',
   null, null, null, null, null, null, null,
   'Fresh food market — seafood, bakery & deli.', '신선식품 마켓 — 해산물, 베이커리·델리.',
   'Fresh food market — seafood & sushi, bakery & deli.', '신선식품 마켓 — 해산물·초밥, 베이커리·델리.',
   '/brand/hanin/showcase/megamart.jpg', 7, true),

  ('hanin-ssong-mart', 'Ssong Mart', 'mart',
   null, null, null, null, null, null, null,
   'Korean grocery & food court.', '한인 식료품점 & 푸드코트.',
   'Korean grocery & food court.', '한인 식료품점 & 푸드코트.',
   '/brand/hanin/showcase/ssongmart.png', 8, true),

  -- ---- wing-banner businesses (side rails link to these profiles) ----
  ('hanin-korex', 'Korex Sea & Air', 'etc',
   'Manila', 'Unit 306 B.F Condo, Soriano Ave, Intramuros, Manila',
   'Metro Manila', 'Manila', 'Intramuros', '02-5310-0556', '0917-159-6218',
   'Sea & air freight, customs & door-to-door.', '해상·항공 화물, 통관, 문전배송.',
   '25 years of fast, accurate customs & forwarding: sea/air cargo, overseas moving, project cargo.',
   '25년 전통의 신속·정확한 통관 및 포워딩: 해상·항공 화물, 해외 이사, 프로젝트 화물.',
   '/brand/hanin/wings/korex.jpg', 9, false),

  ('hanin-lucky-philkor', 'Lucky Phil Kor Logistics Corp.', 'etc',
   'Parañaque', 'Tambo, Parañaque City',
   'Metro Manila', 'Parañaque', 'Tambo', '02-853-7338', null,
   'Air & sea freight forwarding, 2-day delivery.', '항공·해상 화물 운송, 2일 배송.',
   'Air & sea freight forwarding with fast 2-day delivery.', '빠른 2일 배송의 항공·해상 화물 운송.',
   '/brand/hanin/wings/luckyphilkor.jpg', 10, false),

  ('hanin-yeson-travel', 'Yeson Travel & Consultancy', 'travel',
   'Makati', '3rd Floor, ECH Building, 100 Jupiter St, cor Makati Ave, Makati City',
   'Metro Manila', 'Makati', null, '(02) 8828 8877', null,
   'Travel agency & consultancy in Makati.', '마카티의 여행사·컨설팅.',
   'Travel agency & consultancy. Open · Closes 6 PM · yesontravel.com',
   '여행사·컨설팅. 영업 · 오후 6시 마감 · yesontravel.com',
   '/brand/hanin/wings/yeson.jpg', 11, false),

  ('hanin-cheongho', 'Cheongho Nice Water', 'etc',
   null, null, null, null, null, null, null,
   'Water purifier sales, install & service.', '정수기 판매·설치·관리.',
   'Water purifiers for home and business — large-capacity commercial units and hotel/school/factory water management, no lock-in period.',
   '가정·업소용 정수기 — 대용량 상업용 및 호텔·학교·공장 음용수 관리, 의무사용기간 없음.',
   '/brand/hanin/wings/waterpromo.png', 12, false),

  ('hanin-lasema-spa', 'Lasema Jjim Jil Bang Spa', 'spa',
   null, null, null, null, null, null, null,
   'Korean jjimjilbang sauna & spa (est. 2005).', '한국식 찜질방 사우나·스파 (2005년 설립).',
   'Korean jjimjilbang sauna & spa, established 2005.', '2005년 설립된 한국식 찜질방 사우나·스파.',
   '/brand/hanin/wings/lasema.jpg', 13, false),

  ('hanin-yedang', 'Yedang Korean Restaurant', 'food',
   null, null, null, null, null, null, null,
   'Korean restaurant — BBQ set menus.', '한식당 — 구이 세트 메뉴.',
   'Korean restaurant with premium and value BBQ couple set menus.',
   '프리미엄·가성비 커플 세트 메뉴가 있는 한식당.',
   '/brand/hanin/wings/yedang.jpg', 14, false)
) as v(slug, name, category, region, address, province, city, barangay, phone, mobile,
       short_en, short_ko, det_en, det_ko, image, ord, showcase)
where not exists (select 1 from public.businesses b where b.slug = v.slug);

-- ---------------------------------------------------------------------------
-- AFTERWARDS — verify, then manage everything from the admin console:
--   select slug, name, category, brand, showcase from public.businesses
--   where brand = 'hanin' order by display_order;
--
-- Addresses/phones were transcribed from the client's Google-Maps info panels
-- only where the photo ↔ panel pairing was certain; the rest are intentionally
-- blank rather than guessed. Fill them in via Admin → Businesses.
-- ---------------------------------------------------------------------------
