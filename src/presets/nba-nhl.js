// ═══════════════════════════════════════════════
// NBA / NHL SPORT PRESET — stub
// ═══════════════════════════════════════════════

const SCHEDULE_PRESET = {
  sport:        'nba-nhl',
  homeGames:    41,
  activeMonths: [9, 10, 11, 12, 0, 1, 2, 3],  // Oct–Apr (0-indexed)

  // Stubs — fill in at first NBA/NHL client build
  TIER_ATTENDANCE:      null,
  FNB_TIER_BASE_PERCAP: null,
  SEASONALITY:          null,
  ARR_SEASONAL:         null,
  STM_NS_MONTHLY:       null,
  seriesShape:          '{ start, opp, conf, division, tier, promo, promoLabel }',

  dayTypeClassifier(dateStr, seriesTier, gameIndex, openingDate) {
    return 'weeknight';
  },
};

if (typeof module !== 'undefined') module.exports = SCHEDULE_PRESET;
