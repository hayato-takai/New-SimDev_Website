# Oil Property Calculator

A tool for calculating fluid properties (density, kinematic viscosity, dynamic viscosity) and thermal expansion at various temperatures using industry-standard methods.

## Features

- **Fluid selection** from a comprehensive database of hydraulic oils and fluids
- **Temperature range** input with unit conversion (°C, K, °F)
- **Calculated properties table** with per-column copy buttons and unit selectors
- **Thermal expansion** — fractional volume change (ΔV/V) over a temperature range
- **Mass & volume change** — computed from an optional base volume input

## UI Inputs

| Input | Description |
|-------|-------------|
| Fluid selector | Choose from available fluids in `fluid_data.json` |
| Temperature (min / max) | Single point, range, or leave empty for full range (-40°C to 100°C). Unit selectable. |
| Base volume | Optional. When provided, displays calculated mass and absolute volume change (ΔV). |

## Mathematical Background

### Density — Linear Thermal Expansion

$$\rho(T) = \rho_{15°C} \times (1 - \beta \times (T - T_{ref}))$$

- $\beta$ = per-fluid thermal expansion coefficient (from `fluid_data.json`, default 0.00065 K⁻¹)
- $T_{ref}$ = 288.15 K (15°C)

### Kinematic Viscosity — Walther Equation (ASTM D341)

$$\log_{10}(\log_{10}(\nu + 0.8)) = m \times \log_{10}(T) + n$$

Constants $m$, $n$ are derived from two reference viscosity-temperature points:

$$m = \frac{W_2 - W_1}{\log_{10}(T_2) - \log_{10}(T_1)}, \quad n = W_1 - m \times \log_{10}(T_1)$$

where $W_i = \log_{10}(\log_{10}(\nu_i + 0.8))$.

### Dynamic Viscosity

$$\mu = \nu \times \rho \times 10^{-6}$$

### Thermal Expansion (Volume Change)

$$\Delta V / V = \beta \times (T_{max} - T_{min})$$

### Mass from Volume

$$m = \rho_{15°C} \times V$$

## API Reference (`OilProps`)

| Function | Parameters | Returns | Description |
|----------|-----------|---------|-------------|
| `loadFluidData()` | — | `Promise<void>` | Loads fluid data from JSON |
| `getDensityAtTemp(name, tK)` | fluid name, temp in K | `number` (kg/m³) | Density via thermal expansion |
| `getKinViscAtTemp(name, tK)` | fluid name, temp in K | `number` (mm²/s) | Kinematic viscosity via Walther |
| `getDynViscAtTemp(name, tK)` | fluid name, temp in K | `number` (Pa·s) | Dynamic viscosity |
| `getThermalExpansionCoeff(name)` | fluid name | `number` (1/K) | Per-fluid β coefficient |
| `calcThermalExpansion(name, opts)` | fluid name, `{deltaT}` or `{tMin, tMax}` | `number` | Fractional volume change |
| `getFluidNames()` | — | `string[]` | Sorted list of fluid names |

## Unit Support

| Property | Available Units |
|----------|----------------|
| Temperature (input) | °C, K, °F |
| Temperature (table) | K, °C, °F |
| Kinematic viscosity | mm²/s, m²/s, cSt |
| Density | kg/m³, g/cm³, lb/ft³ |
| Dynamic viscosity | Pa·s, mPa·s, cP |
| Volume | L, m³, gal (US) |
| Mass | kg, g, lb |

## Data Format

```json
{
  "ISO VG 32": {
    "DensityAt15C": 865.0,
    "ThermalExpansionCoeff": 0.00065,
    "Kinematic Viscosity Limits": [
      { "temperature": 313.15, "kinematicViscosity": 28.8 },
      { "temperature": 373.15, "kinematicViscosity": 5.4 }
    ]
  }
}
```

## File Structure

```
oil_properties/
├── getOilProperties.js   — Core calculation library (OilProps API)
├── oil_properties.js     — UI controller (DOM, events, table rendering)
├── fluid_data.json       — Fluid property database
└── README.md             — This file
```

## Usage

### Browser (via the web page)

Scripts are loaded in order:
1. `unit_converter.js` — unit conversion helpers
2. `getOilProperties.js` — calculation engine
3. `oil_properties.js` — UI logic

### Node.js / CLI

```bash
node getOilProperties.js "ISO VG 32" 313.15
```

### Programmatic

```javascript
await OilProps.loadFluidData();
const density = OilProps.getDensityAtTemp("ISO VG 32", 313.15);
const kinVisc = OilProps.getKinViscAtTemp("ISO VG 32", 313.15);
const dynVisc = OilProps.getDynViscAtTemp("ISO VG 32", 313.15);
```

## Standards & References

- **ASTM D341** — Viscosity-Temperature Charts for Liquid Petroleum Products
- **ISO 3448** — Industrial liquid lubricants — ISO viscosity classification

## Version

Current version: 2.0.0
Last updated: May 2026
Author: Hayato Takai
