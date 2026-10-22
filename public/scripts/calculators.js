// ========== UTILITY: UNIT CONVERSION HELPERS ==========

/**
 * Convert a value from any supported unit to its SI base unit.
 * SI base units: length → m, area → m^2, velocity → m/s,
 *                flow → m^3/s, density → kg/m^3, dynVisc → Pa*s
 *
 * @param {number} value
 * @param {string} fromUnit
 * @param {string} siUnit - SI target unit string
 * @returns {number} Value in SI units
 */
function toSIUnit(value, fromUnit, siUnit) {
  try {
    return convertUnit(fromUnit, siUnit, value);
  } catch {
    return value;
  }
}

/**
 * Convert a value from an SI base unit to any target unit.
 *
 * @param {number} value - Value in SI units
 * @param {string} siUnit - SI source unit string
 * @param {string} toUnit
 * @returns {number} Value in target unit
 */
function fromSIUnit(value, siUnit, toUnit) {
  try {
    return convertUnit(siUnit, toUnit, value);
  } catch {
    return value;
  }
}

/**
 * Populate a <select> element with all units for a given unit type.
 * Uses getAvailableUnits() and getUnitDisplayName() from unit_converter.js.
 *
 * @param {HTMLSelectElement} selectEl
 * @param {string} unitType - e.g. "length", "flow", "dynamic viscosity"
 * @param {string} [defaultUnit] - Unit to pre-select
 */
function populateUnitSelect(selectEl, unitType, defaultUnit) {
  const units = getAvailableUnits(unitType);
  selectEl.innerHTML = '';
  units.forEach(u => {
    const label = getUnitDisplayName(u);
    selectEl.add(new Option(label, u));
  });
  if (defaultUnit && units.includes(defaultUnit)) {
    selectEl.value = defaultUnit;
  }
}

/**
 * Re-express an input's value in its select's newly chosen unit, so changing
 * the unit keeps the same physical quantity. The previous unit is read from,
 * and then updated in, selectEl.dataset.old.
 *
 * @param {HTMLInputElement} inputEl
 * @param {HTMLSelectElement} selectEl
 */
function convertOnUnitChange(inputEl, selectEl) {
  const val = parseFloat(inputEl.value);
  if (Number.isFinite(val)) {
    inputEl.value = formatSigFigs(convertUnit(selectEl.dataset.old, selectEl.value, val));
  }
  selectEl.dataset.old = selectEl.value;
}

// ========== PIPE VELOCITY CALCULATOR ==========
// Solves V = Q / A, where A = π(D/2)²
// Diameter or flow edited → recompute velocity
// Velocity edited → recompute flow (diameter is the fixed geometry)

/**
 * Initialize the pipe velocity calculator.
 * Computes V = Q / A  ↔  D = 2√(Q/πV)  ↔  Q = V·π(D/2)²
 */
function initializePipeVelocityCalculator() {
  const elements = {
    diameter:     document.getElementById("pipeDiameter"),
    flow:         document.getElementById("pipeFlow"),
    velocity:     document.getElementById("pipeVelocity"),
    diameterUnit: document.getElementById("pipeDiameterUnit"),
    flowUnit:     document.getElementById("pipeFlowUnit"),
    velocityUnit: document.getElementById("pipeVelocityUnit")
  };

  if (!Object.values(elements).every(Boolean)) {
    console.warn("Pipe velocity calculator: missing DOM elements");
    return;
  }

  // Populate unit dropdowns from unit_converter.js data
  populateUnitSelect(elements.diameterUnit, "length", "mm");
  populateUnitSelect(elements.flowUnit,     "flow",   "gpm");
  populateUnitSelect(elements.velocityUnit, "velocity", "m/s");

  // Store old unit values for unit-change conversions
  elements.diameterUnit.dataset.old = elements.diameterUnit.value;
  elements.flowUnit.dataset.old     = elements.flowUnit.value;
  elements.velocityUnit.dataset.old = elements.velocityUnit.value;

  let busy = false;

  // -- V = Q / A (diameter + flow → velocity) --
  function calcVelocity() {
    if (busy) return; busy = true;
    const D = parseFloat(elements.diameter.value);
    const Q = parseFloat(elements.flow.value);
    if (Number.isFinite(D) && Number.isFinite(Q) && D > 0) {
      const D_m   = toSIUnit(D, elements.diameterUnit.value, "m");
      const Q_m3s = toSIUnit(Q, elements.flowUnit.value,     "m^3/s");
      const A     = Math.PI * (D_m / 2) ** 2;
      const V_ms  = Q_m3s / A;
      elements.velocity.value = formatSigFigs(fromSIUnit(V_ms, "m/s", elements.velocityUnit.value));
    }
    busy = false;
  }

  // -- Q = V·A (diameter + velocity → flow) --
  function calcFlow() {
    if (busy) return; busy = true;
    const D = parseFloat(elements.diameter.value);
    const V = parseFloat(elements.velocity.value);
    if (Number.isFinite(D) && Number.isFinite(V) && D > 0) {
      const D_m   = toSIUnit(D, elements.diameterUnit.value,  "m");
      const V_ms  = toSIUnit(V, elements.velocityUnit.value,  "m/s");
      const A     = Math.PI * (D_m / 2) ** 2;
      const Q_m3s = V_ms * A;
      elements.flow.value = formatSigFigs(fromSIUnit(Q_m3s, "m^3/s", elements.flowUnit.value));
    }
    busy = false;
  }

  // Unit-change handlers: re-display the stored quantity in the new unit, then recalculate
  function onDiameterUnitChange() {
    convertOnUnitChange(elements.diameter, elements.diameterUnit);
    calcVelocity();
  }

  function onFlowUnitChange() {
    convertOnUnitChange(elements.flow, elements.flowUnit);
    calcVelocity();
  }

  function onVelocityUnitChange() {
    convertOnUnitChange(elements.velocity, elements.velocityUnit);
    calcVelocity();
  }

  // Diameter or flow edited → recompute velocity
  elements.diameter.addEventListener("input", calcVelocity);
  elements.flow.addEventListener("input",     calcVelocity);
  // Velocity edited → recompute flow (diameter is fixed geometry)
  elements.velocity.addEventListener("input", calcFlow);

  elements.diameterUnit.addEventListener("change", onDiameterUnitChange);
  elements.flowUnit.addEventListener("change",     onFlowUnitChange);
  elements.velocityUnit.addEventListener("change", onVelocityUnitChange);

  calcVelocity(); // Initial calculation
}

// ========== CIRCLE AREA CALCULATOR ==========
// r = D/2,  C = πD,  A = π(D/2)²
// Editing any one of diameter, radius, circumference or area recomputes the
// other three, by way of the diameter.

/**
 * Initialize the circle area calculator (diameter ↔ radius ↔ circumference ↔ area).
 */
function initializeCircleAreaCalculator() {
  const elements = {
    diameter:          document.getElementById("circleDiameter"),
    radius:            document.getElementById("circleRadius"),
    circumference:     document.getElementById("circleCircumference"),
    area:              document.getElementById("circleArea"),
    diameterUnit:      document.getElementById("circleDiameterUnit"),
    radiusUnit:        document.getElementById("circleRadiusUnit"),
    circumferenceUnit: document.getElementById("circleCircumferenceUnit"),
    areaUnit:          document.getElementById("circleAreaUnit")
  };

  if (!Object.values(elements).every(Boolean)) {
    console.warn("Circle area calculator: missing DOM elements");
    return;
  }

  // Populate unit dropdowns from unit_converter.js data
  populateUnitSelect(elements.diameterUnit,      "length", "in");
  populateUnitSelect(elements.radiusUnit,        "length", "in");
  populateUnitSelect(elements.circumferenceUnit, "length", "in");
  populateUnitSelect(elements.areaUnit,          "area",   "in^2");

  // Each field's SI unit and its relation to the diameter D (m)
  const fields = [
    { input: elements.diameter,      unit: elements.diameterUnit,      si: "m",
      fromD: D => D,                       toD: D => D },
    { input: elements.radius,        unit: elements.radiusUnit,        si: "m",
      fromD: D => D / 2,                   toD: r => 2 * r },
    { input: elements.circumference, unit: elements.circumferenceUnit, si: "m",
      fromD: D => Math.PI * D,             toD: C => C / Math.PI },
    { input: elements.area,          unit: elements.areaUnit,          si: "m^2",
      fromD: D => Math.PI * (D / 2) ** 2,  toD: A => 2 * Math.sqrt(A / Math.PI) }
  ];

  /** Recompute every field except the one that was edited */
  function calcFrom(source) {
    const x = parseFloat(source.input.value);
    if (!Number.isFinite(x) || x < 0) return;
    const D_m = source.toD(toSIUnit(x, source.unit.value, source.si));
    fields.forEach(f => {
      if (f === source) return;
      f.input.value = formatSigFigs(fromSIUnit(f.fromD(D_m), f.si, f.unit.value));
    });
  }

  fields.forEach(f => {
    f.unit.dataset.old = f.unit.value;
    f.input.addEventListener("input", () => calcFrom(f));
    // A unit change re-shows the same quantity, so the other fields stand
    f.unit.addEventListener("change", () => convertOnUnitChange(f.input, f.unit));
  });

  calcFrom(fields[0]); // Initial calculation from the diameter
}

// ========== REYNOLDS NUMBER CALCULATOR ==========
// Re = ρ·V·D / μ
// Re < 2300        → Laminar
// 2300 ≤ Re ≤ 4000 → Transitional
// Re > 4000        → Turbulent

/**
 * Initialize the Reynolds number calculator.
 * Re = ρVD / μ, with laminar / transitional / turbulent classification.
 */
function initializeReynoldsCalculator() {
  const elements = {
    density:     document.getElementById("reDensity"),
    velocity:    document.getElementById("reVelocity"),
    diameter:    document.getElementById("reDiameter"),
    dynVisc:     document.getElementById("reDynVisc"),
    reynolds:    document.getElementById("reValue"),
    flowStatus:  document.getElementById("reFlowStatus"),
    densityUnit: document.getElementById("reDensityUnit"),
    velocityUnit:document.getElementById("reVelocityUnit"),
    diameterUnit:document.getElementById("reDiameterUnit"),
    dynViscUnit: document.getElementById("reDynViscUnit")
  };

  if (!Object.values(elements).every(Boolean)) {
    console.warn("Reynolds calculator: missing DOM elements");
    return;
  }

  // Populate unit dropdowns from unit_converter.js data
  populateUnitSelect(elements.densityUnit,  "density",           "kg/m^3");
  populateUnitSelect(elements.diameterUnit, "length",            "m");
  populateUnitSelect(elements.dynViscUnit,  "dynamic viscosity", "Pa*s");
  populateUnitSelect(elements.velocityUnit, "velocity",          "m/s");

  // -- Re = ρVD / μ --
  function calcReynolds() {
    const rho = parseFloat(elements.density.value);
    const V   = parseFloat(elements.velocity.value);
    const D   = parseFloat(elements.diameter.value);
    const mu  = parseFloat(elements.dynVisc.value);

    if ([rho, V, D, mu].some(v => !Number.isFinite(v))) {
      elements.reynolds.value = "";
      setFlowStatus("", "");
      return;
    }

    if (mu === 0) {
      elements.reynolds.value = "∞";
      setFlowStatus("Turbulent", "turbulent");
      return;
    }

    // Convert all inputs to SI
    const rho_SI = toSIUnit(rho, elements.densityUnit.value,  "kg/m^3");
    const V_SI   = toSIUnit(V,   elements.velocityUnit.value, "m/s");
    const D_SI   = toSIUnit(D,   elements.diameterUnit.value, "m");
    const mu_SI  = toSIUnit(mu,  elements.dynViscUnit.value,  "Pa*s");

    const Re = (rho_SI * V_SI * D_SI) / mu_SI;
    elements.reynolds.value = Re.toFixed(0);

    // Flow regime classification
    if (Re < 2300) {
      setFlowStatus("Laminar", "laminar");
    } else if (Re <= 4000) {
      setFlowStatus("Transitional", "transitional");
    } else {
      setFlowStatus("Turbulent", "turbulent");
    }
  }

  /**
   * Update the flow-status badge text and CSS class.
   * @param {string} text
   * @param {'laminar'|'transitional'|'turbulent'|''} regime
   */
  function setFlowStatus(text, regime) {
    elements.flowStatus.textContent = text;
    elements.flowStatus.className   = "re-flow-status " + regime;
  }

  [elements.density, elements.velocity, elements.diameter, elements.dynVisc].forEach(e =>
    e.addEventListener("input", calcReynolds)
  );
  [elements.densityUnit, elements.velocityUnit, elements.diameterUnit, elements.dynViscUnit].forEach(e =>
    e.addEventListener("change", calcReynolds)
  );

  calcReynolds(); // Initial calculation
}

// ========== PERCENT CHANGE CALCULATOR ==========
// % change = (newVal - origVal) / |origVal| × 100
// Editing either input recomputes the result.
// Typing a % into the result field back-solves: newVal = origVal × (1 + pct/100)

/**
 * Initialize the percent change calculator.
 */
function initializePercentChangeCalculator() {
  const original = document.getElementById("pctOriginal");
  const newVal   = document.getElementById("pctNew");
  const result   = document.getElementById("pctResult");

  if (!original || !newVal || !result) {
    console.warn("Percent change calculator: missing DOM elements");
    return;
  }

  /** Compute % change from original → new, display with increase/decrease label */
  function calcPct() {
    const o = parseFloat(original.value);
    const n = parseFloat(newVal.value);
    if (!Number.isFinite(o) || !Number.isFinite(n)) { result.value = ''; return; }
    if (o === 0) { result.value = 'N/A (original is 0)'; return; }
    const pct = ((n - o) / Math.abs(o)) * 100;
    const sign = pct > 0 ? '+' : '';
    const label = pct > 0 ? 'increase' : pct < 0 ? 'decrease' : 'no change';
    result.value = `${sign}${pct.toFixed(4)}%  (${label})`;
  }

  /** Back-solve: given original and % change, compute new value */
  function calcNewFromPct() {
    const o   = parseFloat(original.value);
    const raw = result.value.trim();
    // Accept bare numbers like "-25" or "+10.5" from the result field
    const pct = parseFloat(raw);
    if (!Number.isFinite(o) || !Number.isFinite(pct)) return;
    newVal.value = formatSigFigs(o * (1 + pct / 100));
    calcPct(); // Re-show the typed % with its sign and increase/decrease label
  }

  original.addEventListener("input", calcPct);
  newVal.addEventListener("input",   calcPct);
  result.addEventListener("change",  calcNewFromPct);
}

// ========== DASH SIZE CALCULATOR ==========
// Dash number = size in sixteenths of an inch (hose ID / tube OD): -8 → 8/16 = 1/2 in
// Dash edited → recompute size
// Size edited → recompute dash

/**
 * Write a whole number of sixteenths as an inch fraction, e.g. 20 → "1 1/4 in".
 * @param {number} sixteenths - Positive integer
 * @returns {string}
 */
function sixteenthsToFraction(sixteenths) {
  const whole = Math.floor(sixteenths / 16);
  let num = sixteenths % 16;
  let den = 16;
  while (num > 0 && num % 2 === 0) { num /= 2; den /= 2; }
  const parts = [];
  if (whole > 0) parts.push(whole);
  if (num > 0)   parts.push(`${num}/${den}`);
  return `${parts.join(" ")} in`;
}

/**
 * Initialize the dash size calculator.
 * Computes size = dash / 16 in  (bidirectional)
 */
function initializeDashSizeCalculator() {
  const elements = {
    dash:     document.getElementById("dashNumber"),
    size:     document.getElementById("dashSize"),
    sizeUnit: document.getElementById("dashSizeUnit"),
    fraction: document.getElementById("dashFraction")
  };

  if (!Object.values(elements).every(Boolean)) {
    console.warn("Dash size calculator: missing DOM elements");
    return;
  }

  populateUnitSelect(elements.sizeUnit, "length", "in");
  elements.sizeUnit.dataset.old = elements.sizeUnit.value;

  /** Show the dash as an inch fraction; a size between dash numbers names the nearest one. */
  function showFraction(dash) {
    const nearest = Math.round(dash);
    if (!Number.isFinite(dash) || nearest < 1) {
      elements.fraction.textContent = "";
      return;
    }
    const fraction = sixteenthsToFraction(nearest);
    elements.fraction.textContent = Math.abs(dash - nearest) < 1e-6
      ? fraction
      : `Nearest: -${nearest} (${fraction})`;
  }

  // -- size = dash / 16 in --
  function calcSize() {
    const dash = parseFloat(elements.dash.value);
    if (!Number.isFinite(dash) || dash < 0) { showFraction(NaN); return; }
    elements.size.value = formatSigFigs(convertUnit("in", elements.sizeUnit.value, dash / 16));
    showFraction(dash);
  }

  // -- dash = 16 × size in inches --
  function calcDash() {
    const size = parseFloat(elements.size.value);
    if (!Number.isFinite(size) || size < 0) { showFraction(NaN); return; }
    const dash = convertUnit(elements.sizeUnit.value, "in", size) * 16;
    elements.dash.value = formatSigFigs(dash);
    showFraction(dash);
  }

  elements.dash.addEventListener("input", calcSize);
  elements.size.addEventListener("input", calcDash);
  // The dash number is unchanged by a unit change, so only the size is re-shown
  elements.sizeUnit.addEventListener("change", () =>
    convertOnUnitChange(elements.size, elements.sizeUnit)
  );

  calcSize(); // Initial calculation
}

// ========== TURNOVER RATIO CALCULATOR ==========
// Turnover = Q / V — how many times per unit time the tank volume circulates.
// Dwell time is its inverse, V / Q.
// Flow or volume edited → recompute turnover
// Turnover edited → recompute volume (flow is the fixed pump output)

/** Turnover units, as the factor to 1/s */
const turnoverFactors = {
  "1/min": 1 / 60,
  "1/h":   1 / 3600,
  "1/s":   1
};

/**
 * Initialize the turnover ratio calculator.
 * Computes T = Q / V  ↔  V = Q / T
 */
function initializeTurnoverCalculator() {
  const elements = {
    flow:         document.getElementById("tankFlow"),
    volume:       document.getElementById("tankVolume"),
    turnover:     document.getElementById("tankTurnover"),
    dwell:        document.getElementById("tankDwell"),
    flowUnit:     document.getElementById("tankFlowUnit"),
    volumeUnit:   document.getElementById("tankVolumeUnit"),
    turnoverUnit: document.getElementById("tankTurnoverUnit")
  };

  if (!Object.values(elements).every(Boolean)) {
    console.warn("Turnover ratio calculator: missing DOM elements");
    return;
  }

  populateUnitSelect(elements.flowUnit,   "flow",   "gpm");
  populateUnitSelect(elements.volumeUnit, "volume", "gal(US)");
  elements.turnoverUnit.innerHTML = '';
  [["per min","1/min"],["per hour","1/h"],["per s","1/s"]].forEach(([label,val]) =>
    elements.turnoverUnit.add(new Option(label, val))
  );

  elements.flowUnit.dataset.old     = elements.flowUnit.value;
  elements.volumeUnit.dataset.old   = elements.volumeUnit.value;
  elements.turnoverUnit.dataset.old = elements.turnoverUnit.value;

  /** @param {number} T_s - Turnover in 1/s */
  function showDwell(T_s) {
    elements.dwell.value = T_s > 0 ? formatSigFigs(1 / T_s / 60) : "";
  }

  // -- T = Q / V --
  function calcTurnover() {
    const Q = parseFloat(elements.flow.value);
    const V = parseFloat(elements.volume.value);
    if (!Number.isFinite(Q) || !Number.isFinite(V) || Q < 0 || V <= 0) return;
    const Q_m3s = toSIUnit(Q, elements.flowUnit.value,   "m^3/s");
    const V_m3  = toSIUnit(V, elements.volumeUnit.value, "m^3");
    const T_s   = Q_m3s / V_m3;
    elements.turnover.value = formatSigFigs(T_s / turnoverFactors[elements.turnoverUnit.value]);
    showDwell(T_s);
  }

  // -- V = Q / T --
  function calcVolume() {
    const Q = parseFloat(elements.flow.value);
    const T = parseFloat(elements.turnover.value);
    if (!Number.isFinite(Q) || !Number.isFinite(T) || Q < 0 || T <= 0) return;
    const Q_m3s = toSIUnit(Q, elements.flowUnit.value, "m^3/s");
    const T_s   = T * turnoverFactors[elements.turnoverUnit.value];
    elements.volume.value = formatSigFigs(fromSIUnit(Q_m3s / T_s, "m^3", elements.volumeUnit.value));
    showDwell(T_s);
  }

  function onTurnoverUnitChange() {
    const old = elements.turnoverUnit.dataset.old;
    const val = parseFloat(elements.turnover.value);
    if (Number.isFinite(val)) {
      const T_s = val * turnoverFactors[old];
      elements.turnover.value = formatSigFigs(T_s / turnoverFactors[elements.turnoverUnit.value]);
    }
    elements.turnoverUnit.dataset.old = elements.turnoverUnit.value;
  }

  elements.flow.addEventListener("input",     calcTurnover);
  elements.volume.addEventListener("input",   calcTurnover);
  elements.turnover.addEventListener("input", calcVolume);

  elements.flowUnit.addEventListener("change", () => {
    convertOnUnitChange(elements.flow, elements.flowUnit);
    calcTurnover();
  });
  elements.volumeUnit.addEventListener("change", () => {
    convertOnUnitChange(elements.volume, elements.volumeUnit);
    calcTurnover();
  });
  elements.turnoverUnit.addEventListener("change", onTurnoverUnitChange);

  calcTurnover(); // Initial calculation
}

// ========== BETA RATIO CALCULATOR ==========
// β = upstream count / downstream count, at one particle size
// Efficiency η = (1 − 1/β) × 100  ↔  β = 1 / (1 − η/100)

/**
 * Initialize the beta ratio ↔ efficiency calculator (bidirectional).
 */
function initializeBetaRatioCalculator() {
  const beta       = document.getElementById("betaRatio");
  const efficiency = document.getElementById("betaEfficiency");

  if (!beta || !efficiency) {
    console.warn("Beta ratio calculator: missing DOM elements");
    return;
  }

  // -- η = (1 − 1/β) × 100 --
  function calcEfficiency() {
    const b = parseFloat(beta.value);
    // β < 1 would mean more particles downstream than up
    efficiency.value = Number.isFinite(b) && b >= 1 ? formatSigFigs((1 - 1 / b) * 100) : "";
  }

  // -- β = 1 / (1 − η/100) --
  function calcBeta() {
    const e = parseFloat(efficiency.value);
    // 100% has no finite β; the placeholder shows ∞ in the emptied field
    beta.placeholder = e === 100 ? "∞" : "";
    beta.value = Number.isFinite(e) && e >= 0 && e < 100 ? formatSigFigs(1 / (1 - e / 100)) : "";
  }

  beta.addEventListener("input",       calcEfficiency);
  efficiency.addEventListener("input", calcBeta);

  calcEfficiency(); // Initial calculation
}

// ========== ISO 4406 CODE CALCULATOR ==========
// ISO 4406 reports cleanliness as three scale numbers for the count of particles
// ≥4, ≥6 and ≥14 µm(c) per mL, written e.g. 18/16/13. Scale number N covers
// counts above the upper limit of N−1, up to and including its own; the limits
// roughly double with each step. "-" marks a size that was not counted.
// Code edited → fill each count with the top of its range
// A count edited → recompute its scale number and the code

/** Upper limit of each scale number's range, particles per mL (index = scale number) */
const ISO_4406_UPPER = [
  0.01, 0.02, 0.04, 0.08, 0.16, 0.32, 0.64, 1.3, 2.5, 5,
  10, 20, 40, 80, 160, 320, 640, 1300, 2500, 5000,
  10000, 20000, 40000, 80000, 160000, 320000, 640000, 1300000, 2500000
];
/** Highest scale number in the table; anything above it is reported as ">28" */
const ISO_4406_MAX = ISO_4406_UPPER.length - 1;

/**
 * Scale number for a count per mL. Returns ISO_4406_MAX + 1 for counts above
 * the table.
 * @param {number} count
 * @returns {number}
 */
function isoScaleForCount(count) {
  const scale = ISO_4406_UPPER.findIndex(upper => count <= upper);
  return scale === -1 ? ISO_4406_MAX + 1 : scale;
}

/**
 * Initialize the ISO 4406 code ↔ particle count calculator.
 */
function initializeIsoCodeCalculator() {
  const code = document.getElementById("isoCode");
  const rows = [4, 6, 14].map(size => ({
    count: document.getElementById(`iso${size}Count`),
    scale: document.getElementById(`iso${size}Scale`),
    range: document.getElementById(`iso${size}Range`)
  }));

  if (!code || !rows.every(r => r.count && r.scale && r.range)) {
    console.warn("ISO 4406 calculator: missing DOM elements");
    return;
  }

  const countFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

  /** @param {number|null} scale - Scale number, ISO_4406_MAX + 1 for ">28", null if not counted */
  function scaleLabel(scale) {
    if (scale === null) return "-";
    return scale > ISO_4406_MAX ? `>${ISO_4406_MAX}` : String(scale);
  }

  /** Show a row's scale number and the count range it covers */
  function showScale(row, scale) {
    row.scale.textContent = scale === null ? "" : scaleLabel(scale);
    if (scale === null) {
      row.range.textContent = "";
    } else if (scale > ISO_4406_MAX) {
      row.range.textContent = `> ${countFormat.format(ISO_4406_UPPER[ISO_4406_MAX])}`;
    } else {
      const lower = scale === 0 ? 0 : ISO_4406_UPPER[scale - 1];
      row.range.textContent = `${countFormat.format(lower)} – ${countFormat.format(ISO_4406_UPPER[scale])}`;
    }
  }

  /**
   * Parse "18/16/13" into scale numbers. "-" or "*" leaves a size uncounted.
   * @returns {(number|null)[]|null} Three scale numbers, or null if the code is incomplete
   */
  function parseCode(text) {
    const parts = text.split("/").map(p => p.trim());
    if (parts.length !== 3) return null;
    const scales = parts.map(p => {
      if (p === "-" || p === "*") return null;
      if (p === `>${ISO_4406_MAX}`) return ISO_4406_MAX + 1;
      const n = Number(p);
      return p !== "" && Number.isInteger(n) && n >= 0 && n <= ISO_4406_MAX ? n : undefined;
    });
    return scales.includes(undefined) ? null : scales;
  }

  // -- code → counts (top of each range) --
  function calcCounts() {
    const scales = parseCode(code.value);
    if (!scales) return;
    rows.forEach((row, i) => {
      const scale = scales[i];
      // ">28" has no upper limit to fill in, so its count is left blank
      row.count.value = scale === null || scale > ISO_4406_MAX ? "" : ISO_4406_UPPER[scale];
      showScale(row, scale);
    });
  }

  // -- counts → code --
  function calcCode() {
    const scales = rows.map(row => {
      const c = parseFloat(row.count.value);
      const scale = Number.isFinite(c) && c >= 0 ? isoScaleForCount(c) : null;
      showScale(row, scale);
      return scale;
    });
    code.value = scales.map(scaleLabel).join("/");
  }

  code.addEventListener("input", calcCounts);
  rows.forEach(row => row.count.addEventListener("input", calcCode));

  calcCounts(); // Initial calculation
}

// ========== INITIALIZATION ==========

/**
 * Bootstrap all calculators once the DOM is ready and unit_converter.js
 * functions are available.
 */
function initializeCalculators() {
  if (typeof convertUnit === "undefined" || typeof getAvailableUnits === "undefined") {
    // Retry after a short delay in case scripts loaded out of order
    setTimeout(initializeCalculators, 100);
    return;
  }
  initializePipeVelocityCalculator();
  initializeCircleAreaCalculator();
  initializeReynoldsCalculator();
  initializePercentChangeCalculator();
  initializeDashSizeCalculator();
  initializeTurnoverCalculator();
  initializeBetaRatioCalculator();
  initializeIsoCodeCalculator();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeCalculators);
} else {
  initializeCalculators();
}

// ========== BROWSER EXPORTS ==========
if (typeof window !== "undefined") {
  window.initializePipeVelocityCalculator   = initializePipeVelocityCalculator;
  window.initializeCircleAreaCalculator     = initializeCircleAreaCalculator;
  window.initializeReynoldsCalculator       = initializeReynoldsCalculator;
  window.initializePercentChangeCalculator  = initializePercentChangeCalculator;
  window.initializeDashSizeCalculator       = initializeDashSizeCalculator;
  window.initializeTurnoverCalculator       = initializeTurnoverCalculator;
  window.initializeBetaRatioCalculator      = initializeBetaRatioCalculator;
  window.initializeIsoCodeCalculator        = initializeIsoCodeCalculator;
}
