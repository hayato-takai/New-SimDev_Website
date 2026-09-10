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
  // Velocity: m/s and ft/s only
  elements.velocityUnit.innerHTML = '';
  [["m/s","m/s"],["ft/s","ft/s"]].forEach(([label,val]) =>
    elements.velocityUnit.add(new Option(label, val))
  );

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
      elements.velocity.value = fromSIUnit(V_ms, "m/s", elements.velocityUnit.value).toFixed(4);
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
      elements.flow.value = fromSIUnit(Q_m3s, "m^3/s", elements.flowUnit.value).toFixed(4);
    }
    busy = false;
  }

  // Unit-change handlers: re-display the stored quantity in the new unit, then recalculate
  function onDiameterUnitChange() {
    const old = elements.diameterUnit.dataset.old;
    const val = parseFloat(elements.diameter.value);
    if (Number.isFinite(val)) {
      elements.diameter.value = convertUnit(old, elements.diameterUnit.value, val).toFixed(4);
    }
    elements.diameterUnit.dataset.old = elements.diameterUnit.value;
    calcVelocity();
  }

  function onFlowUnitChange() {
    const old = elements.flowUnit.dataset.old;
    const val = parseFloat(elements.flow.value);
    if (Number.isFinite(val)) {
      elements.flow.value = convertUnit(old, elements.flowUnit.value, val).toFixed(4);
    }
    elements.flowUnit.dataset.old = elements.flowUnit.value;
    calcVelocity();
  }

  function onVelocityUnitChange() {
    const old = elements.velocityUnit.dataset.old;
    const val = parseFloat(elements.velocity.value);
    if (Number.isFinite(val)) {
      elements.velocity.value = convertUnit(old, elements.velocityUnit.value, val).toFixed(4);
    }
    elements.velocityUnit.dataset.old = elements.velocityUnit.value;
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
// Solves A = π(D/2)²  ↔  D = 2√(A/π)

/**
 * Initialize the circle area calculator.
 * Computes A = π(D/2)²  (bidirectional)
 */
function initializeCircleAreaCalculator() {
  const elements = {
    diameter:     document.getElementById("circleDiameter"),
    area:         document.getElementById("circleArea"),
    diameterUnit: document.getElementById("circleDiameterUnit"),
    areaUnit:     document.getElementById("circleAreaUnit")
  };

  if (!Object.values(elements).every(Boolean)) {
    console.warn("Circle area calculator: missing DOM elements");
    return;
  }

  // Populate unit dropdowns from unit_converter.js data
  populateUnitSelect(elements.diameterUnit, "length", "in");
  populateUnitSelect(elements.areaUnit,     "area",   "in^2");

  elements.diameterUnit.dataset.old = elements.diameterUnit.value;
  elements.areaUnit.dataset.old     = elements.areaUnit.value;

  // -- A = π(D/2)² --
  function calcArea() {
    const D = parseFloat(elements.diameter.value);
    if (!Number.isFinite(D) || D < 0) return;
    const D_m  = toSIUnit(D, elements.diameterUnit.value, "m");
    const A_m2 = Math.PI * (D_m / 2) ** 2;
    elements.area.value = fromSIUnit(A_m2, "m^2", elements.areaUnit.value).toFixed(6);
  }

  // -- D = 2√(A/π) --
  function calcDiameter() {
    const A = parseFloat(elements.area.value);
    if (!Number.isFinite(A) || A < 0) return;
    const A_m2 = toSIUnit(A, elements.areaUnit.value, "m^2");
    const D_m  = 2 * Math.sqrt(A_m2 / Math.PI);
    elements.diameter.value = fromSIUnit(D_m, "m", elements.diameterUnit.value).toFixed(6);
  }

  function onDiameterUnitChange() {
    const old = elements.diameterUnit.dataset.old;
    const val = parseFloat(elements.diameter.value);
    if (Number.isFinite(val)) {
      elements.diameter.value = convertUnit(old, elements.diameterUnit.value, val).toFixed(6);
    }
    elements.diameterUnit.dataset.old = elements.diameterUnit.value;
    calcArea();
  }

  function onAreaUnitChange() {
    const old = elements.areaUnit.dataset.old;
    const val = parseFloat(elements.area.value);
    if (Number.isFinite(val)) {
      elements.area.value = convertUnit(old, elements.areaUnit.value, val).toFixed(6);
    }
    elements.areaUnit.dataset.old = elements.areaUnit.value;
    calcDiameter();
  }

  elements.diameter.addEventListener("input", calcArea);
  elements.area.addEventListener("input",     calcDiameter);
  elements.diameterUnit.addEventListener("change", onDiameterUnitChange);
  elements.areaUnit.addEventListener("change",     onAreaUnitChange);

  calcArea(); // Initial calculation
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

  // Velocity: m/s and ft/s only
  elements.velocityUnit.innerHTML = '';
  [["m/s","m/s"],["ft/s","ft/s"]].forEach(([label,val]) =>
    elements.velocityUnit.add(new Option(label, val))
  );

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
// Editing the result field back-solves: newVal = origVal × (1 + pct/100)

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
    newVal.value = (o * (1 + pct / 100)).toFixed(6);
  }

  original.addEventListener("input", calcPct);
  newVal.addEventListener("input",   calcPct);
  result.addEventListener("change",  calcNewFromPct);
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
}
