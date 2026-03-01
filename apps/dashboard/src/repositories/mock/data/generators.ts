/**
 * Mathematical generators for realistic energy time-series data.
 *
 * Each function produces values for a single point in time, parameterized
 * by hour-of-day and day-of-year so callers can sweep across any window.
 */

// ── Helpers ────────────────────────────────────────────────

/** Gaussian (normal) distribution PDF, unnormalized */
function gaussian(x: number, mean: number, sigma: number): number {
  const exponent = -0.5 * ((x - mean) / sigma) ** 2;
  return Math.exp(exponent);
}

/** Seeded pseudo-random noise in range [-1, 1] based on inputs */
function noise(seed1: number, seed2: number, seed3: number): number {
  const x = Math.sin(seed1 * 12.9898 + seed2 * 78.233 + seed3 * 45.164) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
}

/** Clamp value between min and max */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ── Generators ─────────────────────────────────────────────

/**
 * Dual-peak residential/commercial consumption curve.
 *
 * Pattern: base load × night dip + Gaussian morning peak (center=8h, σ=1.5h)
 * + Gaussian evening peak (center=19h, σ=2h) + random noise ±5%.
 *
 * @param hour      Fractional hour of day (0-24)
 * @param baseKw    Base load in kW (varies by site type)
 * @param dayOfYear Day of year (1-366) for seasonal adjustment
 * @returns Power in kW
 */
export function generateConsumptionCurve(
  hour: number,
  baseKw: number,
  dayOfYear: number
): number {
  // Night dip: consumption drops to 40% between midnight and 5am
  const nightDip = hour < 5 ? 0.4 + 0.12 * hour : 1;

  // Morning peak: centered at 8:00, σ=1.5h
  const morningPeak = 0.6 * gaussian(hour, 8, 1.5);

  // Evening peak: centered at 19:00, σ=2h (broader, taller)
  const eveningPeak = 0.8 * gaussian(hour, 19, 2);

  // Seasonal factor: winter uses ~20% more (heating), summer uses ~10% more (cooling)
  // Peak heating around day 15 (Jan 15), peak cooling around day 200 (Jul 19)
  const seasonalFactor =
    1 + 0.15 * Math.cos(((dayOfYear - 15) / 365) * 2 * Math.PI);

  // Deterministic noise ±5%
  const n = noise(hour, dayOfYear, baseKw) * 0.05;

  return baseKw * (nightDip + morningPeak + eveningPeak) * seasonalFactor * (1 + n);
}

/**
 * Solar generation bell curve.
 *
 * Pattern: bell curve centered at solar noon × seasonal factor
 * × (1 - cloudCover). Returns 0 outside sunrise–sunset.
 *
 * @param hour         Fractional hour of day (0-24)
 * @param dayOfYear    Day of year (1-366) for seasonal/daylight adjustment
 * @param capacityKw   Rated panel capacity in kW
 * @returns Power in kW (always >= 0)
 */
export function generateSolarCurve(
  hour: number,
  dayOfYear: number,
  capacityKw: number
): number {
  // No solar before 6am or after 20:00
  if (hour < 6 || hour > 20) return 0;

  // Solar noon bell curve, σ=3h
  const solarBell = gaussian(hour, 13, 3);

  // Seasonal factor: peaks at summer solstice (day 172), minimum at winter solstice
  // Vienna gets ~16h of sun in summer, ~8h in winter
  const seasonalFactor = 0.3 + 0.7 * Math.cos(((dayOfYear - 172) / 365) * 2 * Math.PI);

  // Simulated cloud cover (deterministic, varies through day)
  const cloudNoise = noise(hour * 3.7, dayOfYear * 1.3, capacityKw) * 0.5 + 0.5;
  const cloudCover = clamp(cloudNoise * 0.3, 0, 1); // 0-30% cloud cover

  return Math.max(0, capacityKw * solarBell * seasonalFactor * (1 - cloudCover));
}

/**
 * Battery State of Charge integration.
 *
 * Integrates net power flow (solar - consumption), clamps 0-100%,
 * respects max charge/discharge rate.
 *
 * @param prevSoC         Previous SoC in percent (0-100)
 * @param solarKw         Current solar generation in kW
 * @param consumptionKw   Current consumption in kW
 * @param capacityKwh     Battery capacity in kWh
 * @param maxChargeRateKw Max charge/discharge rate in kW
 * @param intervalHours   Time step in hours
 * @returns New SoC in percent (0-100)
 */
export function generateBatterySoC(
  prevSoC: number,
  solarKw: number,
  consumptionKw: number,
  capacityKwh: number,
  maxChargeRateKw: number,
  intervalHours: number
): number {
  // Net power: positive = excess solar (charge), negative = deficit (discharge)
  const netPowerKw = solarKw - consumptionKw;

  // Clamp to max charge/discharge rate
  const clampedPowerKw = clamp(netPowerKw, -maxChargeRateKw, maxChargeRateKw);

  // Energy delta as percentage of capacity
  const deltaPercent = (clampedPowerKw * intervalHours / capacityKwh) * 100;

  return clamp(prevSoC + deltaPercent, 0, 100);
}

/**
 * Weather data generator.
 *
 * Sinusoidal temperature with daily and seasonal cycles + noise.
 * Derives humidity, wind speed, and solar irradiance.
 *
 * @param hour      Fractional hour of day (0-24)
 * @param dayOfYear Day of year (1-366)
 * @returns Weather data object
 */
export function generateWeatherData(
  hour: number,
  dayOfYear: number
): {
  temperature_c: number;
  humidity_percent: number;
  wind_speed_ms: number;
  solar_irradiance_wm2: number;
  cloud_cover_percent: number;
} {
  // Seasonal base temp: Vienna mean ~10°C, amplitude ±15°C
  // Peak summer around day 200 (Jul 19)
  const seasonalBase =
    10 + 15 * Math.cos(((dayOfYear - 200) / 365) * 2 * Math.PI);

  // Daily cycle: amplitude ±5°C, peak at 14:00
  const dailyCycle = 5 * Math.cos(((hour - 14) / 24) * 2 * Math.PI);

  // Temperature noise ±2°C
  const tempNoise = noise(hour, dayOfYear, 7.77) * 2;

  const temperature_c = seasonalBase + dailyCycle + tempNoise;

  // Humidity: inversely related to temperature, 40-90%
  const humidity_percent = clamp(
    70 - temperature_c * 0.8 + noise(hour, dayOfYear, 3.33) * 10,
    40,
    90
  );

  // Wind: 1-8 m/s with gustiness noise
  const wind_speed_ms = clamp(
    3 + noise(hour * 2, dayOfYear, 5.55) * 3 + Math.abs(noise(hour, dayOfYear, 9.99)) * 2,
    1,
    8
  );

  // Cloud cover: 0-100%, correlates with humidity
  const cloud_cover_percent = clamp(
    (humidity_percent - 40) * 1.5 + noise(hour, dayOfYear, 11.11) * 20,
    0,
    100
  );

  // Solar irradiance: max ~1000 W/m² at noon in summer, reduced by clouds
  const solarBell = hour >= 6 && hour <= 20 ? gaussian(hour, 13, 3) : 0;
  const seasonalIrradiance =
    0.3 + 0.7 * Math.cos(((dayOfYear - 172) / 365) * 2 * Math.PI);
  const solar_irradiance_wm2 = Math.max(
    0,
    1000 * solarBell * seasonalIrradiance * (1 - cloud_cover_percent / 100)
  );

  return {
    temperature_c: Math.round(temperature_c * 10) / 10,
    humidity_percent: Math.round(humidity_percent),
    wind_speed_ms: Math.round(wind_speed_ms * 10) / 10,
    solar_irradiance_wm2: Math.round(solar_irradiance_wm2),
    cloud_cover_percent: Math.round(cloud_cover_percent),
  };
}

/**
 * Forecast generator with widening confidence band.
 *
 * Takes a base curve value and adds Gaussian noise that grows
 * ±2% per hour of forecast horizon.
 *
 * @param baseValueKw   Ground-truth value in kW
 * @param hoursAhead    How many hours into the future this forecast is
 * @param seed          Deterministic seed for noise
 * @returns Forecast value with confidence bounds
 */
export function generateForecast(
  baseValueKw: number,
  hoursAhead: number,
  seed: number
): {
  value_kw: number;
  confidence_lower: number;
  confidence_upper: number;
} {
  // Error grows with horizon: ±2% per hour
  const errorPercent = hoursAhead * 0.02;

  // Deterministic forecast error
  const forecastError = noise(hoursAhead, seed, 42) * errorPercent * baseValueKw;

  const value_kw = Math.max(0, baseValueKw + forecastError);

  // Confidence band width: grows with horizon
  const bandWidth = Math.abs(baseValueKw) * errorPercent;
  const confidence_lower = Math.max(0, value_kw - bandWidth);
  const confidence_upper = value_kw + bandWidth;

  return {
    value_kw: Math.round(value_kw * 100) / 100,
    confidence_lower: Math.round(confidence_lower * 100) / 100,
    confidence_upper: Math.round(confidence_upper * 100) / 100,
  };
}

/**
 * Price signal step function.
 *
 * Maps hour of day to tariff period rate.
 *
 * @param hour        Hour of day (0-23)
 * @param isWeekend   Whether the day is a weekend
 * @returns Price info
 */
export function generatePriceSignal(
  hour: number,
  isWeekend: boolean
): {
  price_per_kwh: number;
  feed_in_per_kwh: number;
  rate_type: "peak" | "offpeak" | "shoulder";
} {
  // Weekend: always off-peak
  if (isWeekend) {
    return {
      price_per_kwh: 0.15,
      feed_in_per_kwh: 0.06,
      rate_type: "offpeak",
    };
  }

  // Weekday tariff schedule (Austrian-style ToU)
  if (hour >= 7 && hour < 9) {
    // Morning shoulder
    return { price_per_kwh: 0.22, feed_in_per_kwh: 0.07, rate_type: "shoulder" };
  } else if (hour >= 9 && hour < 12) {
    // Morning peak
    return { price_per_kwh: 0.30, feed_in_per_kwh: 0.08, rate_type: "peak" };
  } else if (hour >= 12 && hour < 14) {
    // Midday shoulder
    return { price_per_kwh: 0.22, feed_in_per_kwh: 0.07, rate_type: "shoulder" };
  } else if (hour >= 17 && hour < 21) {
    // Evening peak
    return { price_per_kwh: 0.30, feed_in_per_kwh: 0.08, rate_type: "peak" };
  } else if (hour >= 14 && hour < 17) {
    // Afternoon shoulder
    return { price_per_kwh: 0.22, feed_in_per_kwh: 0.07, rate_type: "shoulder" };
  } else {
    // Night off-peak (21:00-07:00)
    return { price_per_kwh: 0.15, feed_in_per_kwh: 0.06, rate_type: "offpeak" };
  }
}
