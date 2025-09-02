# AI Car — Continuous Control + Simple Neuro-evolution

A modernised fork of my old “self-driving car (no libraries)” code-along by Professor Radu Mariescu-Istodor.
This version upgrades perception, switches to **continuous controls**, adds a **generational training loop**, randomises traffic each generation, fixes/rewrites the **network visualiser**, and ships with a **runtime control panel + stats HUD**.

View it here:
https://kierzio.github.io/ai-car-neural-net-2025/

View the original version here:
https://github.com/kierzio/ai-car-neural-net

---

## What it does

* **Drive loop:** A car navigates a multi-lane scrolling road with random slow traffic.
* **Sensors:** 9 rays, \~225° spread, 260px length for side + partial rear awareness (better for overtakes).
* **Network:** 9-12-3 MLP, `tanh` activations. Outputs are continuous:

  * `thr` (throttle) ∈ \[0..1], `ste` (steer) ∈ \[-1..1], `brk` (brake) ∈ \[0..1].
* **Evolution:** Population evolves every generation with elitism + mutation; best models auto-save.
* **Randomised traffic:** New layout/speeds each generation to avoid overfitting.
* **Visualisation:** Clean network visualiser with labels for `thr/ste/brk`.
* **HUD:** On-canvas overlay shows **lane offset** and **front gap** for the *best* car.
* **Control Panel:** Tweak **Population**, **Generation (s)**, **Mutation** at runtime. Live stats and one-click **Next Generation**.

---

## Quick start

```bash
cd ai-car-neural-net
python3 -m http.server 8000
# then open: http://localhost:8000
```

**Keyboard (manual mode):** Arrow keys.
**AI mode:** Default; evolution runs automatically.

---

## Using the control panel (top-left)

* **Population** — Number of AI cars per generation. Higher explores more behaviours but runs slower.
* **Generation (s)** — Time limit before evolving (or earlier if most cars crash). Longer = more time to attempt overtakes; shorter = faster iterations.
* **Mutation** — How much brains change when evolving. Higher explores more (noisier); lower refines (more stable).

Click **Apply & Restart** to use new values.
Click **Next Generation** to evolve immediately.

**Save / Reset (middle buttons):**
**Save** stores the current **best** brain in `localStorage` for reuse after reload.
**Reset** clears the saved brain for a fresh training run.

---

## Core files

```
ai-car-neural-net/
├─ index.html           # UTF-8, canvases + control panel + buttons
├─ style.css            # Layout + panel styling + HUD tweaks
├─ main.js              # Loop, evolution, traffic, UI wiring, stats, HUD
├─ car.js               # Continuous controls, physics, sensor inputs -> NN outputs
├─ sensor.js            # 9 rays, 260px, ~225° spread, readings -> offsets
├─ network.js           # 9-12-3, tanh activations, feed-forward
├─ visualizer.js        # Network drawing with labels and bias rings
└─ (helpers: Road, Controls, utils e.g., lerp, getRGBA — as in the classic project)
```

---

## Technical details

### Sensors

* `rayCount = 9`, `rayLength = 260`, `raySpread ≈ 1.25π`
* Readings mapped to inputs as **proximity** (`0` when no hit, otherwise `1 - offset`), giving higher values for nearer obstacles.

### Neural network

* **Topology:** `[inputs=9, hidden=12, outputs=3]`
* **Activation:** `tanh` everywhere (continuous outputs ∈ (-1, 1))
* **Output mapping:**
  `thr = (out0 + 1)/2`, `ste = out1`, `brk = (out2 + 1)/2`

### Vehicle model (continuous)

* **Throttle/Brake:** additive on speed with friction; capped by `maxSpeed`.
* **Steer:** analog, scaled by speed sign for realistic reversing yaw.

### Evolution loop

* Default settings in `main.js` (overridden by the UI):

  * `POP_SIZE = 150`, `GENERATION_MS = 15000`, `ELITES = 5`, `MUTATION = 0.2`
* **Generation ends** when:

  * Time limit elapses **or**
  * Alive cars ≤ max(2, 5% of population)
* **Selection:** rank by fitness
  `fitness = -car.y + car.speed * 50` (progress forward + a small speed reward)
* **Repopulation:** elites copied first; remainder are mutated children from random elites.

### Traffic

* Random lane placement, spacing, and (slow) speeds per generation to nudge overtaking behaviours and avoid memorisation.

---

## Saving & compatibility

* **Auto-save best brain:** Whenever a new fitness high is reached, the brain is stored in `localStorage` (`bestBrain`).
* **Manual Save/Reset:** via on-screen buttons (plain text labels to avoid OS emoji encoding problems).
* **Version guard:** On load, the app checks if a saved brain matches the **current** network shape (9-12-3). If not, it’s ignored to prevent crashes.

---

## HUD & stats

* **HUD (car canvas):** lane offset (px from lane centre) and front gap (px from the central ray). Shows `inf` if clear.
* **Stats (panel):** `Gen`, `Alive/Total`, `Best` fitness so far.
* **Next Generation** button: force evolution immediately (useful for tuning).

---

## Troubleshooting

* **Weird characters / emojis not rendering:**
  The app sets `<meta charset="utf-8">` and uses **text** labels for Save/Reset. If you re-introduce emojis, keep UTF-8 and avoid “smart quotes”.
* **Stale saved brain after big code changes:** Click **Reset** to clear `localStorage`, or just rely on the shape-check (incompatible brains are ignored).
* **Performance:** Large populations will hammer the browser’s single thread. Start at 80–150 and adjust.

---

## Tuning tips (practical)

* Start with `Population=120`, `Generation=12–18s`, `Mutation=0.20–0.30`.
* If cars fail to overtake or get twitchy: **lower mutation** to \~0.15 and/or **increase generation time**.
* If convergence stalls: bump mutation slightly (e.g., +0.05) or **increase population**.
* For lane-keeping issues: increase sensor density (code: `sensor.js`) or reduce steering gain (code: `car.js` line with `this.angle+=0.03*...`).

---

## Roadmap (next sensible upgrades)

* Penalise tailgating; reward safe completed overtakes (better fitness shaping).
* Add side-gap / relative-speed inputs for more informed lane changes.
* Optional: discrete + continuous hybrid control (e.g., explicit lane-change intent).

---

## Credits

* Inspired by the original “Self-driving car (no libraries)” series by **Professor Radu Mariescu-Istodor**.
* This fork reworks sensors, control model, evolution, UI, and visualisation.


View it here:
https://kierzio.github.io/ai-car-neural-net-2025/
