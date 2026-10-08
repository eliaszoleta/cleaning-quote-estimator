// Shared pool of real stock interior photos reused across the demo sites
// (see siteConfigs.js for the "which site got which image" writeup). Each
// entry's `label` is a generic, no-brand description of the photo itself --
// used to build a per-site, per-service caption without needing to hand-write
// one for every business x image combination.
const IMAGE_POOL = [
  { file: 'open-concept-kitchen-living.jpg', label: 'open-concept kitchen and living area' },
  { file: 'coastal-living-room-ocean-view.jpg', label: 'bright living room with a water view' },
  { file: 'modern-office-conference-room.jpg', label: 'modern office space' },
  { file: 'cozy-bedroom-bookshelf.jpg', label: 'tidy, cozy bedroom' },
  { file: 'modern-bathroom-laundry.jpg', label: 'modern bathroom and laundry area' },
  { file: 'coastal-primary-bedroom.jpg', label: 'bright primary bedroom' },
  { file: 'cream-kitchen-cabinets.jpg', label: 'traditional kitchen' },
  { file: 'spa-bathroom-soaking-tub.jpg', label: 'spa-style bathroom' },
  { file: 'folding-fresh-laundry.jpg', label: 'freshly folded laundry' },
  { file: 'carpet-cleaning-equipment.jpg', label: 'carpet cleaning in progress' },
];

export function imagePath(file) {
  return `/images/demo-stock/${file}`;
}

// Deterministic small int from a slug string, so each business's gallery
// offset is stable across renders without threading an index prop through.
function seedFromSlug(slug) {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) % IMAGE_POOL.length;
  return h;
}

/**
 * Builds a per-site gallery by pairing this site's own services with photos
 * from the shared pool, offset by a hash of the site's slug so neighboring
 * businesses don't get an identical image set.
 */
export function buildGalleryItems(site) {
  const seed = seedFromSlug(site.slug);
  const services = site.services.slice(0, 5);
  return services.map((service, i) => {
    const img = IMAGE_POOL[(seed + i) % IMAGE_POOL.length];
    return {
      id: `${site.slug}-gallery-${i}`,
      title: service.title,
      category: service.title,
      location: `${site.city}, ${site.state}`,
      image: imagePath(img.file),
      alt: `${img.label.charAt(0).toUpperCase() + img.label.slice(1)} after ${service.title.toLowerCase()} in ${site.city}, ${site.state}`,
      description: service.desc,
    };
  });
}

export default IMAGE_POOL;
