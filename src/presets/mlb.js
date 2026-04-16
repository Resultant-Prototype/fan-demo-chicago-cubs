// ═══════════════════════════════════════════════
// MLB SPORT PRESET
// ═══════════════════════════════════════════════

const SCHEDULE_PRESET = {
  sport:      'mlb',
  homeGames:  81,
  activeMonths: [2, 3, 4, 5, 6, 7, 8],  // Mar–Sep (0-indexed)

  // Attendance ceiling by game tier
  TIER_ATTENDANCE: { featured: 39200, select: 33500, standard: 27500 },

  // FnB per-cap base by tier
  FNB_TIER_BASE_PERCAP: { featured: 25.50, select: 22.80, standard: 19.40 },

  // Seasonality index per month (0=Jan...11=Dec); zeros = off-season
  SEASONALITY: [0, 0, 0.88, 0.82, 0.88, 0.94, 1.00, 0.97, 0.91, 0, 0, 0],

  // Arrival shift deltas by month [90+min, 60–90, 30–60, 0–30]
  ARR_SEASONAL: [
    [ 0.00, 0.00, 0.00, 0.00],  // Jan (off)
    [ 0.00, 0.00, 0.00, 0.00],  // Feb (off)
    [ 0.07, 0.04,-0.04,-0.05],  // Mar — Opening Day excitement
    [ 0.04, 0.02,-0.02,-0.03],  // Apr — early season energy
    [ 0.00, 0.00, 0.00, 0.00],  // May — baseline
    [-0.01, 0.00, 0.01, 0.01],  // Jun — warming, slight late shift
    [-0.05,-0.03, 0.04, 0.04],  // Jul — summer heat, delayed arrivals
    [-0.06,-0.04, 0.05, 0.04],  // Aug — peak heat
    [ 0.02, 0.01,-0.01,-0.02],  // Sep — playoff race, fans arrive early
    [ 0.00, 0.00, 0.00, 0.00],  // Oct
    [ 0.00, 0.00, 0.00, 0.00],  // Nov
    [ 0.00, 0.00, 0.00, 0.00],  // Dec
  ],

  // Monthly STM no-show rate base (summer vacation + heat)
  STM_NS_MONTHLY: [0, 0, 0.018, 0.020, 0.026, 0.038, 0.060, 0.072, 0.044, 0, 0, 0],

  // Series entry shape for SERIES_SCHEDULE in client-config.js
  // { start: 'YYYY-MM-DD', opp: string, lg: 'AL'|'NL', rival: bool,
  //   n: number, tier: 'featured'|'select'|'standard',
  //   promo: 'giveaway'|'theme_night'|null, promoLabel: string|null }
  seriesShape: '{ start, opp, lg, rival, n, tier, promo, promoLabel }',

  // Classifies a game's day_type based on date, series tier, and game index
  dayTypeClassifier(dateStr, seriesTier, gameIndex, openingDate) {
    const d = new Date(dateStr + 'T12:00:00');
    const dow = d.getDay(); // 0=Sun
    if (dateStr === openingDate) return 'day_game';
    if (dow === 0 || dow === 5 || dow === 6) return 'weekend_friday';
    if (gameIndex === 0 && dow >= 1 && dow <= 3 && seriesTier === 'standard') return 'day_game';
    return 'weeknight';
  },
};

// Build.js requires this; browser ignores the guard
if (typeof module !== 'undefined') module.exports = SCHEDULE_PRESET;
