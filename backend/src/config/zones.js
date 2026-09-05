// S-TRAH is one core with per-zone configuration, not a separate app per zone.
// A zone bundles the suburbs it covers and the languages that zone's pilot
// researches, so adding a third zone is a config change rather than a rewrite.
//
// The language lists come from the local Census language environment for each
// pilot area. They are NOT verified NDIS participant-language statistics and
// must not be presented as such.
const ZONES = [
  {
    id: 'fairfield',
    label: 'Fairfield, NSW',
    state: 'NSW',
    suburbs: ['Fairfield', 'Cabramatta', 'Canley Vale', 'Smithfield', 'Villawood', 'Bonnyrigg', 'Lakemba'],
    languages: ['en', 'vi', 'ar'],
  },
  {
    id: 'gosnells',
    label: 'Gosnells, WA',
    state: 'WA',
    suburbs: ['Gosnells', 'Thornlie', 'Maddington', 'Huntingdale', 'Southern River', 'Canning Vale'],
    languages: ['en', 'zh', 'pa'],
  },
];

const ZONE_IDS = ZONES.map((zone) => zone.id);

function getZone(zoneId) {
  return ZONES.find((zone) => zone.id === zoneId) || null;
}

// Used to place a provider or participant into a zone from their stated suburb.
function findZoneForLocation(location) {
  const value = String(location || '').trim().toLowerCase();
  if (!value) return null;

  return (
    ZONES.find((zone) => zone.suburbs.some((suburb) => value.includes(suburb.toLowerCase()))) || null
  );
}

module.exports = { ZONES, ZONE_IDS, findZoneForLocation, getZone };
