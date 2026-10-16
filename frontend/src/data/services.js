// ─── Cleaning service data ──────────────────────────────────────────────────
// Pricing mirrors backend/src/config/defaults.js (HOME_SQFT_BASE_PRICES,
// APARTMENT_SIZE_PRICES, COMMERCIAL_SQFT_RATES, CARPET_PRICE_PER_ROOM,
// UPHOLSTERY_ITEM_PRICES, AIR_DUCT_BASE, DRYER_VENT_BASE, TILE_PRICE_PER_SQFT,
// MOLD_SQFT_PRICE_CURVE, WATER_EXTRACTION_DRYING_PER_SQFT). Update both files together if pricing
// data changes. `id` matches the calculator's SERVICE_STEPS key
// (frontend/src/components/calculator/CleaningCalculator.js) so a service
// page's CTA can deep-link straight into that flow via /?service=<id>.

const SERVICES = [
  {
    id: 'home_residential',
    slug: 'house-cleaning-cost',
    name: 'House Cleaning',
    shortLabel: 'House Cleaning',
    tagline: 'Standard recurring or one-time house cleaning, priced by home size — the most requested service on Clean Estimator.',
    seoTitle: 'House Cleaning Cost 2026: Price by Home Size | Clean Estimator',
    metaDescription: 'House cleaning costs $90–$338 per visit depending on home size, from under 1,000 sq ft up to 3,000+ sq ft. See 2026 pricing by square footage, plus deep-clean and recurring discounts.',
    unitType: 'flat',
    unit: 'per visit, standard clean',
    typicalTierIndex: 2,
    tiers: [
      { label: 'Under 1,000 sq ft', low: 90, high: 115, note: 'Studio or small starter home' },
      { label: '1,000–1,500 sq ft', low: 122, high: 152, note: 'Small single-family home' },
      { label: '1,500–2,000 sq ft (Most Common)', low: 158, high: 198, note: 'Typical 3-bed/2-bath home' },
      { label: '2,000–2,500 sq ft', low: 195, high: 245, note: 'Larger family home' },
      { label: '2,500–3,000 sq ft', low: 228, high: 282, note: 'Large home, more bedrooms/bathrooms' },
      { label: 'Over 3,000 sq ft', low: 272, high: 338, note: 'Extra-large home' },
    ],
    bullets: [
      'Deep cleaning costs 68–85% more than a standard clean; move-in/move-out cleans cost 88–105% more',
      'Weekly service gets a 20% recurring discount, biweekly 15%, monthly 10%',
      'Add-ons like inside oven ($38–$50), inside fridge ($30–$42), and interior windows ($52–$65) are priced separately',
      'A home in "needs attention" condition costs 22–28% more than one in good condition',
    ],
    faqs: [
      { q: 'How much does house cleaning cost for an average home?', a: 'For a 1,500–2,000 sq ft home — the most common size — a standard clean runs $158–$198 per visit. Smaller homes under 1,000 sq ft run $90–$115, while homes over 3,000 sq ft run $272–$338.' },
      { q: 'What\'s the difference between standard and deep cleaning?', a: 'Deep cleaning covers baseboards, inside cabinets, detailed kitchen/bathroom scrubbing, and other areas a standard clean skips. It costs 68–85% more than standard, and is recommended for first-time cleans or homes that haven\'t been professionally cleaned in months.' },
      { q: 'How much can I save with recurring cleaning?', a: 'Weekly cleaning gets a 20% discount off the one-time rate, biweekly gets 15%, and monthly gets 10%. Recurring service is the best value if you want a consistently clean home.' },
      { q: 'Do add-ons cost extra?', a: 'Yes — inside oven ($38–$50), inside fridge ($30–$42), interior windows ($52–$65), laundry ($34–$44), and similar extras are priced per add-on and not included in the base price.' },
    ],
    relatedSlugs: ['apartment-cleaning-cost', 'carpet-cleaning-cost', 'tile-and-grout-cleaning-cost'],
  },
  {
    id: 'apartment',
    slug: 'apartment-cleaning-cost',
    name: 'Apartment Cleaning',
    shortLabel: 'Apartment Cleaning',
    tagline: 'Cleaning priced for apartment living — studio through 4+ bedroom, including move-in/move-out turnovers.',
    seoTitle: 'Apartment Cleaning Cost 2026: Price by Unit Size | Clean Estimator',
    metaDescription: 'Apartment cleaning costs $89–$271 per visit depending on unit size, from studios to 4+ bedrooms. See 2026 pricing, move-out cleaning costs, and vacant-unit discounts.',
    unitType: 'flat',
    unit: 'per visit',
    typicalTierIndex: 2,
    tiers: [
      { label: 'Studio', low: 89, high: 113, note: 'Fastest turnaround, lowest cost' },
      { label: '1 Bedroom', low: 112, high: 140, note: 'Most common starter apartment' },
      { label: '2 Bedroom (Most Common)', low: 147, high: 184, note: 'Typical family or roommate unit' },
      { label: '3 Bedroom', low: 184, high: 226, note: 'Larger unit or townhome-style apartment' },
      { label: '4+ Bedroom', low: 221, high: 271, note: 'Largest units, more bathrooms' },
    ],
    bullets: [
      'Vacant/unfurnished units typically cost 10–15% less than occupied units',
      'Move-in/move-out cleans take longer and cost more than a standard turnover clean',
      'Same deep-clean and add-on pricing applies as house cleaning',
      'Property managers often get volume discounts for multi-unit turnover cleaning',
    ],
    faqs: [
      { q: 'How much does it cost to clean an apartment?', a: 'A 2-bedroom apartment — the most common size — costs $147–$184 per visit. Studios run $89–$113, while larger 4+ bedroom units run $221–$271.' },
      { q: 'Is move-out cleaning more expensive?', a: 'Yes, move-in/move-out cleans typically cost 88–105% more than a standard clean since they require deeper attention to every surface, cabinet, and appliance for a full walkthrough.' },
      { q: 'Do vacant apartments cost less to clean?', a: 'Yes — vacant, unfurnished units are typically 10–15% cheaper since there\'s no furniture to work around and cleaners can move faster.' },
      { q: 'Can I get a discount for recurring apartment cleaning?', a: 'Yes, the same recurring discounts apply as house cleaning: 20% off for weekly, 15% for biweekly, and 10% for monthly service.' },
    ],
    relatedSlugs: ['house-cleaning-cost', 'commercial-cleaning-cost'],
  },
  {
    id: 'commercial',
    slug: 'commercial-cleaning-cost',
    name: 'Commercial Cleaning',
    shortLabel: 'Commercial Cleaning',
    tagline: 'Recurring janitorial service for offices, retail, medical, and other commercial spaces, priced per sq ft per visit.',
    seoTitle: 'Commercial Cleaning Cost 2026: Price Per Sq Ft by Building Type | Clean Estimator',
    metaDescription: 'Commercial cleaning costs $0.052–$0.185 per sq ft per visit depending on building type. See 2026 pricing for offices, retail, medical, restaurants, and more, plus monthly cost examples.',
    unitType: 'per_sqft',
    unit: 'per sq ft, per visit',
    typicalQuantity: 2000,
    typicalVisitsPerMonth: 4,
    typicalTierIndex: 1,
    tiers: [
      { label: 'Warehouse', low: 0.052, high: 0.065, note: 'Lowest rate — large open spaces, less detail work' },
      { label: 'Office (Most Common)', low: 0.088, high: 0.107, note: 'Standard trash, dusting, floor care, restrooms' },
      { label: 'Retail', low: 0.09, high: 0.11, note: 'Sales floor, fitting rooms, entryways' },
      { label: 'School', low: 0.095, high: 0.118, note: 'Classrooms, cafeterias, gyms' },
      { label: 'Gym / Fitness', low: 0.104, high: 0.128, note: 'Equipment sanitizing, locker rooms' },
      { label: 'Church / Event Space', low: 0.085, high: 0.115, note: 'Large worship hall offset by fellowship-hall kitchens & restrooms' },
      { label: 'Restaurant', low: 0.12, high: 0.148, note: 'Kitchen sanitation, grease management' },
      { label: 'Medical', low: 0.15, high: 0.185, note: 'Strictest sanitation and compliance requirements' },
    ],
    bullets: [
      'Priced per sq ft per visit, then multiplied by how often you need service (daily, weekly, biweekly, monthly)',
      'Medical and restaurant spaces cost the most due to sanitation requirements',
      'Premium service level (deep sanitizing, specialty floor care) costs 55–68% more than basic',
      'Day porter (on-site daily staff) service is billed separately at $218–$265/day',
    ],
    faqs: [
      { q: 'How much does commercial cleaning cost per square foot?', a: 'Commercial cleaning costs $0.052–$0.185 per sq ft per visit depending on building type. A standard office runs $0.088–$0.107/sq ft, while medical facilities run $0.15–$0.185/sq ft due to stricter sanitation needs.' },
      { q: 'How much does it cost to clean a 2,000 sq ft office weekly?', a: 'At weekly service (4 visits/month), a 2,000 sq ft office runs about $704–$856 per month using standard office rates.' },
      { q: 'What\'s the difference between basic, standard, and premium commercial service?', a: 'Basic covers standard trash, dusting, and floor care. Standard adds more thorough detailing (+20–25%). Premium adds specialty floor care and deep sanitizing (+55–68%).' },
      { q: 'How often should a commercial space be cleaned?', a: 'Daily is typical for medical, restaurant, and high-traffic retail. Weekly to biweekly is common for offices. Warehouses can often go monthly.' },
    ],
    relatedSlugs: ['house-cleaning-cost', 'tile-and-grout-cleaning-cost'],
  },
  {
    id: 'carpet',
    slug: 'carpet-cleaning-cost',
    name: 'Carpet Cleaning',
    shortLabel: 'Carpet Cleaning',
    tagline: 'Professional steam or dry carpet cleaning, priced per room and scaled to how soiled the carpet is.',
    seoTitle: 'Carpet Cleaning Cost 2026: Price Per Room by Condition | Clean Estimator',
    metaDescription: 'Carpet cleaning costs $48–$113 per room depending on soil level, from routine maintenance to pet stain treatment. See 2026 pricing, whole-home minimums, and method comparisons.',
    unitType: 'per_room',
    unit: 'per room',
    typicalQuantity: 5,
    typicalTierIndex: 0,
    tiers: [
      { label: 'Light (Routine Maintenance)', low: 48, high: 62, note: 'Regular upkeep, no visible staining' },
      { label: 'Moderate Soiling', low: 54, high: 73, note: 'High-traffic areas, some visible dirt' },
      { label: 'Heavy Soiling', low: 66, high: 90, note: 'Significant buildup, longer overdue cleaning' },
      { label: 'Pet Stains / Odor', low: 79, high: 113, note: 'Requires enzyme treatment and extra extraction passes' },
    ],
    bullets: [
      'Whole-home minimum charge is $90–$110 regardless of room count',
      'Steam cleaning (hot water extraction) is the standard method; dry cleaning costs 10–13% more but dries faster',
      'Pet odor treatment adds $48–$75, and stain protector adds $35–$55 per treated area',
      'Area rugs are priced separately at $58–$120 per rug',
    ],
    faqs: [
      { q: 'How much does carpet cleaning cost?', a: 'Carpet cleaning costs $48–$62 per room for routine (light) soiling, with a whole-home minimum of $90. A typical 5-room home runs about $240–$310 for light cleaning.' },
      { q: 'How much more does pet stain treatment cost?', a: 'Pet-stained or heavily odorous carpet costs $79–$113 per room — about 65–82% more than routine cleaning — due to the extra enzyme treatment and extraction passes required.' },
      { q: 'What\'s the difference between steam and dry carpet cleaning?', a: 'Steam cleaning (hot water extraction) is the industry standard and most effective at deep soil removal. Dry cleaning costs 10–13% more but has little to no drying time, useful for high-traffic commercial spaces.' },
      { q: 'Are stairs included in carpet cleaning pricing?', a: 'No, carpeted stairs are priced separately at $52–$68 per flight (13–15 steps).' },
    ],
    relatedSlugs: ['upholstery-cleaning-cost', 'tile-and-grout-cleaning-cost', 'house-cleaning-cost'],
  },
  {
    id: 'upholstery',
    slug: 'upholstery-cleaning-cost',
    name: 'Upholstery Cleaning',
    shortLabel: 'Upholstery Cleaning',
    tagline: 'Professional fabric and leather furniture cleaning, priced per piece and scaled to soiling and material.',
    seoTitle: 'Upholstery Cleaning Cost 2026: Price Per Piece | Clean Estimator',
    metaDescription: 'Upholstery cleaning costs $40–$310 per piece depending on furniture type and soiling, from a single chair to a full sectional. See 2026 pricing by item, plus leather and pet-stain costs.',
    unitType: 'flat',
    unit: 'per piece',
    typicalTierIndex: 2,
    tiers: [
      { label: 'Chair / Recliner', low: 40, high: 70, note: 'Single armchair or recliner' },
      { label: 'Loveseat', low: 75, high: 110, note: '2-seat couch' },
      { label: 'Sofa (Most Common)', low: 130, high: 195, note: '3-seat couch, the most requested upholstery job' },
      { label: 'Sectional', low: 195, high: 310, note: 'L-shaped or multi-piece sofa' },
      { label: 'Ottoman', low: 20, high: 35, note: 'Smallest/cheapest single piece' },
    ],
    bullets: [
      'Leather furniture costs about double standard fabric cleaning due to specialized conditioning products',
      'Pet-stained or heavily soiled pieces cost 65–82% more than light, routine cleaning — the same soiling scale used for carpet',
      'Fabric protector adds $15–$25 per piece; deodorizer adds $12–$20 per piece',
      'Whole-job minimum charge is $90–$120 regardless of how small the job is',
    ],
    faqs: [
      { q: 'How much does upholstery cleaning cost?', a: 'It depends on the piece: a single chair or recliner runs $40–$70, a sofa (the most common job) runs $130–$195, and a full sectional runs $195–$310. Most companies also charge a $90–$120 minimum per visit.' },
      { q: 'Does leather cost more to clean than fabric?', a: 'Yes — leather cleaning typically costs about double standard fabric upholstery cleaning, since it requires specialized, pH-balanced conditioning products rather than steam extraction.' },
      { q: 'How much more does pet-stained furniture cost to clean?', a: 'Pet stains or odors add 65–82% to the base price — the same soiling scale carpet cleaning uses — due to the enzyme treatment and extra extraction passes required.' },
      { q: 'Can I get multiple pieces cleaned in one visit?', a: 'Yes — most visits clean several pieces at once (e.g. a sofa and two chairs), each priced and added separately, which is typically more cost-effective than booking separate visits.' },
    ],
    relatedSlugs: ['carpet-cleaning-cost', 'house-cleaning-cost'],
  },
  {
    id: 'air_duct',
    slug: 'air-duct-cleaning-cost',
    name: 'Air Duct Cleaning',
    shortLabel: 'Air Duct Cleaning',
    tagline: 'Whole-system air duct cleaning to improve air quality and HVAC efficiency, priced per system.',
    seoTitle: 'Air Duct Cleaning Cost 2026: Price by System | Clean Estimator',
    metaDescription: 'Air duct cleaning costs $330–$505 for a residential system. See 2026 pricing, plus sanitization, HEPA filtration, and UV light add-on costs.',
    unitType: 'flat',
    unit: 'per system',
    typicalTierIndex: 0,
    tiers: [
      { label: 'Base System (up to ~12 vents)', low: 330, high: 420, note: 'Standard residential single-system home' },
      { label: 'Additional HVAC System', low: 65, high: 85, note: 'Per extra system, e.g. multi-zone homes' },
    ],
    bullets: [
      'Recommended every 3–5 years, or sooner after renovations or visible mold/pest issues',
      'Sanitization treatment adds $118–$168; HEPA filtration adds $88–$130',
      'UV light installation ($245–$335) helps prevent future mold and bacteria growth',
      'Commercial duct cleaning is priced per sq ft ($0.20–$0.27) instead of per system',
    ],
    faqs: [
      { q: 'How much does air duct cleaning cost?', a: 'A standard residential system (up to ~12 vents) costs $330–$420. Homes with multiple HVAC systems pay an additional $65–$85 per extra system.' },
      { q: 'How often should air ducts be cleaned?', a: 'The EPA recommends every 3–5 years, or sooner if you notice visible mold, pest infestation, excessive dust, or after major renovations.' },
      { q: 'Is duct sanitization worth the extra cost?', a: 'Sanitization ($118–$168) is worth it if you have pets, allergies, or visible mold — it kills bacteria and mold spores that a standard vacuum-only cleaning won\'t remove.' },
      { q: 'Does dryer vent cleaning come with air duct cleaning?', a: 'Not automatically, but many companies offer a combo discount (+$65–$90) to bundle the two services in one visit.' },
    ],
    relatedSlugs: ['dryer-vent-cleaning-cost', 'mold-remediation-cost'],
  },
  {
    id: 'dryer_vent',
    slug: 'dryer-vent-cleaning-cost',
    name: 'Dryer Vent Cleaning',
    shortLabel: 'Dryer Vent Cleaning',
    tagline: 'Removes lint buildup that causes fire risk and reduces dryer efficiency, priced by vent length and complexity.',
    seoTitle: 'Dryer Vent Cleaning Cost 2026: Price by Vent Length | Clean Estimator',
    metaDescription: 'Dryer vent cleaning costs $118–$270 depending on vent length and complexity. See 2026 pricing and why annual cleaning matters for fire safety.',
    unitType: 'flat',
    unit: 'per dryer',
    typicalTierIndex: 0,
    tiers: [
      { label: 'Standard / Short Run', low: 118, high: 155, note: 'Typical single-story home, side-wall vent' },
      { label: 'Medium-Length Run', low: 140, high: 193, note: 'Longer run or one additional bend' },
      { label: 'Long Run', low: 166, high: 225, note: 'Multi-story home or multiple bends' },
      { label: 'Very Long / Complex Run', low: 203, high: 270, note: 'Roof-terminated or heavily routed vent' },
    ],
    bullets: [
      'The U.S. Fire Administration links clogged dryer vents to roughly 2,900 home fires per year',
      'Recommended at least once per year, more often for heavy dryer use or long vent runs',
      'Roof-terminated vents cost $30–$48 more than standard wall vents; severe clogs add $35–$55',
      'Commercial/multi-unit laundry rooms are priced per machine at $72–$100 each',
    ],
    faqs: [
      { q: 'How much does dryer vent cleaning cost?', a: 'A standard, short vent run costs $118–$155. Longer or more complex runs (roof-terminated, multiple bends) cost more — up to $203–$270 for very long runs.' },
      { q: 'Is dryer vent cleaning really necessary?', a: 'Yes — the U.S. Fire Administration reports clogged dryer vents cause about 2,900 home fires annually. Annual cleaning significantly reduces that risk and improves dryer efficiency.' },
      { q: 'How do I know if my vent run is long or complex?', a: 'Vent runs longer than 25 feet, with multiple bends, or terminating on a roof rather than a side wall are considered long/complex and cost more to clean.' },
      { q: 'What if my vent is severely clogged?', a: 'A severe clog adds $35–$55 to the base price for the extra time and equipment needed to fully clear it.' },
    ],
    relatedSlugs: ['air-duct-cleaning-cost', 'house-cleaning-cost'],
  },
  {
    id: 'tile_grout',
    slug: 'tile-and-grout-cleaning-cost',
    name: 'Tile & Grout Cleaning',
    shortLabel: 'Tile & Grout Cleaning',
    tagline: 'Deep cleaning and restoration for tile floors and grout lines, priced per sq ft by material type.',
    seoTitle: 'Tile & Grout Cleaning Cost 2026: Price Per Sq Ft by Material | Clean Estimator',
    metaDescription: 'Tile and grout cleaning costs $0.92–$2.05 per sq ft depending on material. See 2026 pricing for ceramic, porcelain, saltillo, and natural stone, plus sealing and recoloring costs.',
    unitType: 'per_sqft',
    unit: 'per sq ft',
    typicalQuantity: 300,
    typicalTierIndex: 0,
    tiers: [
      { label: 'Ceramic (Most Common)', low: 0.92, high: 1.22, note: 'Standard residential tile' },
      { label: 'Porcelain', low: 1.05, high: 1.40, note: 'Denser material, slightly more effort to clean' },
      { label: 'Saltillo', low: 1.25, high: 1.65, note: 'Porous terracotta tile, needs gentler products' },
      { label: 'Natural Stone', low: 1.55, high: 2.05, note: 'Marble, travertine, slate — requires pH-neutral products' },
    ],
    bullets: [
      'Natural stone tile costs the most to clean safely due to specialized, pH-neutral products required',
      'Grout sealing adds $0.55–$0.88/sq ft; grout recoloring adds $1.65–$2.55/sq ft for a full color refresh',
      'Heavily soiled or damaged tile/grout costs 32–55% more than lightly soiled tile',
      'Whole-project minimum charge is $150–$200',
    ],
    faqs: [
      { q: 'How much does tile and grout cleaning cost?', a: 'For a typical 300 sq ft area, ceramic tile cleaning costs $276–$366. Natural stone costs more, at $465–$615, due to specialized care requirements.' },
      { q: 'Is grout sealing worth it?', a: 'Yes — sealing ($0.55–$0.88/sq ft) protects grout from future staining and can significantly extend the time between deep cleanings.' },
      { q: 'Can discolored grout be restored without replacing it?', a: 'Yes, grout recoloring ($1.65–$2.55/sq ft) applies a durable colorant that restores a uniform, like-new appearance without removing the existing grout.' },
      { q: 'Does tile condition affect the price?', a: 'Yes — heavily soiled or damaged tile/grout costs 32–55% more than lightly soiled tile because of the extra scrubbing and repair prep required.' },
    ],
    relatedSlugs: ['carpet-cleaning-cost', 'house-cleaning-cost'],
  },
  {
    id: 'mold_remediation',
    slug: 'mold-remediation-cost',
    name: 'Mold Remediation',
    shortLabel: 'Mold Remediation',
    tagline: 'Professional mold containment and removal, priced by affected area — always requires an in-person inspection.',
    seoTitle: 'Mold Remediation Cost 2026: Price by Affected Area | Clean Estimator',
    metaDescription: 'Mold remediation costs $750–$13,000+ depending on affected area, from a small bathroom patch to extensive contamination. See 2026 pricing and what affects your estimate.',
    unitType: 'flat',
    unit: 'total remediation cost',
    typicalTierIndex: 1,
    disclaimer: 'These are preliminary estimates only. Mold remediation always requires an in-person inspection by a licensed remediation contractor — final cost depends on the extent of contamination, building materials, local regulations, and whether the moisture source has been fixed. If it hasn\'t, mold will return regardless of how thorough the cleanup is.',
    tiers: [
      { label: 'Small (<10 sq ft)', low: 750, high: 1050, note: 'Corner of shower or small spot treatment' },
      { label: 'Medium (10–100 sq ft, Most Common)', low: 1950, high: 2700, note: 'Bathroom wall or similar single-area job' },
      { label: 'Large (100–300 sq ft)', low: 4300, high: 5800, note: 'Basement or multi-wall contamination' },
      { label: 'Extensive (300+ sq ft)', low: 8500, high: 13000, note: 'Major contamination across multiple areas' },
    ],
    bullets: [
      'Always requires an in-person inspection — the moisture source must be fixed before remediation begins',
      'Black mold (Stachybotrys) typically costs 5–18% more to remediate than common surface mold due to stricter containment',
      'Air quality testing ($220–$290) and post-remediation clearance testing ($190–$250) are recommended add-ons',
      'Commercial properties cost 30–50% more than residential due to larger scale and compliance requirements',
    ],
    faqs: [
      { q: 'How much does mold remediation cost?', a: 'A medium-sized area (10–100 sq ft, like a bathroom wall) costs $1,950–$2,700. Small spot treatments run $750–$1,050, while extensive contamination (300+ sq ft) can run $8,500–$13,000+.' },
      { q: 'Does the type of mold affect the price?', a: 'Yes — black mold (Stachybotrys) typically costs 5–18% more than common green or white mold due to stricter containment, PPE, and disposal requirements.' },
      { q: 'Do I need to fix a leak before mold remediation?', a: 'Yes — the moisture source must be identified and fixed before or during remediation, or the mold will return within weeks regardless of how thorough the cleanup is.' },
      { q: 'Is air quality testing necessary?', a: 'It\'s recommended, especially before and after remediation, to confirm the extent of contamination and verify successful removal. It costs $220–$290 per test.' },
    ],
    relatedSlugs: ['water-damage-restoration-cost', 'air-duct-cleaning-cost'],
  },
  {
    id: 'water_damage',
    slug: 'water-damage-restoration-cost',
    name: 'Water Damage Restoration',
    shortLabel: 'Water Damage Restoration',
    tagline: 'Emergency water extraction and drying, priced per sq ft and by water contamination category — act within 24–48 hours.',
    seoTitle: 'Water Damage Restoration Cost 2026: Price by Category | Clean Estimator',
    metaDescription: 'Water damage restoration costs $2.90–$8.19 per sq ft depending on water category. See 2026 pricing for clean, gray, and black water, plus structural drying and mold prevention costs.',
    unitType: 'per_sqft',
    unit: 'per sq ft, extraction + drying',
    typicalQuantity: 500,
    typicalTierIndex: 0,
    disclaimer: 'Act now — mold can begin growing within 24–48 hours of water damage. These are preliminary estimates only; final pricing requires an in-person assessment from a licensed restoration company. If you have homeowner\'s insurance, contact your insurer immediately and document all damage with photos before cleanup begins.',
    tiers: [
      { label: 'Clean Water (Category 1)', low: 2.90, high: 3.90, note: 'Supply line or appliance leak — no contamination' },
      { label: 'Gray Water (Category 2)', low: 3.92, high: 5.85, note: 'Washing machine or dishwasher overflow' },
      { label: 'Black Water (Category 3)', low: 5.37, high: 8.19, note: 'Sewage or flooding — highest contamination risk' },
    ],
    bullets: [
      'Act within 24–48 hours — mold growth risk increases significantly after that window',
      'Structural drying (walls opened) adds $700–$950; mold prevention treatment (needed after 72+ hours) adds $350–$460',
      'Furniture/contents pack-out and cleaning adds $280–$380 if belongings were affected',
      'Large losses (1,000+ sq ft or multiple areas) typically need a separate full restoration estimate for drywall and flooring, on top of extraction and drying',
    ],
    faqs: [
      { q: 'How much does water damage restoration cost?', a: 'For a 500 sq ft affected area, clean water extraction and drying costs $1,450–$1,950. Gray water costs $1,960–$2,925, and black water (sewage) costs $2,685–$4,095 due to the extra contamination protocols required.' },
      { q: 'What\'s the difference between clean, gray, and black water?', a: 'Clean water comes from a supply line or appliance and poses no health risk. Gray water (washing machine, dishwasher overflow) may be mildly contaminated. Black water (sewage, flooding) is highly contaminated and requires the most extensive protective measures.' },
      { q: 'How fast do I need to act on water damage?', a: 'Within 24–48 hours — mold can begin growing after that window, which can add mold prevention or remediation costs on top of the water damage restoration.' },
      { q: 'Will insurance cover water damage restoration?', a: 'Sudden water damage from a burst pipe or appliance failure is often covered by homeowner\'s insurance, while gradual leaks or flood damage (which requires separate flood insurance) typically are not. Document everything with photos before cleanup begins.' },
    ],
    relatedSlugs: ['mold-remediation-cost', 'air-duct-cleaning-cost'],
  },
  {
    id: 'airbnb',
    slug: 'airbnb-turnover-cleaning-cost',
    name: 'Airbnb / Vacation Rental Cleaning',
    shortLabel: 'Airbnb Turnover Cleaning',
    tagline: 'Fast turnover cleaning between guest stays, priced by unit size, with same-day rush and recurring-host discounts.',
    seoTitle: 'Airbnb Turnover Cleaning Cost 2026: Price by Unit Size | Clean Estimator',
    metaDescription: 'Airbnb and vacation rental turnover cleaning costs $80–$240 per visit depending on unit size. See 2026 pricing, same-day rush fees, and linen/restocking add-on costs.',
    unitType: 'flat',
    unit: 'per turnover',
    typicalTierIndex: 1,
    tiers: [
      { label: 'Studio / 1 Bedroom', low: 80, high: 110, note: 'Fastest turnaround, lowest cost' },
      { label: '2 Bedrooms (Most Common)', low: 105, high: 145, note: 'Typical short-term rental unit' },
      { label: '3 Bedrooms', low: 160, high: 195, note: 'Larger vacation home' },
      { label: '4+ Bedrooms', low: 195, high: 240, note: 'Largest listings, more bathrooms' },
    ],
    bullets: [
      'Same-day rush turnovers (checkout and next check-in the same day) cost 30–40% more',
      'Hosts booking recurring turnover cleaning (weekly/biweekly/monthly volume) can get a recurring discount',
      'Linens & laundry ($20–$30), restocking supplies ($12–$18), and periodic deep-clean turnovers ($45–$65) are priced as add-ons',
      'Faster turnaround and consistency matter more here than for a typical house clean — guests expect hotel-level readiness',
    ],
    faqs: [
      { q: 'How much does Airbnb turnover cleaning cost?', a: 'For a 2-bedroom unit — the most common size — turnover cleaning costs $105–$145 per visit. Studios/1-bedrooms run $80–$110, while 4+ bedroom properties run $195–$240.' },
      { q: 'Does same-day turnaround cost more?', a: 'Yes — a same-day rush turnover (cleaning between a checkout and that same day\'s check-in) typically costs 30–40% more than a standard, scheduled turnover with more time to work.' },
      { q: 'Can hosts get a discount for recurring cleanings?', a: 'Yes — hosts with regular turnover volume (weekly, biweekly, or monthly) can get the same opt-in recurring discount offered on other recurring services.' },
      { q: 'What add-ons are common for vacation rentals?', a: 'Linens & laundry ($20–$30), restocking guest supplies like toiletries and coffee ($12–$18), and a periodic deeper reset clean ($45–$65) are the most common add-ons beyond a standard turnover.' },
    ],
    relatedSlugs: ['apartment-cleaning-cost', 'house-cleaning-cost'],
  },
  {
    id: 'post_construction',
    slug: 'post-construction-cleaning-cost',
    name: 'Post-Construction Cleaning',
    shortLabel: 'Post-Construction Cleaning',
    tagline: 'Cleanup after renovation or new construction — dust, debris, and paint splatter removal, priced by square footage and scope.',
    seoTitle: 'Post-Construction Cleaning Cost 2026: Price by Home Size | Clean Estimator',
    metaDescription: 'Post-construction cleaning costs $200–$794 depending on home size and scope, from a light touch-up to a full new-build cleanup. See 2026 pricing and common add-ons.',
    unitType: 'flat',
    unit: 'one-time cleanup',
    typicalTierIndex: 2,
    tiers: [
      { label: 'Under 1,000 sq ft', low: 200, high: 270, note: 'Small home or single-room renovation' },
      { label: '1,000–1,500 sq ft', low: 266, high: 357, note: 'Small single-family home' },
      { label: '1,500–2,000 sq ft (Most Common)', low: 344, high: 465, note: 'Typical 3-bed/2-bath home' },
      { label: '2,000–2,500 sq ft', low: 425, high: 576, note: 'Larger family home' },
      { label: '2,500–3,000 sq ft', low: 496, high: 663, note: 'Large home, more bedrooms/bathrooms' },
      { label: 'Over 3,000 sq ft', low: 593, high: 794, note: 'Extra-large home or whole-house build' },
    ],
    bullets: [
      'Priced on the same sqft base as house cleaning, with a 2.18–2.35x multiplier for the extra dust, debris, and detail work',
      'Scope matters: a moderate renovation (multiple rooms, a kitchen or bath remodel) costs 8–18% more than a light touch-up, and new construction or a major/gut renovation costs 15–30% more',
      'Window cleaning ($60–$90) removes paint overspray and construction film from glass',
      'Debris haul-away ($120–$200) and vent/duct dust removal ($45–$70) are common add-ons after a build',
    ],
    faqs: [
      { q: 'How much does post-construction cleaning cost?', a: 'For a 1,500–2,000 sq ft home — the most common size — post-construction cleanup costs $344–$465. Smaller spaces under 1,000 sq ft run $200–$270, while homes over 3,000 sq ft run $593–$794.' },
      { q: 'What\'s the difference between light, moderate, and full post-construction cleanup?', a: 'Light covers a touch-up renovation or one or two rooms. Moderate covers a multi-room renovation like a kitchen or bath remodel, and costs 8–18% more. Full covers new construction or a major/gut renovation, and costs 15–30% more — both reflecting the greater volume of dust and debris.' },
      { q: 'Does post-construction cleaning remove paint splatter from windows?', a: 'The window cleaning add-on ($60–$90) specifically removes paint overspray and construction film/stickers from glass — a standard clean doesn\'t include this level of detail.' },
      { q: 'Will the cleaning crew haul away construction debris?', a: 'Only if you add debris haul-away ($120–$200) — a standard post-construction clean focuses on dust and surface cleanup, not removing leftover building materials.' },
    ],
    relatedSlugs: ['house-cleaning-cost', 'air-duct-cleaning-cost'],
  },
];

export function getAllServices() {
  return SERVICES;
}

export function getServiceBySlug(slug) {
  return SERVICES.find(s => s.slug === slug) || null;
}

export function getServiceById(id) {
  return SERVICES.find(s => s.id === id) || null;
}

export function getRelatedServices(service) {
  return (service.relatedSlugs || [])
    .map(slug => SERVICES.find(s => s.slug === slug))
    .filter(Boolean);
}

// The "typical job" headline number for a service — one representative tier
// (or per-sqft/per-room tier x typical quantity, x typical monthly visits for
// commercial) used as the big price at the top of a service page and in the
// homepage service cards.
export function typicalCost(service) {
  const tier = service.tiers[service.typicalTierIndex] || service.tiers[0];
  if (service.unitType === 'flat') return { low: tier.low, high: tier.high };
  const qty = (service.typicalQuantity || 1) * (service.typicalVisitsPerMonth || 1);
  return { low: Math.round(tier.low * qty), high: Math.round(tier.high * qty) };
}
