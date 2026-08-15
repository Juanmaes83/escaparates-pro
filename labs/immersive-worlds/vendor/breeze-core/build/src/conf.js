/**
 * MUSEUM SHIM — not Breeze source.
 *
 * The donor's `src/conf.js` is a Tweakpane control panel: it constructs a
 * floating GUI, an FPS graph, a scene dropdown and the sliders that drive the
 * standalone Breeze demo. Porting it is explicitly forbidden — the Museum has
 * one HUD, and a second free-floating panel over a Tour Stop is not a room, it
 * is a debug build shown to a visitor.
 *
 * Only two of that object's fields ever reach the physics, and both are plain
 * numbers read every frame:
 *
 *   verletPhysics.js:106  uniform(conf.stiffness)
 *   verletPhysics.js:107  uniform(conf.friction)
 *   verletPhysics.js:298  const { stiffness, friction } = conf;
 *
 * So this module stands in for the whole panel with the two numbers, keeping
 * `verletPhysics.js` byte-identical to the donor rather than patching the
 * import out of it. A diff against the donor is then an empty diff, which is
 * the property that makes "this is the real Breeze physics" checkable instead
 * of asserted.
 *
 * The defaults are the donor's own (`stiffness = 0.25`, `friction = 0.5`). The
 * Museum adapter may write them between frames; there is no GUI and no
 * listener, because room parameters are authored, not knob-twiddled at runtime.
 */
class BreezePhysicsConfig {
  /** Spring stiffness. Donor default; donor GUI range was 0.1 … 0.5. */
  stiffness = 0.25;

  /** Collider friction. Donor default; donor GUI range was 0.0 … 1.0. */
  friction = 0.5;
}

export const conf = new BreezePhysicsConfig();
