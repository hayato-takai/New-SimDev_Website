/**
 * Curve Fitting Module
 * Performs least-squares curve fitting for Darcy-Forchheimer equation: y = A*x + B*x²
 * Calculates porous media properties including permeability and Forchheimer coefficients
 */

// ============================================
// CURVE FITTING CALCULATIONS
// ============================================

/**
 * Perform least-squares curve fitting for equation: y = A*x + B*x²
 * @param {Array<{x: number, y: number}>} dataPoints - Input data points
 * @returns {{A: number, B: number}} Fitted coefficients
 * @throws {Error} If less than 3 data points or singular matrix
 */
function leastSquaresFit(dataPoints) {
  if (dataPoints.length < 3) {
    throw new Error("At least 3 data points required for curve fitting");
  }

  const n = dataPoints.length;
  let sumX = 0, sumX2 = 0, sumX3 = 0, sumX4 = 0, sumY = 0, sumXY = 0, sumX2Y = 0;

  dataPoints.forEach(point => {
    const x = point.x;
    const y = point.y;
    sumX += x;
    sumX2 += x * x;
    sumX3 += x * x * x;
    sumX4 += x * x * x * x;
    sumY += y;
    sumXY += x * y;
    sumX2Y += x * x * y;
  });

  // Solve system of equations:
  // n*A + sumX2*B = sumY
  // sumX2*A + sumX4*B = sumX2Y
  const denom = n * sumX4 - sumX2 * sumX2;
  if (Math.abs(denom) < 1e-10) {
    throw new Error("Singular matrix - cannot solve for coefficients");
  }

  const A = (sumY * sumX4 - sumX2Y * sumX2) / denom;
  const B = (n * sumX2Y - sumY * sumX2) / denom;

  return { A, B };
}

/**
 * Calculate R² (coefficient of determination)
 * Measures goodness of fit: 1.0 = perfect fit, 0.0 = poor fit
 * @param {Array<{x: number, y: number}>} dataPoints - Input data points
 * @param {number} A - Linear coefficient
 * @param {number} B - Quadratic coefficient
 * @returns {number} R² value between 0 and 1
 */
function calculateR2(dataPoints, A, B) {
  const yMean = dataPoints.reduce((sum, p) => sum + p.y, 0) / dataPoints.length;
  const ssTot = dataPoints.reduce((sum, p) => sum + Math.pow(p.y - yMean, 2), 0);
  const ssRes = dataPoints.reduce((sum, p) => {
    const yPred = A * p.x + B * p.x * p.x;
    return sum + Math.pow(p.y - yPred, 2);
  }, 0);

  return 1 - (ssRes / ssTot);
}

// ============================================
// VISUALIZATION
// ============================================

/**
 * Generate points for the fitted curve
 * @param {number} A - Linear coefficient
 * @param {number} B - Quadratic coefficient
 * @param {number} xMin - Minimum x value
 * @param {number} xMax - Maximum x value
 * @param {number} numPoints - Number of points to generate (default: 100)
 * @returns {Array<{x: number, y: number}>} Curve points
 */
function generateCurve(A, B, xMin, xMax, numPoints = 100) {
  const points = [];
  const step = (xMax - xMin) / numPoints;
  for (let i = 0; i <= numPoints; i++) {
    const x = xMin + i * step;
    const y = A * x + B * x * x;
    points.push({ x, y });
  }
  return points;
}

/**
 * Plot experimental data with fitted curve using Chart.js
 * @param {string} canvasId - ID of canvas element to render chart
 * @param {Array<{x: number, y: number}>} dataPoints - Experimental data
 * @param {number} A - Linear coefficient
 * @param {number} B - Quadratic coefficient
 * @param {string} xlabel - Label for x-axis
 * @param {string} ylabel - Label for y-axis
 * @param {string} title - Chart title
 */
function plotWithCurve(canvasId, dataPoints, A, B, xlabel, ylabel, title) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) {
    console.error(`Canvas with id "${canvasId}" not found`);
    return;
  }

  // Destroy existing chart to prevent memory leaks
  if (window.charts && window.charts[canvasId]) {
    window.charts[canvasId].destroy();
  }

  if (!window.charts) {
    window.charts = {};
  }

  // Generate fitted curve points
  const xValues = dataPoints.map(p => p.x);
  const xMin = Math.min(...xValues);
  const xMax = Math.max(...xValues);
  const curvePoints = generateCurve(A, B, xMin, xMax);

  // Create scatter plot with curve overlay
  window.charts[canvasId] = new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: [
        {
          label: 'Experimental Data',
          data: dataPoints,
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8,
          showLine: false
        },
        {
          label: 'Fitted Curve (y = A·x + B·x²)',
          data: curvePoints,
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'transparent',
          borderWidth: 2,
          pointRadius: 0,
          showLine: true,
          tension: 0.1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        title: {
          display: true,
          text: title,
          font: { size: 16, weight: 'bold' }
        },
        legend: {
          display: true,
          position: 'top'
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: xlabel,
            font: { size: 12, weight: 'bold' }
          },
          min: 0
        },
        y: {
          title: {
            display: true,
            text: ylabel,
            font: { size: 12, weight: 'bold' }
          },
          min: 0
        }
      }
    }
  });
}


// ============================================
// DATA EXTRACTION
// ============================================

/**
 * Extract numeric data from HTML table rows
 * Reads input values from numbered columns in a table
 * @param {string} tableId - ID of table element containing input data
 * @param {number} xColIndex - Column index for x values (default: 0)
 * @param {number} yColIndex - Column index for y values (default: 1)
 * @returns {Array<{x: number, y: number}>} Array of data points from table inputs
 * @throws {Error} If table not found
 */
function getTableData(tableId, xColIndex = 0, yColIndex = 1) {
  const table = document.getElementById(tableId);
  if (!table) {
    throw new Error(`Table with id "${tableId}" not found`);
  }

  const rows = table.querySelectorAll('tbody tr');
  const dataPoints = [];

  rows.forEach((row, index) => {
    const inputs = row.querySelectorAll('input[type="number"]');
    if (inputs.length > Math.max(xColIndex, yColIndex)) {
      const x = parseFloat(inputs[xColIndex].value);
      const y = parseFloat(inputs[yColIndex].value);
      if (!isNaN(x) && !isNaN(y)) {
        dataPoints.push({ x, y });
      }
    }
  });

  return dataPoints;
}

// ============================================
// MAIN ANALYSIS FUNCTION
// ============================================

/**
 * Main curve fitting orchestration function
 * Performs complete Darcy-Forchheimer analysis and generates visualization
 * @param {Array<{x: number, y: number}>} dataPoints - Input data for curve fitting
 * @param {number} L - Sample length in meters
 * @param {number} density - Fluid density in kg/m³
 * @param {number} viscosity - Dynamic viscosity in Pa·s
 * @param {string} canvasId - ID of canvas for plot visualization
 * @param {string} resultsId - ID of element for results display
 * @param {string} title - Chart title
 * @param {string} xlabel - X-axis label
 * @param {string} ylabel - Y-axis label
 * @returns {{A: number, B: number, d: number, f: number, R2: number}|null} Analysis results or null if error
 */
function performCurveFitting(dataPoints, L, density, viscosity, canvasId, resultsId, title, xlabel, ylabel) {
  try {
    if (dataPoints.length < 3) {
      throw new Error('At least 3 data points required');
    }

    // Perform curve fitting: y = A*x + B*x²
    const { A, B } = leastSquaresFit(dataPoints);
    
    // Calculate goodness of fit metric
    const R2 = calculateR2(dataPoints, A, B);

    // Calculate Darcy coefficient: d = A / (viscosity * L)
    const d = A / (viscosity * L);
    
    // Calculate Forchheimer coefficient: f = 2*B / (density * L)
    const f = (2 * B) / (density * L);

    // Generate visualization with fitted curve
    plotWithCurve(canvasId, dataPoints, A, B, xlabel, ylabel, title);

    // Display formatted results in results element
    const resultsElement = document.getElementById(resultsId);
    if (resultsElement) {
      resultsElement.innerHTML = `
        <h4>Curve Fitting Results:</h4>
        <p><strong>Linear Coefficient (A):</strong> ${A.toFixed(6)} Pa·s/m</p>
        <p><strong>Quadratic Coefficient (B):</strong> ${B.toFixed(6)} Pa·s²/m</p>
        <p><strong>R² (Goodness of Fit):</strong> ${R2.toFixed(6)}</p>
        <hr>
        <h4>Porous Media Properties:</h4>
        <p><strong>Darcy Coefficient (d):</strong> ${d.toFixed(6)} m⁻²</p>
        <p><strong>Forchheimer Coefficient (f):</strong> ${f.toFixed(6)} m⁻¹</p>
        <p><strong>Permeability (κ):</strong> ${(1/d).toFixed(9)} m²</p>
      `;
    }

    return { A, B, d, f, R2 };
  } catch (error) {
    const resultsElement = document.getElementById(resultsId);
    if (resultsElement) {
      resultsElement.innerHTML = `<p style="color: red;"><strong>Error:</strong> ${error.message}</p>`;
    }
    console.error('Curve fitting error:', error);
    return null;
  }
}

// ============================================
// MODULE EXPORTS
// ============================================

/**
 * Global CurveFitting API
 * Exposes public functions for use in HTML onclick handlers
 */
window.CurveFitting = {
  performCurveFitting,
  getTableData,
  leastSquaresFit,
  calculateR2,
  generateCurve,
  plotWithCurve
};