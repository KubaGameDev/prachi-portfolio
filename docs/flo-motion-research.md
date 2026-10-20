# Flo motion and balance feedback

Research checked 20 October 2026. This note separates source guidance from settings chosen for this website.

## Sources and design implications

- Activision's [official Tony Hawk's Pro Skater 1 + 2 guide](https://blog.activision.com/tony-hawk/2020-08/THPS-Demo-Everything-You-Need-to-Know) describes maintaining a manual with directional commands; excessive lean ends the stance or causes a bail. Flo uses the same readable balance-and-correction idea. Her existing force, damping, wave disturbance and recovery rules remain unchanged.
- Eddie Lee of Funktronic Labs recommends immediate visual acknowledgement of deliberate gestures and clear feedback about their effect in [Developing Apps in 3D, page 12](https://media.gdcvault.com/ADC2013/slides/EddieLee_DevelopingAppsIn3D.pdf). The input ring therefore tracks the applied command each display frame, independently of slower score and instruction updates.
- Chris Hurtt explains how a preparatory action helps the audience anticipate the next movement in [Animation Mentor: Anticipation](https://www.animationmentor.com/blog/anticipation-the-12-basic-principles-of-animation/). Flo's glance and small wind-up precede her cursor-following swim; her root stays held during that preparation.
- Dave Burgess describes using different pose holds and transition durations to convey intent, weight and energy in [Animation Mentor: Timing](https://www.animationmentor.com/blog/timing-the-12-basic-principles-of-animation/). Flo uses a held preparation, faster swim action and settling beat instead of giving every drawing the same duration.

## Two circles, two meanings

The small filled gold dot is **Flo's actual lean**. The larger aqua outline is **the player's applied input**. Both use screen-relative left/right, with zero at the meter's center. Shape, size and the “Flo’s lean / Your correction” legend distinguish them as well as color.

The objective is to keep Flo near the center, not to match the rings. Input changes acceleration, so Flo can continue moving after a correction. Placing the input ring on the same side as an outward lean can make it worse. A strong corrective input is valid; danger styling follows Flo's lean rather than the input ring's distance from center.

`getBalanceFeedback(lean, velocity, input)` returns guidance without changing physics. It considers a short projected lean, `lean + 0.4 * velocity`. It recommends an opposite correction for projected drift, asks the player to ease off when recovery is already approaching center, and can recommend braking in the other direction when momentum would carry Flo beyond center. Near center with little motion, neutral input reads “Steady”; continued input reads “Ease off”.

## Settings chosen for Flo

- The companion's **440 ms hesitation** is our authored duration for a readable glance/hold/wind-up. Animation Mentor supports intentional anticipation and timing, but does not prescribe this number.
- The feedback function's **0.4 second projection** is our practical cue heuristic, not an exact future simulation or a value specified by the sources. It does not predict upcoming wave forces.
- The center and cue thresholds, **180 ms text hold**, marker styling and response strengths are local design choices. Markers follow live state; the held cue text avoids rapid direction flicker. State gating and text timing belong to the renderer, outside the pure function.
- The existing simulation continues to run in bounded fixed steps. Advice does not steer Flo automatically, change difficulty, delay input or alter scoring.

## Forward travel refinement

The camera and horizon remain fixed while water streams down-left behind the
rightward curl. Foreground foam moves faster and stretches farther than distant
reflections. Seven short wake curves peel from the shoulder into the submerged
base, staying inside the wave's allocated height above the controls. Reflections
are painted after the opaque water bands so they remain visible.

A continuous travel clock eases from 0.42 at idle to 1 during balancing; changing
speed does not reset or jump the foam phase. Flo inclines at most 0.03 radians
(about 1.7 degrees) into the ride near neutral. That decorative angle fades out
by an actual lean of 0.3, leaving the player's balance clear. Surfing poses rotate
around the registered tail contact, keeping Flo attached to the crest. Pause
freezes the travel clock; reduced motion suppresses travel and the added incline.

## Verification

All 44 controller/core unit checks pass, including opposite-direction correction,
release during recovery, velocity-led braking, mirrored left/right behavior and
invalid-value fallbacks. The companion holds for the complete anticipation beat
at 30, 60, 120 and 144 Hz. Real-browser observations measured 442–448 ms.

The full Flo browser suite and focused balance-feedback checks pass: immediate
keyboard and touch input, actual-lean inertia, reversing and releasing corrections,
distinct coincident circles, pause, reduced motion, resize and wave/HUD clearance.
An unfinished upward touch swipe freezes the game and suppresses correction advice
until input resumes. No browser runtime errors were observed.

Desktop and 320px portrait screenshots were visually reviewed, alongside 844px
landscape. The 320×568 viewport uses the existing taller hero; the dive and pause
controls remain reachable with a short scroll. See `previews/flo-balance-feedback-desktop.png`
and `previews/flo-balance-feedback-mobile.png`.

The forward-travel pass also passed four viewport layout checks, active water
pixel comparisons, exact paused/reduced-motion pixel stability, and a keyboard
score/feedback smoke check. The wave retains its 1.6 ratio and stays clear of the
HUD. See `previews/flo-forward-surfing.png` for the active-game composition.
