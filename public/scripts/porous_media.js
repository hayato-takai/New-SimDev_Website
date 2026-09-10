// Add row to data table
function addRow() {
  const table = document.getElementById("dataTable").getElementsByTagName("tbody")[0];
  const row = table.insertRow();
  const cell1 = row.insertCell(0);
  const cell2 = row.insertCell(1);
  cell1.innerHTML = '<input type="number" step="any">';
  cell2.innerHTML = '<input type="number" step="any">';
}

// Helper: read x, y from table
function readTableData() {
  const rows = document.querySelectorAll("#dataTable tbody tr");
  const x = [], y = [];
  rows.forEach(r => {
    const vx = parseFloat(r.cells[0].querySelector("input").value);
    const vy = parseFloat(r.cells[1].querySelector("input").value);
    if (!isNaN(vx) && !isNaN(vy)) { x.push(vx); y.push(vy); }
  });
  return { x, y };
}

// Curve fitting for y = A*x + B*x^2
function fitCurve(x, y) {
  const n = x.length;
  let sumX2 = 0, sumX3 = 0, sumX4 = 0;
  let sumXY = 0, sumX2Y = 0;

  for (let i = 0; i < n; i++) {
    const xi = x[i];
    const yi = y[i];
    const xi2 = xi * xi;
    const xi3 = xi2 * xi;
    const xi4 = xi3 * xi;
    
    sumX2 += xi2;
    sumX3 += xi3;
    sumX4 += xi4;
    sumXY += xi * yi;
    sumX2Y += xi2 * yi;
  }

  const denom = (sumX2 * sumX4 - sumX3 * sumX3);
  const A = (sumX4 * sumXY - sumX3 * sumX2Y) / denom;
  const B = (sumX2 * sumX2Y - sumX3 * sumXY) / denom;

  console.log(`A = ${A}, B = ${B}`);
  return { A, B };
}

// Darcy–Forchheimer coefficient calculation
function calcDarcyForchheimer(A, B, mu, rho, L) {
  const d = A / (mu * L);
  const f = (2 * B) / (rho * L);
  return { d, f };
}

// Plot data and fitted curve
function plotData(x, y, A, B) {
  const ctx = document.getElementById("dataPlot").getContext("2d");
  const xFit = [...Array(50).keys()].map(i => Math.min(...x) + i * (Math.max(...x) - Math.min(...x)) / 49);
  const yFit = xFit.map(v => A*v + B*v*v);

  new Chart(ctx, {
    type: "scatter",
    data: {
      datasets: [
        { label: "Data", data: x.map((v,i)=>({x:v, y:y[i]})), pointBackgroundColor: "blue" },
        { label: "Fit", data: xFit.map((v,i)=>({x:v, y:yFit[i]})), type: "line", borderColor: "red" }
      ]
    },
    options: {
      scales: { x: { title: { text: "Velocity", display: true } },
                y: { title: { text: "Pressure Loss", display: true } } }
    }
  });
}

// Main calculator
async function calculateAll() {
  const { x, y } = readTableData();
  if (x.length < 3) { alert("Enter at least 3 valid data points."); return; }

  const { A, B } = fitCurve(x, y);

  const oilType = document.getElementById("oilTypeSelect").value;
  const tempInput = parseFloat(document.getElementById("operatingTempInput").value);
  const tempUnit = document.getElementById("operatingTempUnitSelect").value;
  const L = parseFloat(document.getElementById("lengthInput").value);

  const tK = convertUnit(tempUnit, "K", tempInput);
  const dens = OilProps.getDensityAtTemp(oilType, tK);
  const dynVisc = OilProps.getDynViscAtTemp(oilType, tK);

  const { d, f } = calcDarcyForchheimer(A, B, dynVisc, dens, L);

  document.getElementById("results").innerHTML = 
    `A = ${A.toExponential(4)}, B = ${B.toExponential(4)}<br>
     μ = ${dynVisc.toExponential(4)}, ρ = ${dens.toExponential(4)}<br>
     d = ${d.toExponential(4)}, f = ${f.toExponential(4)}`;

  plotData(x, y, A, B);
}

// Loads fluid types into the dropdown and sets up goal selection visibility.
// Called by: DOMContentLoaded
// Calls: loadFluidData(), OilProps.getFluidNames()
async function loadOil() {
  // Fluid and temperature elements
  const fluidSelect = document.getElementById("oilTypeSelect");

  /**
   * Loads fluid data and populates the fluid selection dropdown.
   */
  try {
    await loadFluidData();
    const fluids = OilProps.getFluidNames();
    fluids.forEach(f => {
      const opt = document.createElement("option");
      opt.value = f;
      opt.textContent = f;
      fluidSelect.appendChild(opt);
    });
  } catch (e) {
    console.warn("Could not load fluids", e);
  }
}

function addFlowRow() {
  const table = document.getElementById("flowDataTable").getElementsByTagName("tbody")[0];
  const row = table.insertRow();
  row.innerHTML = `
    <td><input type="number" step="any" oninput="updateVelocities()"></td>
    <td><input type="number" step="any" readonly></td>
    <td><input type="number" step="any"></td>`;
}

// Update velocity column based on Q and area
function updateVelocities() {
  const area = parseFloat(document.getElementById("areaInput").value);
  if (!area || area <= 0) return;

  const rows = document.querySelectorAll("#flowDataTable tbody tr");
  rows.forEach(r => {
    const qInput = r.cells[0].querySelector("input");
    const uInput = r.cells[1].querySelector("input");
    const q = parseFloat(qInput.value);
    if (!isNaN(q)) {
      const u = q / area;
      uInput.value = u.toExponential(4);
    } else {
      uInput.value = "";
    }
  });
}

// Read flow rate table and convert to velocity
function readFlowTableData(area) {
  const rows = document.querySelectorAll("#flowDataTable tbody tr");
  const x = [], y = [];
  rows.forEach(r => {
    const q = parseFloat(r.cells[0].querySelector("input").value);
    const dp = parseFloat(r.cells[2].querySelector("input").value);
    if (!isNaN(q) && !isNaN(dp)) {
      const u = q / area;
      x.push(u);
      y.push(dp);
    }
  });
  return { x, y };
}

// Calculate using flow data
async function calculateFromFlow() {
  const area = parseFloat(document.getElementById("areaInput").value);
  if (!area || area <= 0) { alert("Enter a valid cross-sectional area."); return; }

  const { x, y } = readFlowTableData(area);
  if (x.length < 3) { alert("Enter at least 3 valid data points."); return; }

  const { A, B } = fitCurve(x, y);

  const oilType = document.getElementById("oilTypeSelect").value;
  const tempInput = parseFloat(document.getElementById("operatingTempInput").value);
  const tempUnit = document.getElementById("operatingTempUnitSelect").value;
  const L = parseFloat(document.getElementById("lengthInput").value);

  const tK = convertUnit(tempUnit, "K", tempInput);
  const dens = parseFloat(document.getElementById("densityInput").value) || OilProps.getDensityAtTemp(oilType, tK);
  const dynVisc = parseFloat(document.getElementById("viscosityInput").value) || OilProps.getDynViscAtTemp(oilType, tK);

  const { d, f } = calcDarcyForchheimer(A, B, dynVisc, dens, L);

  document.getElementById("flowResults").innerHTML = 
    `A = ${A.toExponential(4)}, B = ${B.toExponential(4)}<br>
     μ = ${dynVisc.toExponential(4)}, ρ = ${dens.toExponential(4)}<br>
     d = ${d.toExponential(4)}, f = ${f.toExponential(4)}`;

  // Plot flow rate results
  const ctx = document.getElementById("flowPlot").getContext("2d");
  const xFit = [...Array(50).keys()].map(i => Math.min(...x) + i * (Math.max(...x) - Math.min(...x)) / 49);
  const yFit = xFit.map(v => A*v + B*v*v);

  new Chart(ctx, {
    type: "scatter",
    data: {
      datasets: [
        { label: "Data", data: x.map((v,i)=>({x:v, y:y[i]})), pointBackgroundColor: "blue" },
        { label: "Fit", data: xFit.map((v,i)=>({x:v, y:yFit[i]})), type: "line", borderColor: "red" }
      ]
    },
    options: {
      scales: { 
        x: { title: { text: "Velocity (m/s)", display: true } },
        y: { title: { text: "Pressure Loss (Pa)", display: true } } 
      }
    }
  });
}

// Auto-update density and viscosity on oil/temperature change
async function updateOilProps() {
  const oilType = document.getElementById("oilTypeSelect").value;
  const tempInput = parseFloat(document.getElementById("operatingTempInput").value);
  const tempUnit = document.getElementById("operatingTempUnitSelect").value;
  if (!oilType || isNaN(tempInput)) return;

  const tK = convertUnit(tempUnit, "K", tempInput);
  const dens = OilProps.getDensityAtTemp(oilType, tK);
  const dynVisc = OilProps.getDynViscAtTemp(oilType, tK);

  document.getElementById("densityInput").value = dens.toFixed(4);
  document.getElementById("viscosityInput").value = dynVisc.toFixed(4);
}

// Attach listeners to oil type and temperature inputs
document.addEventListener("DOMContentLoaded", () => {
  loadOil();
  document.getElementById("oilTypeSelect").addEventListener("change", updateOilProps);
  document.getElementById("operatingTempInput").addEventListener("input", updateOilProps);
  document.getElementById("operatingTempUnitSelect").addEventListener("change", updateOilProps);
});
