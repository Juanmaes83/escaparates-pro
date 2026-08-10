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

export const STATE_NAMES = Object.keys(DETERMINISTIC_STATES);
