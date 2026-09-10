# Method for determining Darcy and Forcheimer Coefficients for Porous Media

A comprehensive tool for calculating pressure loss through porous media using the Darcy–Forchheimer equation with curve fitting analysis.

## Overview

This document provides two methods for analyzing pressure loss through porous media:

1. **Darcy–Forchheimer Medium** - Uses velocity vs. pressure loss data to determine viscous and inertial loss coefficients
2. **Flow Rate–Based Porous Media Calculation** - Converts volumetric flow rate data to velocity and determines pressure loss characteristics

### Requirements
#### Experimental data
- **Recommended:** 5-10 data points for accurate curve fitting
- **Minimum:** 3 data points for curve determination
- **Special Case:** One point can be (0, 0) to ensure origin constraint

**Velocity-based input:**
| $u$ (m/s) | $\Delta P$ (Pa)|
|-------------|-------------|
| | |
| | |
| | |
| | |
| | |

**Flow rate-based input:**
| $Q$ (m^3/s) | $\Delta P$ (Pa)|
|-------------|-------------|
| | |
| | |
| | |
| | |
| | |
### Limitations

- Linear curve fitting assumes Darcy–Forchheimer behavior
- Results are valid only within the tested velocity/flow rate range
- Very high inertial effects may require higher-order polynomial fitting
- Fluid properties must be accurate for reliable results
- Does not account for temperature variations during flow

### Accuracy Considerations

1. **Minimize Measurement Uncertainty** - Use calibrated instruments for pressure and flow measurements
2. **Verify Temperature Stability** - Keep fluid temperature constant during testing
3. **Check Data Quality** - Remove obvious outliers before curve fitting
4. **Validate Results** - Compare calculated pressure loss with experimental data
5. **Flow Regime** - Data should span both laminar and turbulent regions for accurate coefficient determination
6. **Data Distribution** - Evenly distributed data points improve fitting accuracy


## Mathematical Background
### 1. Finding Darcy and Forscheimer Coefficients using Curve Fitting


The pressure loss through porous media is represented by the following equation 

$$ S= \Delta P = \underbrace{\mu \cdot d \cdot L \cdot u}_{\text{viscous term}} + \underbrace{\frac{1}{2} \cdot \rho \cdot f \cdot L \cdot u^2}_{\text{inertial term}}$$

where

- $S$ = Source term, A Pressure Gradient through the porous media (Pa/m)
- $\Delta P$ = Pressure drop (Pa)
- $\mu$ = Dynamic viscosity of fluid (kg/(m·s))
- $d$ = Darcy coefficient (inverse of permeability $\frac{1}{\kappa} $)
- $f$ = Forchheimer coefficient
- $L$ = Lenght / thickness of porous media (m)
- $u$ = Velocity of fluid (m/s)
- $\rho$ = Density of fluid (kg/m³)

This can be expressed by viscous and inertial force terms:

$$ S= \Delta P = ( P_i |u| + P_v )u$$
            $$ =   P_i |u^2| + P_v |u|$$

where

$$P_v = \mu \cdot d \cdot L$$
$$P_i = \frac{1}{2} \cdot \rho \cdot f \cdot L$$

#### Porous resistance coefficients:
$P_i$ is the inertial porous resistance coefficient. 
$P_v$ is the viscous porous resistance coefficient. 
The values for these resistance coefficients can be measured **experimentally** or derived using empircal relations.

#### Curve Fitting
$P_i$ and $P_v$ can be determined by **curve fitting the quadratic equation**: $$ \Delta P = P_v \cdot u + P_i \cdot u^2$$
This works because $u$ and $\Delta P$ are provided from experimental data. 

#### Darcy and Forscheimer Coefficients
Once $P_i$ and $P_v$ coefficients are found, Darcy $d$ and Forcheimer $f$ coefficients can be found using 

$$d = \frac{P_v}{\mu \cdot L}$$
$$f = \frac{2P_i}{\rho \cdot L}$$

### 2. Flow Rate to Velocity Conversion

When experimental data is collected as volumetric flow rate, convert to velocity:

$$u = \frac{Q}{A_c}$$

Where:
- $Q$ = Volumetric flow rate (m³/s)
- $A_c$ = Cross-sectional area (m²)
- $u$ = Velocity (m/s)
### Output Interpretation

#### Fitted Coefficients

- **$P_v$ (Viscous Coefficient)** - Represents the linear pressure loss component; larger values indicate higher viscous resistance
- **$P_i$ (Inertial Coefficient)** - Represents the quadratic pressure loss component; larger values indicate higher inertial resistance

#### Porous Media Characteristics

- **Darcy Coefficient (d)** - Related to permeability: $\kappa = 1/d$; lower values = more permeable
- **Forchheimer Coefficient (f)** - Represents inertial effects; higher values = more significant at high velocities

## Script
### Usage Guide

#### Method 1: Darcy–Forchheimer with Velocity Data

1. **Select Fluid Type** - Choose from available hydraulic fluids or manually enter fluid properties
2. **Set Operating Temperature** - Enter temperature in preferred unit (°C, °F, or K)
3. **Specify Porous Media Thickness** - Enter length (L) in meters
4. **Enter Velocity vs Pressure Loss Data** - Provide at least 3 data points:
   - Velocity (m/s)
   - Pressure Loss (Pa)
   - Optional: Include (0, 0) point for no-flow condition
5. **Calculate** - Click "Calculate" to determine A, B, d, and f coefficients

#### Method 2: Flow Rate to Velocity Conversion

1. **Set Up Parameters** - Follow Method 1 steps 1-3
2. **Enter Cross-Sectional Area** - Specify $A_c$ in m²
3. **Enter Flow Rate vs Pressure Loss Data** - Provide at least 3 data points:
   - Flow Rate Q (m³/s)
   - Pressure Loss (Pa)
   - Velocity will be automatically calculated
4. **Calculate** - Click "Calculate" to determine coefficients

### Fluid Integration
The calculator automatically retrieves fluid properties from the Oil Properties Calculator database:
- **Density at 15°C** - Reference density for thermal expansion calculations
- **Dynamic Viscosity** - Temperature-dependent viscosity using Walther equation
- **Temperature Range** - Supports -40°C to 100°C

## References

- **Forchheimer, P.** - Wasserbewegung durch Boden (1901) - Foundational work on porous media flow
- **Nakayama, A.** - Porosity and Porous Media - Modern porous media characterization methods



## License

This calculator is part of the hydraulic filtration website project.

## Version

Current version: 1.0.0
Last updated: February 2026
Author: Hayato Takai
Contact: hayato.takai@hydacusa.com


