    // Constants
const TEMP_RANGE = { min: -40, max: 100 };
const ANIMATION_DURATION = 300;
let currentTempUnit = 'K'; // Track current temperature display unit
let currentKinViscUnit = 'mm^2/s'; // Kinematic viscosity in mm²/s by default
let currentDensityUnit = 'kg/m^3'; // Density in kg/m³ by default
let currentDynViscUnit = 'Pa*s'; // Dynamic viscosity in Pa·s by default
let inputTempUnit = 'C'; // Temperature input unit
let volumeInputUnit = 'L';
let massOutputUnit = 'kg';
let volOutputUnit = 'L';
const SELECTORS = {
  fluidSelect: '#fluidSelect',
  tempMin: '#tempMin',
  tempMax: '#tempMax',
  inputTempUnitSelect: '#inputTempUnitSelect',
  baseVolume: '#baseVolume',
  volumeInputUnitSelect: '#volumeInputUnitSelect',
  massCard: '#massCard',
  massValue: '#massValue',
  massOutputUnitSelect: '#massOutputUnitSelect',
  volChangeCard: '#volChangeCard',
  volChangeValue: '#volChangeValue',
  volOutputUnitSelect: '#volOutputUnitSelect',
  oilTitle: '#oilTitle',
  tempUnitSelect: '#tempUnitSelect',
  kinViscUnitSelect: '#kinViscUnitSelect',
  densityUnitSelect: '#densityUnitSelect',
  dynViscUnitSelect: '#dynViscUnitSelect',
  thermalExpansion: '#thermalExpansion',
  calculatedTableBody: '#calculatedTableBody',
  copyColBtns: '.copy-col-btn'
};

// Helper functions
function addRowAnimation(row) {
  row.classList.add('updated');
  setTimeout(() => row.classList.remove('updated'), ANIMATION_DURATION);
}

function createTableRow(cells) {
  const tr = document.createElement('tr');
  tr.innerHTML = cells.map(cell => `<td>${cell}</td>`).join('');
  addRowAnimation(tr);
  return tr;
}

function safeQuerySelector(selector, context = document) {
  const element = context.querySelector(selector);
  if (!element) {
    console.warn(`Element not found: ${selector}`);
  }
  return element;
}

function formatValue(value, decimals) {
  return Number.isFinite(value) ? value.toFixed(decimals) : 'N/A';
}

// Main initialization
document.addEventListener("DOMContentLoaded", async () => {
  try {
    await OilProps.loadFluidData();
    initializeFluidSelector();
    initializeTemperatureInputs();
    initializeInputTempUnitSelector();
    initializeVolumeInputs();
    initializeTemperatureUnitSelector();
    initializePropertyUnitSelectors();
    initializeCopyButtons();
  } catch (error) {
    console.error('Failed to initialize oil properties:', error);
    showError('Failed to load fluid data. Please refresh the page.');
  }
});

function initializeFluidSelector() {
  const fluidSelect = safeQuerySelector(SELECTORS.fluidSelect);
  if (!fluidSelect) return;

  const fluids = OilProps.getFluidNames();
  const fragment = document.createDocumentFragment();
  
  fluids.forEach(fluidName => {
    const option = document.createElement("option");
    option.value = fluidName;
    option.textContent = fluidName;
    fragment.appendChild(option);
  });
  
  fluidSelect.appendChild(fragment);
  fluidSelect.addEventListener("change", handleFluidChange);
}

function initializeTemperatureInputs() {
  const tempMin = safeQuerySelector(SELECTORS.tempMin);
  const tempMax = safeQuerySelector(SELECTORS.tempMax);

  [tempMin, tempMax].forEach(input => {
    if (!input) return;
    input.addEventListener("input", handleTemperatureChange);
    input.addEventListener("change", handleTemperatureChange);
  });
}

function initializeInputTempUnitSelector() {
  const sel = safeQuerySelector(SELECTORS.inputTempUnitSelect);
  if (!sel) return;
  sel.addEventListener("change", (event) => {
    inputTempUnit = event.target.value;
    handleTemperatureChange();
  });
}

function initializeVolumeInputs() {
  const volInput = safeQuerySelector(SELECTORS.baseVolume);
  if (volInput) {
    volInput.addEventListener("input", handleVolumeChange);
    volInput.addEventListener("change", handleVolumeChange);
  }

  const volUnitSel = safeQuerySelector(SELECTORS.volumeInputUnitSelect);
  if (volUnitSel) {
    volUnitSel.addEventListener("change", (e) => {
      volumeInputUnit = e.target.value;
      handleVolumeChange();
    });
  }

  const massUnitSel = safeQuerySelector(SELECTORS.massOutputUnitSelect);
  if (massUnitSel) {
    massUnitSel.addEventListener("change", (e) => {
      massOutputUnit = e.target.value;
      handleVolumeChange();
    });
  }

  const volOutSel = safeQuerySelector(SELECTORS.volOutputUnitSelect);
  if (volOutSel) {
    volOutSel.addEventListener("change", (e) => {
      volOutputUnit = e.target.value;
      handleVolumeChange();
    });
  }
}

function handleVolumeChange() {
  const fluidSelect = safeQuerySelector(SELECTORS.fluidSelect);
  const fluid = fluidSelect?.value;
  if (!fluid) return;

  const { minC, maxC } = getTemperatureRange();
  buildVolumeDisplay(fluid, minC, maxC);
}

function initializeTemperatureUnitSelector() {
  const tempUnitSelect = safeQuerySelector(SELECTORS.tempUnitSelect);
  if (!tempUnitSelect) return;

  tempUnitSelect.addEventListener("change", (event) => {
    currentTempUnit = event.target.value;
    
    const fluidSelect = safeQuerySelector(SELECTORS.fluidSelect);
    const fluid = fluidSelect?.value;
    
    if (fluid) {
      const { minC, maxC } = getTemperatureRange();
      buildCalculatedTable(fluid, minC, maxC);
    }
  });
}

function initializePropertyUnitSelectors() {
  const kinViscSelect = safeQuerySelector(SELECTORS.kinViscUnitSelect);
  const densitySelect = safeQuerySelector(SELECTORS.densityUnitSelect);
  const dynViscSelect = safeQuerySelector(SELECTORS.dynViscUnitSelect);

  // Populate kinematic viscosity units
  if (kinViscSelect) {
    populateUnitSelect(kinViscSelect, 'kinematicViscosity', 'mm^2/s');
    kinViscSelect.addEventListener("change", (event) => {
      currentKinViscUnit = event.target.value;
      rebuildTableWithNewUnits();
    });
  }

  // Populate density units
  if (densitySelect) {
    populateUnitSelect(densitySelect, 'density', 'kg/m^3');
    densitySelect.addEventListener("change", (event) => {
      currentDensityUnit = event.target.value;
      rebuildTableWithNewUnits();
    });
  }

  // Populate dynamic viscosity units
  if (dynViscSelect) {
    populateUnitSelect(dynViscSelect, 'dynamicViscosity', 'Pa*s');
    dynViscSelect.addEventListener("change", (event) => {
      currentDynViscUnit = event.target.value;
      rebuildTableWithNewUnits();
    });
  }
}

function populateUnitSelect(selectElement, unitType, defaultUnit) {
  try {
    const availableUnits = getAvailableUnits(unitType);
    
    // Clear existing options
    selectElement.innerHTML = '';
    
    // Add options from available units
    availableUnits.forEach(unit => {
      const option = document.createElement('option');
      option.value = unit;
      option.textContent = formatUnitDisplay(unit);
      selectElement.appendChild(option);
    });
    
    // Set default unit if it exists in available units
    if (availableUnits.includes(defaultUnit)) {
      selectElement.value = defaultUnit;
    }
  } catch (error) {
    console.error(`Error populating units for ${unitType}:`, error);
  }
}

function formatUnitDisplay(unit) {
  // Format unit strings for display (e.g., "mm^2/s" -> "mm²/s")
  const displayMap = {
    'm^2/s': 'm²/s',
    'mm^2/s': 'mm²/s',
    'cSt': 'cSt',
    'kg/m^3': 'kg/m³',
    'g/cm^3': 'g/cm³',
    'lb/ft^3': 'lb/ft³',
    'Pa*s': 'Pa·s',
    'Pa·s': 'Pa·s',
    'mPa*s': 'mPa·s',
    'cP': 'cP'
  };
  
  return displayMap[unit] || unit;
}

function toC(value) {
  if (!Number.isFinite(value)) return NaN;
  if (inputTempUnit === 'C') return value;
  if (inputTempUnit === 'K') return value - 273.15;
  if (inputTempUnit === 'F') return (value - 32) * 5 / 9;
  return value;
}

function getTemperatureRange() {
  const tempMin = safeQuerySelector(SELECTORS.tempMin);
  const tempMax = safeQuerySelector(SELECTORS.tempMax);
  const rawMin = tempMin?.value !== '' ? parseFloat(tempMin.value) : null;
  const rawMax = tempMax?.value !== '' ? parseFloat(tempMax.value) : null;

  // Convert inputs to Celsius
  const minC = rawMin !== null ? toC(rawMin) : null;
  const maxC = rawMax !== null ? toC(rawMax) : null;

  return { minC, maxC, rawMin, rawMax };
}

function rebuildTableWithNewUnits() {
  const fluidSelect = safeQuerySelector(SELECTORS.fluidSelect);
  const fluid = fluidSelect?.value;
  
  if (fluid) {
    const { minC, maxC } = getTemperatureRange();
    buildCalculatedTable(fluid, minC, maxC);
  }
}

function handleFluidChange(event) {
  const fluid = event.target.value;
  if (!fluid) return;

  try {
    const { minC, maxC } = getTemperatureRange();
    buildTables(fluid, minC, maxC);
  } catch (error) {
    console.error('Error building tables:', error);
    showError(`Failed to load properties for ${fluid}`);
  }
}

function handleTemperatureChange() {
  const fluidSelect = safeQuerySelector(SELECTORS.fluidSelect);
  const fluid = fluidSelect?.value;
  
  if (!fluid) return;
  
  const { minC, maxC } = getTemperatureRange();
  buildTables(fluid, minC, maxC);
}

function initializeCopyButtons() {
  const copyBtns = document.querySelectorAll(SELECTORS.copyColBtns);
  
  copyBtns.forEach(btn => {
    btn.addEventListener("click", async () => {
      try {
        const colIdx = parseInt(btn.dataset.col, 10);
        const rows = document.querySelectorAll(`${SELECTORS.calculatedTableBody} tr`);
        
        const text = Array.from(rows)
          .map(row => {
            const cells = row.querySelectorAll("td");
            return `${cells[0]?.innerText || ''}\t${cells[colIdx]?.innerText || ''}`;
          })
          .join('\n');

        await navigator.clipboard.writeText(text);
        btn.classList.add('copied');
        const original = btn.textContent;
        btn.textContent = '✓';
        setTimeout(() => {
          btn.textContent = original;
          btn.classList.remove('copied');
        }, 1500);
      } catch (error) {
        console.error('Failed to copy:', error);
        showError('Failed to copy to clipboard');
      }
    });
  });
}

function buildTables(name, tempMinC, tempMaxC) {
  buildThermalExpansionDisplay(name, tempMinC, tempMaxC);
  buildVolumeDisplay(name, tempMinC, tempMaxC);
  buildCalculatedTable(name, tempMinC, tempMaxC);
}

function buildThermalExpansionDisplay(name, tempMinC, tempMaxC) {
  const expansionEl = safeQuerySelector(SELECTORS.thermalExpansion);
  if (!expansionEl) return;

  if (tempMinC !== null && tempMaxC !== null && tempMinC !== tempMaxC) {
    const expansion = OilProps.calcThermalExpansion(name, { tMin: tempMinC + 273.15, tMax: tempMaxC + 273.15 });
    if (Number.isFinite(expansion)) {
      expansionEl.textContent = (expansion * 100).toFixed(3) + '%';
    } else {
      expansionEl.textContent = '\u2014';
    }
  } else {
    expansionEl.textContent = '\u2014';
  }
}

// Volume conversion helpers
function volumeToM3(value, unit) {
  if (unit === 'm^3') return value;
  if (unit === 'L') return value * 0.001;
  if (unit === 'gal') return value * 0.00378541;
  return value;
}

function m3ToVolume(value, unit) {
  if (unit === 'm^3') return value;
  if (unit === 'L') return value / 0.001;
  if (unit === 'gal') return value / 0.00378541;
  return value;
}

function massFromKg(value, unit) {
  if (unit === 'kg') return value;
  if (unit === 'g') return value * 1000;
  if (unit === 'lb') return value * 2.20462;
  return value;
}

function buildVolumeDisplay(name, tempMinC, tempMaxC) {
  const massCard = safeQuerySelector(SELECTORS.massCard);
  const volChangeCard = safeQuerySelector(SELECTORS.volChangeCard);
  const massEl = safeQuerySelector(SELECTORS.massValue);
  const volChangeEl = safeQuerySelector(SELECTORS.volChangeValue);

  const volInput = safeQuerySelector(SELECTORS.baseVolume);
  const rawVol = volInput?.value !== '' ? parseFloat(volInput.value) : null;

  if (rawVol === null || !Number.isFinite(rawVol) || rawVol <= 0) {
    if (massEl) massEl.textContent = '\u2014';
    if (volChangeEl) volChangeEl.textContent = '\u2014';
    return;
  }

  // Convert input volume to m³
  const baseVol_m3 = volumeToM3(rawVol, volumeInputUnit);

  // Calculate mass using density at min temperature, or 15°C if not provided
  let tempForMass_K;
  let tempForMass_C;
  if (tempMinC !== null) {
    tempForMass_K = tempMinC + 273.15;
    tempForMass_C = tempMinC;
  } else {
    tempForMass_K = 288.15; // 15°C
    tempForMass_C = 15;
  }
  const densityAtTemp = OilProps.getDensityAtTemp(name, tempForMass_K); // kg/m³
  if (massEl) {
    if (Number.isFinite(densityAtTemp)) {
      const mass_kg = densityAtTemp * baseVol_m3;
      const displayMass = massFromKg(mass_kg, massOutputUnit);
      massEl.textContent = formatValue(displayMass, 3) + ' (at ' + tempForMass_C.toFixed(0) + '°C)';
    } else {
      massEl.textContent = '\u2014';
    }
  }

  // Calculate absolute volume change
  if (volChangeEl) {
    if (tempMinC !== null && tempMaxC !== null && tempMinC !== tempMaxC) {
      const expansion = OilProps.calcThermalExpansion(name, { tMin: tempMinC + 273.15, tMax: tempMaxC + 273.15 });
      if (Number.isFinite(expansion)) {
        const deltaV_m3 = baseVol_m3 * expansion;
        const displayDeltaV = m3ToVolume(deltaV_m3, volOutputUnit);
        volChangeEl.textContent = formatValue(displayDeltaV, 4);
      } else {
        volChangeEl.textContent = '\u2014';
      }
    } else {
      volChangeEl.textContent = '\u2014';
    }
  }
}

function buildCalculatedTable(name, tempMinC, tempMaxC) {
  const tbody = safeQuerySelector(SELECTORS.calculatedTableBody);
  if (!tbody) return;

  tbody.innerHTML = "";
  const fragment = document.createDocumentFragment();

  // Determine temperatures to display
  let temperatures = [];
  if (tempMinC !== null && tempMaxC !== null) {
    // Both entered: show range (or single point if equal)
    const lo = Math.round(Math.min(tempMinC, tempMaxC));
    const hi = Math.round(Math.max(tempMinC, tempMaxC));
    for (let tC = lo; tC <= hi; tC++) {
      temperatures.push(tC);
    }
  } else if (tempMinC !== null) {
    // Only min entered: show single temperature
    temperatures = [Math.round(tempMinC)];
  } else if (tempMaxC !== null) {
    // Only max entered: show single temperature
    temperatures = [Math.round(tempMaxC)];
  } else {
    // Nothing entered: full default range
    for (let tC = TEMP_RANGE.min; tC <= TEMP_RANGE.max; tC++) {
      temperatures.push(tC);
    }
  }

  temperatures.forEach(tC => {
    const tK = tC + 273.15;
    const density_kgm3 = OilProps.getDensityAtTemp(name, tK);
    const kinVisc_mm2s = OilProps.getKinViscAtTemp(name, tK);
    const dynVisc_Pas = OilProps.getDynViscAtTemp(name, tK);

    // Convert temperature to selected unit
    let displayTemp;
    if (currentTempUnit === 'K') {
      displayTemp = tK.toFixed(2);
    } else if (currentTempUnit === 'C') {
      displayTemp = tC.toString();
    } else if (currentTempUnit === 'F') {
      const tF = convertUnit('C', 'F', tC);
      displayTemp = tF.toFixed(2);
    }

    // Convert kinematic viscosity to selected unit (mm²/s is the base)
    let displayKinVisc;
    if (currentKinViscUnit === 'mm^2/s') {
      displayKinVisc = formatValue(kinVisc_mm2s, 3);
    } else if (currentKinViscUnit === 'm^2/s') {
      const converted = convertUnit('mm^2/s', 'm^2/s', kinVisc_mm2s);
      displayKinVisc = formatValue(converted, 6);
    } else if (currentKinViscUnit === 'cSt') {
      const converted = convertUnit('mm^2/s', 'cSt', kinVisc_mm2s);
      displayKinVisc = formatValue(converted, 3);
    }

    // Convert density to selected unit (kg/m³ is the base)
    let displayDensity;
    if (currentDensityUnit === 'kg/m^3') {
      displayDensity = Number.isFinite(density_kgm3) ? density_kgm3.toPrecision(4) : 'N/A';
    } else if (currentDensityUnit === 'g/cm^3') {
      const converted = convertUnit('kg/m^3', 'g/cm^3', density_kgm3);
      displayDensity = Number.isFinite(converted) ? converted.toPrecision(4) : 'N/A';
    } else if (currentDensityUnit === 'lb/ft^3') {
      const converted = convertUnit('kg/m^3', 'lb/ft^3', density_kgm3);
      displayDensity = Number.isFinite(converted) ? converted.toPrecision(4) : 'N/A';
    }

    // Convert dynamic viscosity to selected unit (Pa·s is the base)
    let displayDynVisc;
    if (currentDynViscUnit === 'Pa*s') {
      displayDynVisc = Number.isFinite(dynVisc_Pas) ? dynVisc_Pas.toPrecision(5) : 'N/A';
    } else if (currentDynViscUnit === 'mPa*s') {
      const converted = convertUnit('Pa*s', 'mPa*s', dynVisc_Pas);
      displayDynVisc = Number.isFinite(converted) ? converted.toPrecision(5) : 'N/A';
    } else if (currentDynViscUnit === 'cP') {
      const converted = convertUnit('Pa*s', 'cP', dynVisc_Pas);
      displayDynVisc = Number.isFinite(converted) ? converted.toPrecision(5) : 'N/A';
    }

    const tr = createTableRow([
      displayTemp,
      displayKinVisc,
      displayDensity,
      displayDynVisc
    ]);
    fragment.appendChild(tr);
  });

  tbody.appendChild(fragment);
}

// Utility functions for user feedback
function showError(message) {
  alert(`Error: ${message}`); // Replace with a better toast/notification system
}

function showSuccess(message) {
  alert(message); // Replace with a better toast/notification system
}
