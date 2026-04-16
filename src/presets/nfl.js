// ═══════════════════════════════════════════════
// NFL SPORT PRESET — stub
// Fully populated during Kansas City Chiefs build
// ═══════════════════════════════════════════════

const SCHEDULE_PRESET = {
  sport:        'nfl',
  homeGames:    8,       // regular season home games
  preseason:    2,       // preseason home games (optional)
  activeMonths: [8, 9, 10, 11, 12, 0],  // Sep–Jan (0-indexed)

  // Stubs — fill in during Chiefs build
  TIER_ATTENDANCE:      null,
  FNB_TIER_BASE_PERCAP: null,
  SEASONALITY:          null,
  ARR_SEASONAL:         null,
  STM_NS_MONTHLY:       null,
  seriesShape:          '{ start, opp, conf, division, n, tier, promo, promoLabel }',

  dayTypeClassifier(dateStr, seriesTier, gameIndex, openingDate) {
    // NFL: most games are Sunday afternoon; Thursday Night, Monday Night, Saturday exist
    // Stub — implement during Chiefs build
    return 'weeknight';
  },
};

if (typeof module !== 'undefined') module.exports = SCHEDULE_PRESET;
