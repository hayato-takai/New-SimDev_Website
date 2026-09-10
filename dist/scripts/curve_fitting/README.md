# Curve Fitting Module

A JavaScript module for performing least-squares curve fitting on the Darcy-Forchheimer equation and analyzing porous media properties.

## Overview

This module fits experimental data to the quadratic equation **y = A·x + B·x²** using least-squares regression, commonly used in porous media analysis where:
- **x** = fluid velocity (m/s)
- **y** = pressure loss (Pa)
- **A** = Darcy coefficient term (related to viscous flow resistance)
- **B** = Forchheimer coefficient term (related to inertial flow resistance)

## Features

- **Least-squares curve fitting** for y = A·x + B·x² equation
- **Goodness-of-fit calculation** (R² coefficient of determination)
- **Darcy-Forchheimer property extraction** (permeability, drag coefficients)
- **Interactive visualization** using Chart.js with experimental data and fitted curve overlay
- **Table data extraction** from HTML input elements
- **Error handling** with descriptive error messages

## Dependencies

- **Chart.js** (v3.0+) - For scatter plot visualization with curve overlay
- Modern browser with ES6 support

## API Reference

### Core Functions

#### `leastSquaresFit(dataPoints)`
Performs least-squares curve fitting to find coefficients A and B.

**Parameters:**
- `dataPoints` {Array<{x: number, y: number}>} - Array of data points

**Returns:** {A: number, B: number} - Fitted coefficients

**Throws:** Error if less than 3 data points or singular matrix

**Example:**
```javascript
const data = [
  { x: 0.5, y: 10.2 },
  { x: 1.0, y: 25.5 },
  { x: 1.5, y: 45.8 }
];
const { A, B } = CurveFitting.leastSquaresFit(data);
console.log(`A = ${A}, B = ${B}`);
```

#### `calculateR2(dataPoints, A, B)`
Calculates R² (coefficient of determination) to measure goodness of fit.

**Parameters:**
- `dataPoints` {Array<{x: number, y: number}>} - Input data points
- `A` {number} - Linear coefficient
- `B` {number} - Quadratic coefficient

**Returns:** {number} - R² value between 0 and 1
- 1.0 = perfect fit
- 0.5 = moderate fit
- 0.0 = poor fit

**Example:**
```javascript
const R2 = CurveFitting.calculateR2(data, A, B);
console.log(`R² = ${R2.toFixed(4)}`); // R² = 0.9856
```

#### `generateCurve(A, B, xMin, xMax, numPoints)`
Generates points along the fitted curve for visualization.

**Parameters:**
- `A` {number} - Linear coefficient
- `B` {number} - Quadratic coefficient
- `xMin` {number} - Minimum x value
- `xMax` {number} - Maximum x value
- `numPoints` {number} - Points to generate (default: 100)

**Returns:** {Array<{x: number, y: number}>} - Curve points

**Example:**
```javascript
const curve = CurveFitting.generateCurve(2.5, 0.8, 0, 2, 100);
// Returns 101 points from (0, 0) to (2, 2*2.5 + 0.8*4)
```

#### `plotWithCurve(canvasId, dataPoints, A, B, xlabel, ylabel, title)`
Creates an interactive scatter plot with fitted curve overlay using Chart.js.

**Parameters:**
- `canvasId` {string} - HTML canvas element ID
- `dataPoints` {Array<{x: number, y: number}>} - Experimental data
- `A` {number} - Linear coefficient
- `B` {number} - Quadratic coefficient
- `xlabel` {string} - X-axis label (e.g., "Velocity (m/s)")
- `ylabel` {string} - Y-axis label (e.g., "Pressure Loss (Pa)")
- `title` {string} - Chart title

**Example:**
```javascript
CurveFitting.plotWithCurve(
  'myCanvas',
  data,
  2.5,
  0.8,
  'Velocity (m/s)',
  'Pressure Loss (Pa)',
  'Porous Media Analysis'
);
```

#### `getTableData(tableId, xColIndex, yColIndex)`
Extracts numeric data from HTML table input elements.

**Parameters:**
- `tableId` {string} - HTML table element ID
- `xColIndex` {number} - Column index for x values (default: 0)
- `yColIndex` {number} - Column index for y values (default: 1)

**Returns:** {Array<{x: number, y: number}>} - Extracted data points

**Throws:** Error if table not found

**Example:**
```javascript
const data = CurveFitting.getTableData('dataTable', 0, 1);
// Reads from first two input columns in table rows
```

#### `performCurveFitting(dataPoints, L, density, viscosity, canvasId, resultsId, title, xlabel, ylabel)`
Main orchestration function that performs complete Darcy-Forchheimer analysis.

**Parameters:**
- `dataPoints` {Array<{x: number, y: number}>} - Input data
- `L` {number} - Sample length (meters)
- `density` {number} - Fluid density (kg/m³)
- `viscosity` {number} - Dynamic viscosity (Pa·s)
- `canvasId` {string} - Canvas element ID for plot
- `resultsId` {string} - Element ID for results display
- `title` {string} - Chart title
- `xlabel` {string} - X-axis label
- `ylabel` {string} - Y-axis label

**Returns:** {A: number, B: number, d: number, f: number, R2: number} | null
- `A` - Linear coefficient (Pa·s/m)
- `B` - Quadratic coefficient (Pa·s²/m)
- `d` - Darcy coefficient (m⁻²)
- `f` - Forchheimer coefficient (m⁻¹)
- `R2` - Goodness of fit metric
- Returns `null` if error occurs

**Example:**
```javascript
const results = CurveFitting.performCurveFitting(
  data,
  0.1,           // Sample length: 10 cm
  998,           // Water density at 20°C
  0.001,         // Water viscosity at 20°C
  'canvas1',
  'results1',
  'Porous Media Analysis',
  'Velocity (m/s)',
  'Pressure Loss (Pa)'
);

if (results) {
  console.log(`Permeability: ${(1/results.d).toFixed(9)} m²`);
}
```

## Mathematical Background

### Darcy-Forchheimer Equation
The pressure loss across a porous medium is described by:

$$\Delta P = \frac{\mu L}{K} v + \frac{\rho L}{F} v^2$$

Where:
- ΔP = pressure loss (Pa)
- μ = dynamic viscosity (Pa·s)
- L = sample length (m)
- K = permeability (m²)
- ρ = fluid density (kg/m³)
- F = Forchheimer coefficient (m⁻¹)
- v = velocity (m/s)

### Least-Squares Fitting
The module solves a 2×2 linear system to minimize the sum of squared residuals:

$$\min \sum_{i=1}^{n} (y_i - A x_i - B x_i^2)^2$$

This yields:
- **A** = viscous drag coefficient (Pa·s/m)
- **B** = inertial drag coefficient (Pa·s²/m)

### Coefficient Extraction

From fitted coefficients A and B:

$$d = \frac{A}{\mu L} \text{ (Darcy coefficient, m}^{-2}\text{)}$$

$$f = \frac{2B}{\rho L} \text{ (Forchheimer coefficient, m}^{-1}\text{)}$$

$$\kappa = \frac{1}{d} \text{ (Permeability, m}^2\text{)}$$

## Error Handling

All functions include error handling with descriptive messages:

```javascript
try {
  const result = CurveFitting.performCurveFitting(...);
} catch (error) {
  console.error('Curve fitting failed:', error.message);
  // Error messages include:
  // - "At least 3 data points required"
  // - "Table with id '...' not found"
  // - "Singular matrix - cannot solve for coefficients"
}
```

## Usage in HTML

Include Chart.js and this module:

```html
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script src="/scripts/curve_fitting/curve_fitting.js"></script>
```

Use in onclick handlers:

```html
<button onclick="CurveFitting.performCurveFitting(data, 0.1, 998, 0.001, 'canvas', 'results', 'Analysis', 'v (m/s)', 'ΔP (Pa)')">
  Fit Curve
</button>
```

## Output Format

Results display in HTML with formatted values:

```
Curve Fitting Results:
Linear Coefficient (A): 2.456789 Pa·s/m
Quadratic Coefficient (B): 0.123456 Pa·s²/m
R² (Goodness of Fit): 0.995678

Porous Media Properties:
Darcy Coefficient (d): 0.002457 m⁻²
Forchheimer Coefficient (f): 0.000247 m⁻¹
Permeability (κ): 0.000407025 m²
```

## Notes

- Requires at least 3 data points for reliable curve fitting
- R² > 0.9 indicates excellent fit; R² > 0.8 indicates good fit
- Chart instances are automatically cleaned up to prevent memory leaks
- All calculations assume SI units (meters, seconds, kilograms, Pascal)
