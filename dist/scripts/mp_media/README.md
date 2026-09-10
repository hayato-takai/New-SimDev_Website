# MP Media Calculator

Sizing for filter media packs. Given a pleat geometry and a media panel (MP)
width, the tool returns the media area and slit length of the pack, and how
many MPs can be cut from a master media panel (MMP) of a given width.

Two pleating styles are covered, one per tab:

- **Helios pleating** — alternating high and low pleats, entered as a block count.
- **Standard pleating** — uniform pleat height, entered as a pleat count.

All results update live as the inputs change.

## Conventions

| Convention | Value |
|---|---|
| Length input | mm |
| Media area output | cm² |
| Slit length output | m |
| Edge allowance on every MMP | 70 mm |
| Rounding | Excel `ROUND` — half away from zero |

Areas are computed in mm² and multiplied by $0.01$ to reach cm²
($1\ \text{cm}^2 = 100\ \text{mm}^2$). Slit lengths are summed in mm and divided
by $1000$ to reach metres.

The `ROUND` behaviour matters: JavaScript's `Math.round` breaks ties toward
positive infinity, so $-2.5$ becomes $-2$. Excel rounds halves away from zero,
giving $-3$. The tool reimplements the Excel behaviour, with a small epsilon
nudge so values that are mathematically exact but hold a binary-floating-point
error (a stored $2.4999999999999996$ where $2.5$ was meant) still round the way
the spreadsheet does.

---

## Helios Pleating

### Inputs

| Input | Symbol | Default | Description |
|---|---|---|---|
| High Pleat | $H$ | 11 mm | Height of the tall pleat |
| Block Count | $B$ | 42 | Number of alternating blocks |
| MP Width | $W$ | 1200 mm | Width of the media panel |
| MMP Width | $W_{mmp}$ | 1100 mm | Width of the master media panel |
| MP Width (pack) | $W_{mp}$ | 64.5 mm | Packed width of one MP |

### Low pleat

The low pleat is not entered — it is derived from the high pleat, using two
rules taken from the source spreadsheet:

$$
L =
\begin{cases}
H - 1.3 & H < 16 \\
H - 2.0 & H \ge 16
\end{cases}
$$

The panel under the inputs states which rule is currently active.

### Outputs

$$\text{Total Blocks} = 2B + 5$$

$$\text{Media Area} = \operatorname{ROUND}\!\left(0.01 \times \left(10 H W + 2 B (H + L) W\right),\ 0\right)$$

$$\text{Slit Length} = \operatorname{ROUND}\!\left(\frac{10 H + 2 B (H + L)}{1000},\ 3\right)$$

Both expressions carry the same two terms: a fixed five-block allowance
(the $10H$, i.e. $5 \times 2H$) plus the alternating stack ($2B$ blocks at
$H + L$). The area form simply multiplies each by the MP width $W$.

---

## Standard Pleating

### Inputs

| Input | Symbol | Default | Description |
|---|---|---|---|
| Pleat Height | $H$ | 14.5 mm | Uniform pleat height |
| Pleat Count | $N$ | 53 | Number of pleats |
| MP Width | $W_{mp}$ | 176 mm | Width of one media panel |
| MMP A / B / C | $W$ | 950 / 1100 / 1200 mm | Master panel widths to compare |

### Outputs

Slit length depends only on the pleat geometry, so it is **identical across
every column**:

$$\text{Slit Length} = \operatorname{ROUND}\!\left(\frac{2 H N}{1000},\ 3\right)$$

Media area at any width $W$:

$$A(W) = 0.01 \times 2 H N W$$

The **Single MP** column evaluates $A$ at the MP's own width, with no packing —
it is the reference against which the three MMP columns are read. For each MMP
width $W$:

| Row | Formula |
|---|---|
| MMP Media Area | $A(W)$ |
| MP Count | see below |
| Waste | $W - 70 - W_{mp} \times \text{Count}$ |
| MP Media Area | $\operatorname{ROUND}\!\left(A(W) / \text{Count},\ 0\right)$ |

---

## MP packing

Both tabs use the same packing rule. After the 70 mm edge allowance is removed,
the usable width is divided by the MP width:

$$\text{Count} = \operatorname{ROUNDDOWN}\!\left(\frac{W - 70}{W_{mp}},\ 0\right) - \begin{cases} 1 & \text{if } (W - 70) \bmod W_{mp} = 0 \\ 0 & \text{otherwise} \end{cases}$$

$$\text{Remainder} = \left(\frac{W - 70}{W_{mp}}\right) \bmod 1$$

**The exact-division case is deliberate.** When the usable width divides evenly
into the MP width, the count drops by one rather than taking the perfect fit.
A cut landing exactly on the panel edge leaves no material for that last
division, so the spreadsheet discards it. This is the one result most likely to
look like an off-by-one error, so it is worth checking against the worked
example below before treating it as a bug.

---

## Worked examples

### Helios, at the defaults

$H = 11$, $B = 42$, $W = 1200$:

- $H < 16$, so $L = 11 - 1.3 = 9.7$ mm
- Total Blocks $= 2(42) + 5 = 89$
- Media Area $= 0.01 \times (10 \cdot 11 \cdot 1200 + 84 \cdot 20.7 \cdot 1200) = 0.01 \times 2{,}218{,}560 = 22{,}186$ cm²
- Slit Length $= (110 + 1738.8) / 1000 = 1.849$ m

With $W_{mmp} = 1100$ and $W_{mp} = 64.5$: $(1100 - 70) / 64.5 = 15.969$, which
is not exact, so Count $= 15$ and Remainder $= 0.9690$.

### Standard, MMP A — the exact-division case

$H = 14.5$, $N = 53$, $W_{mp} = 176$, $W = 950$:

- Slit Length $= 2(14.5)(53) / 1000 = 1.537$ m
- MMP Media Area $= 0.01 \times 1537 \times 950 = 14{,}601.50$ cm²
- $(950 - 70) / 176 = 880 / 176 = 5$ **exactly**, so Count $= 5 - 1 = 4$
- Waste $= 950 - 70 - 176(4) = 176$ mm — one full MP width
- MP Media Area $= \operatorname{ROUND}(14601.50 / 4) = 3650$ cm²

### Standard, MMP B and C

| | MMP B (1100 mm) | MMP C (1200 mm) |
|---|---|---|
| MMP Media Area | 16,907.00 cm² | 18,444.00 cm² |
| Slit Length | 1.537 m | 1.537 m |
| MP Count | 5 | 6 |
| Waste | 150 mm | 74 mm |
| MP Media Area | 3381 cm² | 3074 cm² |

---

## Behaviour notes

- Leaving a required field blank blanks the affected outputs and shows a message
  explaining which inputs are needed, rather than displaying a misleading zero.
- On the Helios tab the MP-per-MMP block is optional: its two outputs stay blank
  until both MMP Width and MP Width (pack) hold usable positive numbers.
- A Standard MMP column whose width is cleared blanks only that column; the
  others keep calculating.
- Where a count would fall below one, the dependent cells blank rather than
  dividing by zero.

## Files

```
src/pages/tools/MP_Media_Calculator.astro   — markup, styles and calculation script
public/scripts/mp_media/README.md           — this file
public/images/pleat_types.jpg               — pleat comparison diagram
```

The calculation script is inline in the `.astro` page rather than sitting in
`public/scripts/`, so there is no separate `.js` file for this tool.
