---
# Example entry to show the layout. It stays a draft, so it is listed only on
# /case-studies/admin, never on the case studies page.
# Figures: the website's approved "Original vs. Optimised Tank" case study,
# except CO₂, which is derived from the oil volumes (see results below).
# No images yet, so the page shows placeholders.
title: "Example: Air-X retrofit shrinks a hydraulic tank by 25%"
summary: "An example entry showing the case study layout, filled with the approved original vs. optimised tank figures and a CO₂ figure derived from the oil volumes."
date: 2026-10-01
draft: true

customer: Example customer
industry: Example industry
application: Hydraulic tank
filter: RFT
scope:
  - Deaeration analysis
  - Air-X retrofit
  - Tank downsizing

headline:
  value: "−25%"
  label: "oil volume"

results:
  oilVolume: { baseline: 120, concept: 90, unit: L }
  tankWeight: { baseline: 48, concept: 40, unit: kg, change: "−8 kg" }
  oilCost: { baseline: 240, concept: 180, prefix: "€" }
  # Not an approved figure: the oil volumes × 2.83 kg CO₂ per litre (23.62 lb
  # per US gallon, the factor the Value Hypothesis calculator uses), rounded.
  co2: { baseline: 340, concept: 255, unit: kg }
---

## The challenge

The tank carried extra oil for one reason: to slow the return flow and buy the
residence time that entrained air needs to rise out. A high-velocity return jet
reached the free surface, splashed and entrained more air, and the oil volume
grew as a safety margin against poor deaeration.

## The analysis

The fluid volume was built from the customer CAD model and the steady-state oil
flow solved at the operating point. Air bubbles were then injected at the return
port as Lagrangian particles, ten diameters from 0.2 to 2.0 mm with 200 bubbles
each, and tracked through the flow under drag and buoyancy. A bubble that
reaches the free surface is deaerated; one that reaches the suction port is
ingested by the pump.

## The solution

An Air-X return filter slows and distributes the return flow, turning the
high-energy jet into a controlled, low-velocity cascade that promotes bubble
rise without surface splash. Its coalescence screen merges micro-bubbles into
larger, faster-rising ones, so air separates close to the filter. That let the
excess oil volume go while the oil level and suction submergence stayed the
same.

## The result

Oil volume fell from 120 L to 90 L, the tank lost 8 kg, and each oil fill costs
25% less.
