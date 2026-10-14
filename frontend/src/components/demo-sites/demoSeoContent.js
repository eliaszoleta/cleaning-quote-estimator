// Content engine for the demo sites' dedicated per-service and per-city
// pages -- mirrors the real client sites' seo-content.ts (unique meta
// title/description/H1/intro/FAQs per URL, not one combined listing page).
// Ten businesses x ~5 services x ~5 cities is too much to hand-author one
// page at a time, so instead of a single fixed prose block per page, each
// page is assembled from a service-type (or city-flavor) content block plus
// this business's own name/city/tagline/services -- every title, meta
// description, H1, and FAQ answer is still unique per URL, just built from
// reusable parts instead of typed out ~100 separate times.
import IMAGE_POOL, { imagePath } from './demoImagePool';

export function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function serviceSlugFor(service) {
  return slugify(service.title);
}

export function areaSlugFor(area) {
  return slugify(area);
}

// --- Service-type content library --------------------------------------
// Keyed by normalized title. Covers every service title used across
// siteConfigs.js; a keyword fallback below catches anything new.
const SERVICE_TYPES = {
  'standard cleaning': 'standard',
  'standard home cleaning': 'standard',
  'signature cleaning': 'standard',
  'deep cleaning': 'deep',
  'deep clean': 'deep',
  'move-in / move-out': 'moveinout',
  'move-out cleaning': 'moveout',
  'recurring service': 'recurring',
  'recurring maintenance': 'recurring',
  'recurring visits': 'recurring',
  'recurring concierge service': 'recurring',
  'eco-friendly add-on': 'ecofriendly',
  'vacation rental turnover': 'vacationrental',
  'vacation rental cleaning': 'vacationrental',
  'airbnb turnover': 'vacationrental',
  'commercial cleaning': 'commercial',
  'post-construction cleanup': 'postconstruction',
  'post-renovation cleanup': 'postconstruction',
  'historic home cleaning': 'historic',
  'window & carpet add-ons': 'windowcarpet',
  'post-event cleanup': 'postevent',
  'farmhouse & outbuilding cleaning': 'farmhouse',
};

function typeFor(service) {
  const key = service.title.toLowerCase();
  if (SERVICE_TYPES[key]) return SERVICE_TYPES[key];
  if (key.includes('deep')) return 'deep';
  if (key.includes('move-out') || key.includes('move out')) return 'moveout';
  if (key.includes('move')) return 'moveinout';
  if (key.includes('recurring')) return 'recurring';
  if (key.includes('eco')) return 'ecofriendly';
  if (key.includes('vacation') || key.includes('airbnb') || key.includes('turnover')) return 'vacationrental';
  if (key.includes('commercial') || key.includes('office')) return 'commercial';
  if (key.includes('construction') || key.includes('renovation')) return 'postconstruction';
  if (key.includes('historic')) return 'historic';
  if (key.includes('window') || key.includes('carpet')) return 'windowcarpet';
  if (key.includes('event')) return 'postevent';
  if (key.includes('farmhouse') || key.includes('barn')) return 'farmhouse';
  return 'standard';
}

const TYPE_LIBRARY = {
  standard: {
    blurb: 'a reliable, detail-checked clean for the rooms you use every day',
    idealFor: ['Busy households who want a consistently clean home without doing it themselves', 'Anyone who wants the same room-by-room checklist followed on every visit', 'First-time clients who want to see the quality before committing to a schedule'],
    included: [
      { area: 'Kitchen', tasks: ['Counters, backsplash & outside of appliances wiped down', 'Sink scrubbed & faucet polished', 'Floors swept and mopped'] },
      { area: 'Bathrooms', tasks: ['Toilet, tub/shower & sink sanitized', 'Mirrors & fixtures polished', 'Floors cleaned and trash emptied'] },
      { area: 'Living & Bedrooms', tasks: ['Dusting of all reachable surfaces', 'Vacuuming carpets & rugs, mopping hard floors', 'Beds made, surfaces tidied'] },
    ],
    whyExtra: { title: 'A Checklist, Not Guesswork', text: 'Every visit follows the same written checklist, so the clean you get on your first visit is the clean you get on your fiftieth.' },
    faqs: [
      { q: 'What does a standard cleaning in {area} include?', a: 'Kitchens, bathrooms, and living spaces are cleaned top to bottom -- counters, floors, bathrooms, dusting, and vacuuming. Ask about add-ons like inside the fridge or oven if you want extra attention in a specific room.' },
      { q: 'How long does a standard cleaning take?', a: 'Most homes in {area} take between 1.5 and 3 hours, depending on size and how recently the home was last cleaned.' },
      { q: 'Can I book a one-time standard cleaning, or does it have to be recurring?', a: "Either one. Plenty of {business} clients in {area} start with a single visit and decide from there whether they'd like to set up a regular schedule." },
      { q: 'Do you bring cleaning supplies?', a: "Yes -- we bring everything needed for a standard visit. If you'd prefer we use products you already have on hand, just let us know when you book." },
    ],
  },
  deep: {
    blurb: 'a top-to-bottom reset for the spots everyday cleaning skips',
    idealFor: ['Homes that haven\'t had a professional clean in a while', 'Anyone prepping for guests, a holiday, or a big event', 'Clients switching to recurring service who want to start from a true clean slate'],
    included: [
      { area: 'Kitchen', tasks: ['Inside of microwave cleaned', 'Baseboards & cabinet fronts wiped down', 'Appliance exteriors detailed'] },
      { area: 'Bathrooms', tasks: ['Grout & tile given extra attention', 'Fixtures descaled', 'Baseboards & door frames wiped'] },
      { area: 'Whole Home', tasks: ['Baseboards, door frames & light switch plates wiped', 'Vents and ceiling fans dusted', 'Window sills cleaned'] },
    ],
    whyExtra: { title: 'The Spots Everyday Cleaning Skips', text: 'Baseboards, vents, ceiling fans, light switch plates -- a deep clean works through the list of places a weekly clean never gets to.' },
    faqs: [
      { q: 'How is a deep cleaning different from a standard cleaning in {area}?', a: 'A deep clean adds baseboards, vents, ceiling fans, light switch plates, and more detailed kitchen and bathroom work on top of everything in a standard visit. Most {business} clients book one before starting a recurring schedule.' },
      { q: 'How long does a deep cleaning take?', a: 'Plan for 3 to 6 hours depending on the size of the home and how long it\'s been since the last professional clean.' },
      { q: 'Do I need a deep cleaning before switching to recurring service?', a: "It's not required, but most {business} clients in {area} find it's the best way to start -- the maintenance visits after that have a true clean baseline to keep up." },
      { q: 'What should I do to prepare?', a: 'Just clear any clutter from counters and floors beforehand -- the team handles everything else, including furniture and appliances that need to be moved for a full clean.' },
    ],
  },
  moveinout: {
    blurb: 'a spotless handoff, whether you\'re arriving or leaving',
    idealFor: ['Renters closing out a lease and wanting their deposit back', 'Homeowners preparing to list or hand over a property', 'Anyone moving into a space and wanting it cleaned before furniture arrives'],
    included: [
      { area: 'Kitchen', tasks: ['Inside & outside of cabinets and drawers', 'Inside of oven, fridge & microwave', 'Counters, backsplash & floors detailed'] },
      { area: 'Bathrooms', tasks: ['Full fixture, tile & grout detail', 'Cabinets and drawers wiped inside and out', 'Mirrors, floors & baseboards cleaned'] },
      { area: 'Closets & Storage', tasks: ['Shelving wiped down', 'Floors vacuumed/swept', 'Light fixtures dusted'] },
    ],
    whyExtra: { title: 'Built for Deposits & Deadlines', text: "We know move-out cleanings come with a deadline attached -- a closing date, a lease-end inspection, a new tenant's move-in day. We schedule to fit it." },
    faqs: [
      { q: 'Will this help me get my deposit back?', a: "A thorough move-out clean is one of the most common reasons landlords in {area} release a full deposit. We clean inside cabinets, appliances, and fixtures -- the detail most landlords check first." },
      { q: 'Do you clean empty homes, or do you need furniture moved first?', a: "Either works. An empty home actually lets us get into corners and closets faster, but we're glad to work around furniture if you're not fully moved out yet." },
      { q: 'How far in advance should I book in {area}?', a: 'Move dates are tight, so we recommend booking as soon as you have a date -- but reach out even on short notice and we\'ll do what we can.' },
      { q: 'Is a move-in cleaning different from move-out?', a: 'Scope-wise, no -- both get the same top-to-bottom detail. The only difference is timing: move-in cleanings happen before your furniture arrives.' },
    ],
  },
  moveout: {
    blurb: 'a deposit-ready clean for your next chapter',
    idealFor: ['Renters who want their full deposit back', 'Landlords turning over a unit between tenants', 'Anyone closing on a home sale and handing over the keys'],
    included: [
      { area: 'Kitchen', tasks: ['Inside of oven, fridge & cabinets', 'Counters & backsplash detailed', 'Floors deep cleaned'] },
      { area: 'Bathrooms', tasks: ['Fixtures, tile & grout detailed', 'Cabinets wiped inside and out', 'Floors & baseboards cleaned'] },
      { area: 'Whole Unit', tasks: ['Closets & storage wiped down', 'Baseboards & door frames cleaned', 'Light fixtures and switch plates dusted'] },
    ],
    whyExtra: { title: 'What Landlords Actually Check', text: "Inside cabinets, inside the fridge, inside the oven -- the exact spots most move-out inspections focus on get full attention, not a quick pass." },
    faqs: [
      { q: 'What\'s included in a move-out cleaning in {area}?', a: 'Everything inside cabinets, the fridge, and the oven, plus full detail on bathrooms, floors, and baseboards -- the spots a landlord or new tenant notices first.' },
      { q: 'How soon can you schedule a move-out clean?', a: "We know move dates don't leave much room -- reach out with your date and we'll do our best to fit {area} into the schedule, even on short notice." },
      { q: 'Do you clean carpets as part of a move-out?', a: 'Standard move-out cleaning covers vacuuming, not deep carpet shampooing. Ask about adding a carpet cleaning if your lease requires it.' },
      { q: 'Can I book this for an empty apartment?', a: 'Yes -- an empty unit is actually the easiest to clean thoroughly, since there\'s nothing in the way.' },
    ],
  },
  recurring: {
    blurb: 'the same trusted team, on a schedule that fits your life',
    idealFor: ['Households who want a consistently clean home without thinking about it', 'Anyone who prefers seeing the same familiar cleaner each visit', 'Busy families or professionals short on time for regular upkeep'],
    included: [
      { area: 'Every Visit', tasks: ['Kitchens & bathrooms fully cleaned', 'Floors vacuumed and mopped', 'Living spaces dusted & tidied'] },
      { area: 'Rotating Detail', tasks: ['Baseboards or vents on a rotating basis', 'Inside microwave or appliance fronts', 'Extra attention to any area you flag'] },
      { area: 'Scheduling', tasks: ['Weekly, bi-weekly, or monthly visits', 'Easy rescheduling by text', 'Same cleaner when possible'] },
    ],
    whyExtra: { title: 'Consistency, Visit After Visit', text: "You'll usually see the same cleaner each time, working from the same checklist -- so the home you come back to looks the same way every visit, not just the first one." },
    faqs: [
      { q: 'How often can I schedule recurring cleaning in {area}?', a: 'Weekly, bi-weekly, or monthly -- most {business} clients in {area} start bi-weekly and adjust from there based on their household.' },
      { q: 'Will I get the same cleaner every time?', a: 'We do our best to keep the same cleaner on your account for every visit, so they get to know your home and your preferences.' },
      { q: 'Can I pause or reschedule a visit?', a: 'Yes -- a text is usually all it takes to reschedule or skip a visit for a given week.' },
      { q: 'Is there a contract?', a: "No long-term contract -- recurring service continues until you ask us to pause or stop, and you can adjust frequency any time." },
    ],
  },
  ecofriendly: {
    blurb: 'the same detail, with fragrance-free and pet-safe products',
    idealFor: ['Households with kids, pets, or sensitivities to fragrance', 'Anyone who prefers plant-based products over harsh chemicals', 'Clients who want the option without giving up any cleaning quality'],
    included: [
      { area: 'Products', tasks: ['Fragrance-free, plant-based cleaners on request', 'No bleach or harsh chemical residue', 'Pet- and kid-safe formulas throughout'] },
      { area: 'Same Standard', tasks: ['Identical room-by-room checklist as a standard visit', 'No reduction in scrubbing or detail', 'Available on any visit type'] },
      { area: 'Flexibility', tasks: ['Use your own supplies if you prefer', 'Mix and match rooms if needed', 'No extra booking steps'] },
    ],
    whyExtra: { title: 'Gentler Ingredients, Same Detail', text: "Choosing eco-friendly products doesn't mean a lighter clean -- it's the same checklist and attention to detail, just without the fumes or residue." },
    faqs: [
      { q: 'Does eco-friendly cleaning cost extra?', a: "It's available as a simple add-on at booking -- ask when you request your quote in {area} and we'll confirm pricing." },
      { q: 'Are the products actually safe for pets and kids?', a: 'Yes -- we use fragrance-free, plant-based products specifically because they\'re safe around kids and pets once surfaces are dry.' },
      { q: 'Can I supply my own products instead?', a: "Absolutely. If you have products you'd prefer we use, just let us know when you book and we'll work with what you have on hand." },
      { q: 'Will my home still feel as clean?', a: "Yes -- eco-friendly products clean just as effectively, they just skip the harsh fumes and synthetic fragrance." },
    ],
  },
  vacationrental: {
    blurb: 'fast, guest-ready turnovers between every booking',
    idealFor: ['Short-term rental hosts with tight turnover windows', 'Property managers juggling multiple listings', 'Anyone who needs a reliable inspection before the next guest checks in'],
    included: [
      { area: 'Reset', tasks: ['Linens changed & beds remade to hotel standard', 'Bathrooms & kitchen fully sanitized', 'Trash removed, surfaces reset for photos'] },
      { area: 'Inspection', tasks: ['Walkthrough before every check-in', 'Supplies restocked (towels, toiletries, paper goods)', 'Damage or maintenance issues flagged'] },
      { area: 'Scheduling', tasks: ['Same-day turnovers available', 'Coordinated directly with your booking calendar', 'Rush turnovers for back-to-back bookings'] },
    ],
    whyExtra: { title: 'Built Around Your Booking Calendar', text: "Guest turnovers don't wait -- we coordinate directly with your checkout and check-in times so the unit is guest-ready, inspected, and photo-ready before the next booking." },
    faqs: [
      { q: 'Can you turn a unit around the same day as checkout?', a: 'Yes -- same-day turnovers are exactly what this service is built for. Let us know your typical checkout/check-in window in {area} and we\'ll build a plan around it.' },
      { q: 'Do you restock supplies like toilet paper and towels?', a: 'Yes, restocking is included -- just keep us supplied with extras and we\'ll make sure each turnover leaves the unit guest-ready.' },
      { q: 'What happens if you find damage or a maintenance issue?', a: "We flag it immediately with photos so you can handle it before the next guest arrives, rather than finding out from a bad review." },
      { q: 'Can you manage multiple listings in {area}?', a: 'Yes -- several of our clients are property managers with multiple units across {area}, all coordinated on one schedule.' },
    ],
  },
  commercial: {
    blurb: 'offices and storefronts cleaned before or after business hours',
    idealFor: ['Small offices wanting a consistently clean workspace', 'Storefronts needing cleaning outside business hours', 'Businesses that want one point of contact instead of managing in-house cleaning'],
    included: [
      { area: 'Workspaces', tasks: ['Desks, common surfaces & high-touch points wiped', 'Trash & recycling emptied', 'Floors vacuumed and mopped'] },
      { area: 'Restrooms & Kitchens', tasks: ['Restrooms fully sanitized & restocked', 'Breakroom/kitchen surfaces cleaned', 'Dishes and countertops reset'] },
      { area: 'Scheduling', tasks: ['Before or after business hours', 'Weekly or custom frequency', 'One contact for billing & scheduling'] },
    ],
    whyExtra: { title: 'Scheduled Around Your Business, Not Ours', text: "Cleaning happens before open or after close so it never disrupts a workday -- your team shows up to a clean space without ever seeing it happen." },
    faqs: [
      { q: 'What size spaces do you clean in {area}?', a: "From single-office suites to larger storefronts -- tell us your square footage and typical layout and we'll put together a quote." },
      { q: 'Can you clean outside of business hours?', a: 'Yes -- most commercial clients prefer before-open or after-close cleaning, and we schedule around whatever works for your team.' },
      { q: 'Is there a minimum contract length?', a: "No long-term contract required. We'll set a frequency that fits your space and you can adjust it any time." },
      { q: 'Do you provide your own supplies and equipment?', a: 'Yes, we bring everything needed for a commercial visit, including restroom restocking supplies on request.' },
    ],
  },
  postconstruction: {
    blurb: 'fine dust and debris cleared after the crew leaves',
    idealFor: ['Homeowners finishing a remodel or renovation', 'Contractors who want a clean handoff to the client', 'New-build homes needing a final clean before move-in'],
    included: [
      { area: 'Dust Removal', tasks: ['Fine construction dust removed from every surface', 'Vents & light fixtures wiped down', 'Floors swept, vacuumed & mopped'] },
      { area: 'Detail Work', tasks: ['Windows & window tracks cleaned of residue', 'Cabinets & countertops wiped inside and out', 'Fixtures polished and debris cleared'] },
      { area: 'Final Pass', tasks: ['Touch-up pass once dust has fully settled', 'Trash & leftover materials removed', 'Move-in ready walkthrough'] },
    ],
    whyExtra: { title: 'Built for the Mess Renovations Leave Behind', text: 'Construction dust gets into places a normal clean never has to deal with -- window tracks, vents, inside cabinets. We clean specifically for that.' },
    faqs: [
      { q: 'How soon after construction finishes should I book?', a: 'Right after the crew clears out is ideal -- dust settles into more surfaces the longer it sits. We can often schedule in {area} within a few days.' },
      { q: 'Do you remove leftover construction debris?', a: "We clear dust and light debris as part of the clean. Larger construction waste removal is usually handled by the contractor beforehand." },
      { q: 'Will one visit be enough?', a: "Most projects need one thorough pass, with a quick touch-up a day or two later once any remaining dust has settled -- we'll recommend what your project needs." },
      { q: 'Can you clean a home that isn\'t fully finished yet?', a: 'We can work around an in-progress space, though a full post-construction clean works best once the major work is done.' },
    ],
  },
  historic: {
    blurb: 'specialized, gentle care for original woodwork and antique finishes',
    idealFor: ['Owners of older or historic homes with original finishes', 'Anyone worried standard products might damage antique surfaces', 'Buyers of a historic property wanting a baseline, careful first clean'],
    included: [
      { area: 'Original Woodwork', tasks: ['Gentle, finish-safe products on trim & millwork', 'Hand-dusting instead of harsh scrubbing', 'Hardware polished without stripping patina'] },
      { area: 'Plaster & Delicate Surfaces', tasks: ['Careful dusting of plaster walls & ceilings', 'No high-pressure or abrasive techniques', 'Extra attention around original fixtures'] },
      { area: 'Everyday Rooms', tasks: ['Kitchens & bathrooms cleaned to the same standard', 'Floors cleaned appropriately for their material', 'Living spaces dusted and tidied'] },
    ],
    whyExtra: { title: 'Trained for Older Homes, Not Just New Ones', text: 'Original hardwood, plaster walls, antique hardware -- our team knows the difference between a surface that needs gentle care and one that can take a standard clean.' },
    faqs: [
      { q: 'Will you use the right products for an older home?', a: 'Yes -- we use finish-safe, non-abrasive products on original woodwork, plaster, and antique hardware rather than standard harsh cleaners.' },
      { q: 'Is historic home cleaning more expensive?', a: 'Pricing is based on the home\'s size and condition like any visit -- extra care on delicate surfaces doesn\'t change the basic rate.' },
      { q: 'Can you clean just the historic parts of my home?', a: 'Of course -- tell us which rooms or surfaces need extra care and we\'ll build the visit around that.' },
      { q: 'Do you work on historic properties elsewhere in {area}?', a: "Yes, we regularly clean historic and older homes throughout {area} and the surrounding neighborhoods." },
    ],
  },
  windowcarpet: {
    blurb: 'interior windows and carpet spot-cleaning, added to any visit',
    idealFor: ['Anyone wanting streak-free interior windows alongside a regular clean', 'Households with light carpet stains needing spot treatment', 'Clients who want one visit to cover more than a standard clean'],
    included: [
      { area: 'Windows', tasks: ['Interior glass cleaned streak-free', 'Sills & tracks wiped down', 'Screens dusted where accessible'] },
      { area: 'Carpets', tasks: ['Spot treatment on visible stains', 'High-traffic areas vacuumed thoroughly', 'Light deodorizing on request'] },
      { area: 'Add to Any Visit', tasks: ['Bundled with standard or deep cleaning', 'No separate appointment needed', 'Priced per room or per window'] },
    ],
    whyExtra: { title: 'One Visit, More Covered', text: "No need to book a separate appointment -- windows and carpet spot-cleaning are added right onto your regular visit." },
    faqs: [
      { q: 'Does this cover exterior windows too?', a: 'This add-on covers interior glass, sills, and tracks. Ask about exterior windows separately if you need those cleaned as well.' },
      { q: 'Can carpet spot-cleaning remove any stain?', a: "Spot treatment works well on most surface stains, but set-in or older stains may need a dedicated deep-carpet service for full removal." },
      { q: 'Do I need to book a separate appointment in {area}?', a: 'No -- this add-on is bundled right into your standard or deep cleaning visit, same appointment.' },
      { q: 'Is this available on recurring visits?', a: 'Yes -- you can add windows or carpet spot-cleaning to any single visit on a recurring schedule, not just a one-time clean.' },
    ],
  },
  postevent: {
    blurb: 'same-night or next-morning cleanup after hosting',
    idealFor: ['Anyone hosting a party, holiday gathering, or celebration', 'Hosts who want their home back to normal without the morning-after work', 'Short-notice cleanups the day of or right after an event'],
    included: [
      { area: 'Reset', tasks: ['Dishes, glassware & serving pieces cleared', 'Trash & recycling removed', 'Surfaces wiped and floors cleaned'] },
      { area: 'Deep Spots', tasks: ['Spills spot-cleaned from floors & carpets', 'Bathrooms reset after heavy guest use', 'Kitchen cleaned top to bottom'] },
      { area: 'Timing', tasks: ['Same-night cleanup available', 'Next-morning option if you\'d rather wait', 'Flexible booking around your event end time'] },
    ],
    whyExtra: { title: 'Timed Around Your Event, Not a Standard Schedule', text: 'Hosting runs late or ends early -- we work around your actual event timeline instead of a fixed appointment window.' },
    faqs: [
      { q: 'Can you clean the same night as the event?', a: 'Yes -- same-night cleanup is available in {area}; just give us a heads-up on your expected end time.' },
      { q: 'What if the party runs later than planned?', a: "We build in flexibility around event end times -- let us know if your timeline shifts and we'll adjust." },
      { q: 'Do you handle spills on carpet or upholstery?', a: 'Spot treatment on spills is included. Heavier stains may need a dedicated carpet cleaning service as a follow-up.' },
      { q: 'Can I book this as a one-time service?', a: "Absolutely -- post-event cleanup doesn't require any ongoing schedule, just a one-time booking around your event." },
    ],
  },
  farmhouse: {
    blurb: 'a regional specialty covering barns, mudrooms, and larger properties',
    idealFor: ['Rural and larger properties with outbuildings', 'Households with mudrooms and heavy foot traffic', 'Anyone who wants one team covering both the house and outbuildings'],
    included: [
      { area: 'Main House', tasks: ['Full kitchen, bathroom & living space clean', 'Mudroom & entryways given extra attention', 'Floors cleaned for heavy foot traffic'] },
      { area: 'Outbuildings', tasks: ['Barns, sheds & outbuildings swept and tidied', 'Cobwebs and dust cleared', 'Surfaces wiped where applicable'] },
      { area: 'Scheduling', tasks: ['One visit covers house & outbuildings', 'Flexible for larger or spread-out properties', 'Recurring or one-time available'] },
    ],
    whyExtra: { title: 'One Team for the Whole Property', text: "Larger and rural properties don't fit a standard checklist -- we scope the visit around your actual layout, house and outbuildings together." },
    faqs: [
      { q: 'Do you clean outbuildings as well as the house?', a: 'Yes -- barns, sheds, and other outbuildings can be included alongside the main house in a single visit.' },
      { q: 'Is pricing different for larger rural properties in {area}?', a: "Pricing is based on the actual size and scope of the property, so a larger or spread-out layout is quoted accordingly -- just describe your property when you request a quote." },
      { q: 'Can you handle heavy mudroom or entryway traffic?', a: 'Yes -- mudrooms and entryways get extra attention given how much traffic they typically see on a working property.' },
      { q: 'Do you offer recurring visits for larger properties?', a: 'Yes -- weekly, bi-weekly, or monthly visits are all available, scoped to the size of your property.' },
    ],
  },
};

function interpolate(str, vars) {
  return str.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? '');
}

export function getServicePageList(site) {
  return site.services.map((service) => ({ ...service, slug: serviceSlugFor(service) }));
}

export function getServicePageContent(site, slug) {
  const service = site.services.find((s) => serviceSlugFor(s) === slug);
  if (!service) return null;
  const type = TYPE_LIBRARY[typeFor(service)];
  const vars = { business: site.businessName, city: site.city, state: site.state, area: site.city, service: service.title.toLowerCase() };

  return {
    slug,
    name: service.title,
    desc: service.desc,
    metaTitle: `${service.title} in ${site.city}, ${site.state} | ${site.businessName}`,
    metaDescription: `${service.title} in ${site.city}, ${site.state} from ${site.businessName} -- ${type.blurb}. Background-checked cleaners, upfront pricing. Get a free quote.`,
    h1: `${service.title} in ${site.city}, ${site.state}`,
    intro: [
      `${service.desc} ${site.businessName} brings ${type.blurb} to every ${service.title.toLowerCase()} visit across ${site.city} and the surrounding area.`,
      `Every visit follows the same written checklist, uses background-checked cleaners, and comes with upfront pricing before we ever walk in the door.`,
    ],
    idealFor: type.idealFor,
    included: type.included,
    whyUs: [
      { title: `Why ${site.city} Trusts ${site.businessName}`, text: `${site.tagline} Every cleaner is background-checked, insured, and trained on the same checklist for every ${service.title.toLowerCase()} visit.` },
      { title: interpolate(type.whyExtra.title, vars), text: interpolate(type.whyExtra.text, vars) },
    ],
    faqs: type.faqs.map((f) => ({ q: interpolate(f.q, vars), a: interpolate(f.a, vars) })),
    image: imagePath(IMAGE_POOL[(slugHash(slug) + slugHash(site.slug)) % IMAGE_POOL.length].file),
  };
}

function slugHash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 97;
  return h;
}

// --- Area-flavor content library ----------------------------------------
const AREA_FLAVORS = [
  { title: 'Older Homes & Original Character', text: 'Plenty of homes here were built decades ago, with original hardwood, plaster walls, and finishes that need a gentler touch than new construction.' },
  { title: 'Condos & High-Rises', text: 'Building access, elevators, and HOA scheduling windows are part of daily life here -- we coordinate around building rules rather than treating every address the same.' },
  { title: 'Family Homes & Busy Schedules', text: 'Between school runs and after-work hours, regular cleaning is often the first thing that gets pushed off -- a standing visit takes it off the list for good.' },
  { title: 'New Construction & Open Floor Plans', text: 'Newer builds here tend to mean bigger open living spaces and more glass -- great light, more surface area to keep streak-free.' },
  { title: 'Coastal & Humidity-Prone Homes', text: 'Salt air and humidity mean bathrooms and kitchens need more frequent attention to stay ahead of mildew and buildup.' },
  { title: 'Townhomes & Shared Walls', text: 'Multi-level townhomes mean more stairs and more floor types in one visit -- hardwood, carpet, and tile often in the same home.' },
  { title: 'Short-Term Rentals & Turnovers', text: 'A number of properties in this area operate as short-term rentals, with turnover timing as tight as same-day.' },
  { title: 'Larger Lots & Rural Properties', text: 'Homes with more square footage and more outbuildings need a visit scoped to the actual property, not a one-size checklist.' },
];

function areaFlavorsFor(area, site) {
  const h = slugHash(area + site.slug);
  const a = AREA_FLAVORS[h % AREA_FLAVORS.length];
  const b = AREA_FLAVORS[(h + 3) % AREA_FLAVORS.length];
  return a === b ? [a, AREA_FLAVORS[(h + 5) % AREA_FLAVORS.length]] : [a, b];
}

export function getAreaPageList(site) {
  return site.serviceAreas.map((area) => ({ area, slug: areaSlugFor(area) }));
}

export function getAreaPageContent(site, slug) {
  const area = site.serviceAreas.find((a) => areaSlugFor(a) === slug);
  if (!area) return null;
  const flavors = areaFlavorsFor(area, site);
  const nearby = site.serviceAreas.filter((a) => a !== area).slice(0, 4);

  return {
    slug,
    area,
    metaTitle: `House Cleaning in ${area}, ${site.state} | ${site.businessName}`,
    metaDescription: `${site.businessName} provides house cleaning in ${area}, ${site.state} -- standard, deep, move-out, and recurring visits. Background-checked cleaners, upfront pricing. Free quote.`,
    h1: `House Cleaning in ${area}, ${site.state}`,
    intro: [
      `${site.businessName} is proud to serve ${area} as part of our coverage across greater ${site.city}. Whether you need a one-time deep clean or a standing weekly visit, our background-checked team brings the same checklist and upfront pricing to every home in ${area}.`,
      flavors[0].text,
    ],
    localNotes: flavors,
    services: site.services.map((s) => ({ title: s.title, slug: serviceSlugFor(s) })),
    nearby,
    faqs: [
      { q: `Does ${site.businessName} serve all of ${area}?`, a: `Yes -- ${area} is fully within our regular service area, alongside ${nearby.slice(0, 2).join(' and ') || 'nearby communities'}.` },
      { q: `How much does house cleaning cost in ${area}?`, a: `Pricing depends on home size, condition, and how often you'd like visits. Request a free quote and we'll give you an upfront price before booking.` },
      { q: `How quickly can I get on the schedule in ${area}?`, a: `Most first appointments in ${area} are available within a few days of booking -- reach out and we'll find the soonest slot that works.` },
      { q: `Do you offer one-time cleanings in ${area}, or only recurring service?`, a: `Both -- plenty of ${area} clients start with a single visit and decide afterward whether they'd like to set up a regular schedule.` },
    ],
  };
}
