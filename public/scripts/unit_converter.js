/**
 * Unit conversion utilities
 */

// Unit conversion factors and functions
const unitConversions = {
  // Temperature
  'C_to_K': (v) => v + 273.15,
  'K_to_C': (v) => v - 273.15,
  'C_to_F': (v) => v * 9/5 + 32,
  'F_to_C': (v) => (v - 32) * 5/9,
  'K_to_F': (v) => (v - 273.15) * 9/5 + 32,
  'F_to_K': (v) => (v - 32) * 5/9 + 273.15,

  // Kinematic viscosity
  'mm^2/s_to_m^2/s': (v) => v * 1e-6,
  'm^2/s_to_mm^2/s': (v) => v * 1e6,
  'mm^2/s_to_cSt': (v) => v, // 1 mm²/s = 1 cSt
  'cSt_to_mm^2/s': (v) => v,

  // Density
  'kg/m^3_to_g/cm^3': (v) => v * 1e-3,
  'g/cm^3_to_kg/m^3': (v) => v * 1e3,
  'kg/m^3_to_lb/ft^3': (v) => v * 0.062428,
  'lb/ft^3_to_kg/m^3': (v) => v / 0.062428,

  // Dynamic viscosity
  'Pa*s_to_mPa*s': (v) => v * 1e3,
  'mPa*s_to_Pa*s': (v) => v * 1e-3,
  'Pa*s_to_cP': (v) => v * 1e3, // 1 Pa·s = 1000 cP
  'cP_to_Pa*s': (v) => v * 1e-3,
};

/**
 * Convert a value between units.
 * @param {string} fromUnit - Source unit
 * @param {string} toUnit - Target unit
 * @param {number} value - Value to convert
 * @returns {number} Converted value
 */
function convertUnit(fromUnit, toUnit, value) {
  if (fromUnit === toUnit) return value;
  
  const key = `${fromUnit}_to_${toUnit}`;
  const fn = unitConversions[key];
  
  if (!fn) {
    console.warn(`No conversion found: ${fromUnit} -> ${toUnit}`);
    return value;
  }
  
  return fn(value);
}

/**
 * Get available units for a given property type.
 * @param {string} unitType - 'kinematicViscosity', 'density', or 'dynamicViscosity'
 * @returns {string[]} Array of available unit strings
 */
function getAvailableUnits(unitType) {
  const unitMap = {
    kinematicViscosity: ['mm^2/s', 'm^2/s', 'cSt'],
    density: ['kg/m^3', 'g/cm^3', 'lb/ft^3'],
    dynamicViscosity: ['Pa*s', 'mPa*s', 'cP'],
  };
  
  return unitMap[unitType] || [];
}
