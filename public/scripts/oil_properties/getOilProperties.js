// Constants
const DEFAULT_THERMAL_EXPANSION_COEFF = 0.00065; // /K, fallback if not specified per fluid
const REFERENCE_TEMP_K = 288.15; // 15°C in Kelvin
const WALTHER_CONSTANT = 0.8;
const WALTHER_ERROR_THRESHOLD = 5; // percent

// Configuration
const DEBUG_MODE = false; // Set to true to enable detailed logging

// Load fluid data from JSON
let fluidData = {}; // will be loaded from JSON
let loadPromise = null; // Track loading promise to avoid race conditions

async function loadFluidData() {
  if (Object.keys(fluidData).length > 0) return; // already loaded
  
  // If already loading, return the existing promise
  if (loadPromise) return loadPromise;
  
  loadPromise = (async () => {
    try {
      if (typeof window !== "undefined" && typeof fetch !== "undefined") {
        // Browser mode - determine base path from current location
        const pathParts = window.location.pathname.split('/');
        let BASE_PATH = '';
        if (pathParts.includes('New-SimDev_Website')) {
          BASE_PATH = '/New-SimDev_Website';
        } else if (pathParts.includes('simdev_website')) {
          BASE_PATH = '/simdev_website';
        }
        const FLUID_DATA_PATH = `${BASE_PATH}/components/fluid_data.json`;
        const response = await fetch(FLUID_DATA_PATH);
        if (!response.ok) {
          throw new Error(`Failed to load fluid data: ${response.statusText}`);
        }
        fluidData = await response.json();
      } else if (typeof require !== "undefined") {
        // Node.js / ExecJS mode
        const fs = require("fs");
        const raw = fs.readFileSync("fluid_data.json", "utf8");
        fluidData = JSON.parse(raw);
      } else {
        throw new Error("No compatible data loading method available");
      }
      
      if (DEBUG_MODE) {
        console.log(`Loaded ${Object.keys(fluidData).length} fluids`);
      }
    } catch (error) {
      console.error("Error loading fluid data:", error);
      throw error;
    } finally {
      loadPromise = null;
    }
  })();
  return loadPromise;
}

/**
 * Get the volumetric thermal expansion coefficient for a fluid.
 * 
 * @param {string} name - The name of the fluid.
 * @returns {number} Thermal expansion coefficient in 1/K, or NaN if fluid not found.
 */
function getThermalExpansionCoeff(name) {
  const fluid = fluidData[name];
  if (!fluid) {
    if (DEBUG_MODE) console.warn(`Fluid not found: ${name}`);
    return NaN;
  }
  return fluid.ThermalExpansionCoeff ?? DEFAULT_THERMAL_EXPANSION_COEFF;
}

/**
 * Calculate the fractional volumetric thermal expansion for a temperature increase.
 * ΔV/V = β × ΔT
 * 
 * Provide either deltaT directly, or both tMin and tMax.
 * 
 * @param {string} name - The name of the fluid.
 * @param {object} options - { deltaT } or { tMin, tMax }
 * @param {number} [options.deltaT] - Temperature increase in K.
 * @param {number} [options.tMin] - Minimum temperature in K.
 * @param {number} [options.tMax] - Maximum temperature in K.
 * @returns {number} Fractional volume change (dimensionless), or NaN if invalid.
 */
function calcThermalExpansion(name, { deltaT = null, tMin = null, tMax = null } = {}) {
  let dt = deltaT;
  if (dt === null) {
    if (tMin !== null && tMax !== null) {
      dt = tMax - tMin;
    } else {
      console.warn('Provide either deltaT or both tMin and tMax.');
      return NaN;
    }
  }
  const beta = getThermalExpansionCoeff(name);
  if (!Number.isFinite(beta) || !Number.isFinite(dt)) return NaN;
  return beta * dt;
}

/**
 * Get the density of a fluid at a given temperature.
 * 
 * NOTE: This equation now uses the per-fluid thermal expansion coefficient
 * (ThermalExpansionCoeff from fluid_data.json) instead of a single global
 * constant. Results will differ slightly from the previous implementation
 * for fluids with non-standard expansion coefficients (water-glycol,
 * synthetics, phosphate esters, etc.).
 * 
 * Uses linear thermal expansion approximation:
 *   ρ(T) = ρ_ref × (1 - β × (T - T_ref))
 * 
 * @param {string} name - The name of the fluid.
 * @param {number} tK - Temperature in Kelvin.
 * @returns {number} Density in kg/m³, or NaN if fluid not found.
 */
function getDensityAtTemp(name, tK) {
  if (!Number.isFinite(tK)) {
    console.warn(`Invalid temperature: ${tK}`);
    return NaN;
  }
  
  const fluid = fluidData[name];
  if (!fluid || !fluid.DensityAt15C) {
    if (DEBUG_MODE) console.warn(`Fluid not found or missing density data: ${name}`);
    return NaN;
  }
  
  const beta = fluid.ThermalExpansionCoeff ?? DEFAULT_THERMAL_EXPANSION_COEFF;
  return fluid.DensityAt15C * (1 - beta * (tK - REFERENCE_TEMP_K));
}

/**
 * Calculate Walther transform value.
 * @private
 */
function calculateWaltherTransform(viscosity) {
  return Math.log10(Math.log10(viscosity + WALTHER_CONSTANT));
}

/**
 * Calculate viscosity from Walther transform.
 * @private
 */
function inverseWaltherTransform(h) {
  return Math.pow(10, Math.pow(10, h)) - WALTHER_CONSTANT;
}

/**
 * Validate Walther transform at reference points.
 * @private
 */
function validateWaltherTransform(name, T1, V1, T2, V2, m, n) {
  const checkVisc1 = inverseWaltherTransform(m * Math.log10(T1) + n);
  const checkVisc2 = inverseWaltherTransform(m * Math.log10(T2) + n);

  const err1 = Math.abs((checkVisc1 - V1) / V1) * 100;
  const err2 = Math.abs((checkVisc2 - V2) / V2) * 100;

  if (DEBUG_MODE) {
    console.log(`Walther params for ${name}: m = ${m.toFixed(6)}, n = ${n.toFixed(6)}`);
    
    const status1 = err1 > WALTHER_ERROR_THRESHOLD ? "WARN" : "PASS";
    const status2 = err2 > WALTHER_ERROR_THRESHOLD ? "WARN" : "PASS";
    
    console.log(`[${status1}] T1 (${T1} K): expected ${V1}, got ${checkVisc1.toFixed(3)} (${err1.toFixed(2)}% error)`);
    console.log(`[${status2}] T2 (${T2} K): expected ${V2}, got ${checkVisc2.toFixed(3)} (${err2.toFixed(2)}% error)`);
  } else if (err1 > WALTHER_ERROR_THRESHOLD || err2 > WALTHER_ERROR_THRESHOLD) {
    console.warn(`Walther transform accuracy warning for ${name}: errors ${err1.toFixed(2)}%, ${err2.toFixed(2)}%`);
  }
}

/**
 * Get the kinematic viscosity of a fluid at a given temperature using Walther transform.
 * The Walther equation is a standard method for interpolating viscosity across temperatures.
 * 
 * @param {string} name - The name of the fluid.
 * @param {number} tK - Temperature in Kelvin.
 * @returns {number} Kinematic viscosity in mm²/s, or NaN if data unavailable.
 */
function getKinViscAtTemp(name, tK) {
  if (!Number.isFinite(tK)) {
    console.warn(`Invalid temperature: ${tK}`);
    return NaN;
  }
  
  const kv = fluidData[name]?.["Kinematic Viscosity Limits"];
  if (!kv || kv.length < 2) {
    if (DEBUG_MODE) console.warn(`Insufficient viscosity data for ${name}`);
    return NaN;
  }

  const T1 = kv[0].temperature;
  const V1 = kv[0].kinematicViscosity;
  const T2 = kv[1].temperature;
  const V2 = kv[1].kinematicViscosity;

  // Validate input data
  if (!Number.isFinite(T1) || !Number.isFinite(V1) || !Number.isFinite(T2) || !Number.isFinite(V2)) {
    console.warn(`Invalid viscosity data for ${name}`);
    return NaN;
  }

  // Walther transform
  const W1 = calculateWaltherTransform(V1);
  const W2 = calculateWaltherTransform(V2);

  const m = (W2 - W1) / (Math.log10(T2) - Math.log10(T1));
  const n = W1 - m * Math.log10(T1);

  // Calculate viscosity at target temperature
  const h = m * Math.log10(tK) + n;
  const viscAtT = inverseWaltherTransform(h);

  // Validate transformation accuracy
  validateWaltherTransform(name, T1, V1, T2, V2, m, n);

  return viscAtT;
}

/**
 * Get the dynamic viscosity of a fluid at a given temperature.
 * Calculated from kinematic viscosity and density: μ = ν × ρ
 * 
 * @param {string} name - The name of the fluid.
 * @param {number} tK - Temperature in Kelvin.
 * @returns {number} Dynamic viscosity in Pa·s, or NaN if data unavailable.
 */
function getDynViscAtTemp(name, tK) {
  const kinVisc = getKinViscAtTemp(name, tK); // mm²/s
  const density = getDensityAtTemp(name, tK); // kg/m³

  if (!Number.isFinite(kinVisc) || !Number.isFinite(density)) {
    return NaN;
  }

  // Convert kinematic viscosity from mm²/s to m²/s, then multiply by density
  const dynVisc = kinVisc * 1e-6 * density; // Pa·s
  
  return dynVisc;
}

/**
 * Get a list of all fluid names in the dataset.
 * 
 * @returns {string[]} Array of fluid names, sorted alphabetically.
 */
function getFluidNames() {
  return Object.keys(fluidData).sort();
}

// Export functions for both Node.js and browser
const OilProps = {
  loadFluidData,
  getThermalExpansionCoeff,
  calcThermalExpansion,
  getDensityAtTemp,
  getKinViscAtTemp,
  getDynViscAtTemp,
  getFluidNames
};

// Browser global export
if (typeof window !== "undefined") {
  window.OilProps = OilProps;
}

// Node.js module export
if (typeof module !== "undefined" && module.exports) {
  module.exports = OilProps;
  
  // CLI execution handler
  const isMain = require.main === module;
  if (isMain) {
    (async () => {
      try {
        const args = process.argv.slice(2);
        const name = args[0];
        const tK = parseFloat(args[1]);

        if (!name || !Number.isFinite(tK)) {
          console.error("Usage: node getOilProperties.js <fluidName> <temperatureK>");
          console.error("Example: node getOilProperties.js 'ISO VG 32' 313.15");
          process.exit(1);
        }

        await loadFluidData();
        
        const density = getDensityAtTemp(name, tK);
        const kinVisc = getKinViscAtTemp(name, tK);
        const dynVisc = getDynViscAtTemp(name, tK);

        console.log(`\nFluid: ${name}`);
        console.log(`Temperature: ${tK} K (${(tK - 273.15).toFixed(2)} °C)`);
        console.log(`Density: ${Number.isFinite(density) ? density.toFixed(2) : 'N/A'} kg/m³`);
        console.log(`Kinematic Viscosity: ${Number.isFinite(kinVisc) ? kinVisc.toFixed(3) : 'N/A'} mm²/s`);
        console.log(`Dynamic Viscosity: ${Number.isFinite(dynVisc) ? dynVisc.toFixed(6) : 'N/A'} Pa·s\n`);
      } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
      }
    })();
  }
}