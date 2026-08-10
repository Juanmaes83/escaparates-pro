/**
 * Immersive Worlds — Deterministic QA states
 *
 * Constitution §23: the runtime must expose named, repeatable states. Not
 * "navigate to roughly the third painting and take a screenshot" — a name, a
 * fixed pose, a fixed world state, reproducible on every run and on every
 * machine.
 *
 * These are the states the Playwright suite captures and compares. They are
 * also useful by hand: append `?state=museum:gallery-a-overview` to the URL.
 *
 * Every state is expressed in *semantic* operations plus one explicit camera
 * pose. Nothing here reaches into the Scene Kit.
 */

/** @typedef {import('../engine/core/runtime.js').Runtime} Runtime */

/**
 * @type {Record<string, {description:string, apply:(runtime:Runtime)=>Promise<void>|void}>}
 */
export const DETERMINISTIC_STATES = {
  'museum:lobby-entry': {
    description: 'Vestíbulo desde el punto de entrada, mirando hacia la puerta de la Galería A.',
    apply(runtime) {
      runtime.explore.setPose({ position: [0, 1.62, 3.1], yaw: Math.PI, pitch: -0.02 });
    }
  },

  'museum:lobby-welcome': {
    description: 'Panel de bienvenida del vestíbulo, con el banco en el encuadre.',
    apply(runtime) {
      runtime.explore.setPose({ position: [-2.2, 1.62, 0.4], yaw: -Math.PI / 2, pitch: -0.03 });
    }
  },

  'museum:gallery-a-overview': {
    description: 'Galería A desde el eje de entrada: la obra protagonista al fondo, las secundarias en los paramentos laterales.',
    async apply(runtime) {
      await runtime.traversePortal('portal.lobby-gallery-a', { source: 'QA' });
      // On the axis, where a visitor actually arrives. If the composition only
      // works from a chosen diagonal, it is not a composition.
      runtime.explore.setPose({ position: [-0.9, 1.62, -8.6], yaw: Math.PI, pitch: -0.015 });
    }
  },

  'museum:artwork-horizonte-focus': {
    description: 'Modo Focus sobre "Horizonte interrumpido" — encuadre calculado desde el tamaño semántico.',
    async apply(runtime) {
      await runtime.traversePortal('portal.lobby-gallery-a', { source: 'QA' });
      runtime.explore.setPose({ position: [-4.8, 1.62, -12.4], yaw: Math.PI, pitch: 0 });
      runtime.actions.dispatch(
        { type: 'FOCUS_ENTITY', target: 'entity.artwork.horizonte-interrumpido' },
        { source: 'QA' }
      );
    }
  },

  'museum:sculpture-detail': {
    description: 'Vasija de arenas sobre peana, encuadre de detalle.',
    async apply(runtime) {
      await runtime.traversePortal('portal.lobby-gallery-a', { source: 'QA' });
      runtime.explore.setPose({ position: [3.6, 1.62, -6.2], yaw: Math.PI, pitch: -0.12 });
      runtime.actions.dispatch(
        { type: 'FOCUS_ENTITY', target: 'entity.sculpture.vasija-de-arenas' },
        { source: 'QA' }
      );
    }
  },

  'museum:gallery-a-oblique': {
    description: 'Galería A en diagonal: ritmo lateral, escultura y banco en un mismo encuadre.',
    async apply(runtime) {
      await runtime.traversePortal('portal.lobby-gallery-a', { source: 'QA' });
      runtime.explore.setPose({ position: [-5.2, 1.62, -6.4], yaw: Math.PI - 0.62, pitch: -0.03 });
    }
  },

  'museum:portal-a-b-before': {
    description: 'Galería A frente al paso abierto hacia la Galería B, antes de cruzar.',
    async apply(runtime) {
      await runtime.traversePortal('portal.lobby-gallery-a', { source: 'QA' });
      runtime.explore.setPose({ position: [5.2, 1.62, -10], yaw: Math.PI / 2, pitch: -0.02 });
    }
  },

  'museum:portal-a-b-after': {
    description: 'Galería B recién cruzado el paso: sala oscura, perfil visual distinto, mismos contratos.',
    async apply(runtime) {
      await runtime.traversePortal('portal.lobby-gallery-a', { source: 'QA' });
      await runtime.traversePortal('portal.gallery-a-gallery-b', { source: 'QA' });
      runtime.explore.setPose({ position: [12.4, 1.62, -11.2], yaw: Math.PI - 0.5, pitch: -0.02 });
    }
  },

  'museum:archive-teleport': {
    description: 'Archivo, alcanzado por un portal TELEPORT desde la Galería A. Perfil heritage.',
    async apply(runtime) {
      await runtime.traversePortal('portal.lobby-gallery-a', { source: 'QA' });
      await runtime.traversePortal('portal.gallery-a-archive', { source: 'QA' });
      runtime.explore.setPose({ position: [-10.2, 1.62, -10], yaw: -Math.PI / 2, pitch: -0.05 });
    }
  },

  'museum:guide-accompanied': {
    description: 'Parada acompañada: el guía presenta «Horizonte interrumpido» y la cámara mira por encima de su hombro.',
    async apply(runtime) {
      await runToStep(runtime, 'step.04-horizonte');
      // The guide moves toward its staging over a few frames; settle it so the
      // capture is of the composition, not of the guide arriving in it.
      await settleGuide(runtime);
    }
  },

  'museum:guide-handoff': {
    description: 'Cesión: el guía se aparta, la cámara entra en el punto de vista del visitante y la obra queda sola.',
    async apply(runtime) {
      await runToStep(runtime, 'step.04b-horizonte-cesion');
      await settleGuide(runtime);
    }
  },

  'museum:guide-released': {
    description: 'Después de la cesión: recorrido abandonado, el guía se retira y el visitante queda con la obra.',
    async apply(runtime) {
      await runToStep(runtime, 'step.04b-horizonte-cesion');
      runtime.exitRoute();
      await settleGuide(runtime);
    }
  },

  'museum:guided-step-04': {
    description: 'Recorrido comentado detenido en la parada 4: cámara bajo autoridad DIRECTED.',
    async apply(runtime) {
      runtime.startRoute('route.comentado');
      // Advance to the fourth step without waiting out the authored durations.
      for (let i = 0; i < 3; i += 1) {
        runtime.experience.next();
        await settleMicrotasks();
      }
      runtime.experience.pause();
    }
  },

  'museum:guided-completed': {
    description: 'Recorrido terminado: la cámara vuelve al visitante y el estado del mundo conserva lo visitado.',
    async apply(runtime) {
      runtime.startRoute('route.comentado');
      for (let i = 0; i < 9; i += 1) {
        runtime.experience.next();
        await settleMicrotasks();
      }
    }
  }
};

/** Portal traversal is async; give queued promises a chance to resolve. */
function settleMicrotasks() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Advance the commented route to a named step and hold there.
 *
 * By step id rather than by counting `next()` calls, so inserting a beat into
 * the route does not silently retarget every state that came after it.
 */
async function runToStep(runtime, stepId) {
  runtime.startRoute('route.comentado');
  for (let i = 0; i < 24; i += 1) {
    if (runtime.experience.currentStep?.id === stepId) break;
    runtime.experience.next();
    // Real time, not a microtask. A portal step has to build and warm a Space
    // before its shot can be framed, and on completion the traversal places the
    // camera at the arrival anchor. Skipping ahead within the same tick lets
    // that arrival land *after* a later step has already framed its shot, and
    // the room you end up looking at is the one you walked into rather than the
    // one the step is about. A visitor waiting out the step durations never
    // races it; a QA state that advances instantly does.
    await settleStep();
  }
  runtime.experience.pause();
}

/**
 * Long enough for a portal step to finish arriving.
 *
 * A fixed wait rather than a lifecycle poll: the thing being waited on is the
 * tail of a promise chain that ends in a camera placement, and the Space being
 * READY is not the same event. Polling the lifecycle returned before the
 * arrival landed and the state captured the wrong room.
 */
function settleStep() {
  return new Promise((resolve) => setTimeout(resolve, 300));
}

/**
 * Let the guide reach its staging.
 *
 * It approaches its target exponentially, so it is always strictly *near* the
 * pose and never exactly on it. A capture taken mid-approach would be evidence
 * of the wrong thing, so the state drives the same update the frame loop drives
 * until the remaining distance stops mattering.
 */
function settleGuide(runtime) {
  return new Promise((resolve) => {
    for (let i = 0; i < 180; i += 1) runtime.sceneKit.update?.(1 / 60, i / 60);
    setTimeout(resolve, 0);
  });
}

export const STATE_NAMES = Object.keys(DETERMINISTIC_STATES);
