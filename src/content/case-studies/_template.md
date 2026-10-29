---
# ---------------------------------------------------------------------------
# Case study template
#
# 1. Copy this file in this folder and rename it, e.g. rft-retrofit-loader.md.
#    The file name becomes the page address: /case-studies/rft-retrofit-loader
#    (any name except admin.md — /case-studies/admin is the drafts page).
# 2. Fill in the fields below. Lines starting with # are notes — delete them.
# 3. Leave draft: true while writing. A draft is hidden from the case studies
#    page and listed only on /case-studies/admin. Set draft: false to publish.
#    Drafts still get a page on the live site: anyone with its link can open
#    it, so keep unapproved customer details out of them too.
#
# Files whose name starts with "_", like this one, never become pages.
# Only use numbers and images the customer has approved for publication.
# ---------------------------------------------------------------------------

# Sentence case, specific, result first.
title: "Air-X retrofit cuts oil volume by a quarter on a wheel loader"

# One or two sentences: the machine, the problem and the outcome.
# Shown on the overview card and under the page title.
summary: "Replace this with the summary."

# Project completion date, YYYY-MM-DD. The overview lists newest first.
date: 2026-01-01
draft: true

# Name the customer only with their approval; otherwise leave Confidential.
customer: Confidential
industry: "Construction equipment"
application: "Wheel loader hydraulic tank"

# Air-X model used: RFB Compact, RFB, RFT Compact or RFT. It links to the
# catalog PDF in the project facts. Delete the line if no Air-X filter.
filter: RFT

# What the project covered, one item per line.
scope:
  - Deaeration analysis
  - Air-X retrofit
  - Tank downsizing

# The preview image: the case study's card on the overview page, and the
# image beside the title on its own page. It fills a 4:3 frame, cropped to
# fit, so a landscape 4:3 image works best. Until it is added both places
# show a placeholder. Put the file in ./images/ and uncomment the block.
# preview:
#   src: ./images/my-project-preview.png
#   alt: "Describe what the image shows"

# The baseline tank and the concept tank, shown side by side. Until an image
# is added the page shows a placeholder in its place. To add them, put the
# files in ./images/ next to this file and uncomment the block.
# images:
#   baseline:
#     src: ./images/my-project-baseline.png
#     alt: "Describe the baseline tank"
#   concept:
#     src: ./images/my-project-concept.png
#     alt: "Describe the concept tank"

# The single result that leads the overview card.
headline:
  value: "−25%"
  label: "oil volume"

# The savings cards at the top of the page, baseline tank vs. concept tank.
# Plain numbers: unit goes after the number (120 L), prefix before it (€240).
# The change badge is the percentage, worked out for you; add change: to word
# it yourself, e.g. "−8 kg".
# oilVolume is required — it is also the bar under the tank images. The other
# three are optional; delete a line to leave its card out.
# CO₂ for the oil fill: litres × 2.83 kg CO₂ per litre (23.62 lb per US
# gallon, the factor the Value Hypothesis calculator uses).
results:
  oilVolume: { baseline: 120, concept: 90, unit: L }
  tankWeight: { baseline: 48, concept: 40, unit: kg, change: "−8 kg" }
  oilCost: { baseline: 240, concept: 180, prefix: "€" }
  co2: { baseline: 340, concept: 255, unit: kg }
---

## The challenge

What the machine does, what the customer needed and why: aeration symptoms
(pump noise, cavitation, filter bypass), a tank that has to shrink, or a new
design to validate before building a prototype. Give the operating point:
flow rates, oil grade and temperature, tank and oil volume.

## The analysis

How the tank was assessed: the geometry modelled, the steady-state flow at the
operating point, and Lagrangian bubble tracking from the return ports. Say
what the flow field showed, for example a return jet reaching the surface or
dead zones, and how the baseline compared with the objective.

## The solution

The design change and why it works: the Air-X model and its position, port
changes, baffles or standpipes, and how much oil volume could be removed while
keeping the oil level and suction submergence.

## The result

The outcome in numbers, matching the results above, and what it means for the
customer: lighter tank, less oil per fill, simpler build, no prototype loop.
