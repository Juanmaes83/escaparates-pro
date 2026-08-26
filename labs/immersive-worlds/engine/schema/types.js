/**
 * Immersive Worlds — Semantic schema
 *
 * This file is the vocabulary of the engine. It contains no rendering concept
 * of any kind: no mesh, no material, no Three.js, no DOM.
 */

export const RECORD = Object.freeze({
  SPACE: 'SPACE', ANCHOR: 'ANCHOR', ENTITY: 'ENTITY', HOTSPOT: 'HOTSPOT', PORTAL: 'PORTAL', ROUTE: 'ROUTE', CHAPTER: 'CHAPTER', STORY_STEP: 'STORY_STEP'
});

export const ENTITY_KIND = Object.freeze({ ARTWORK: 'ARTWORK', SCULPTURE: 'SCULPTURE', VIDEO: 'VIDEO', PROJECTION: 'PROJECTION', AUDIO: 'AUDIO', TEXT: 'TEXT', OBJECT_3D: 'OBJECT_3D' });
export const ANCHOR_KIND = Object.freeze({ WALL: 'WALL', FLOOR: 'FLOOR', PLINTH: 'PLINTH', SPAWN: 'SPAWN', VIEWPOINT: 'VIEWPOINT', FREE: 'FREE' });
export const HOTSPOT_TYPE = Object.freeze({ INFO: 'INFO', MEDIA: 'MEDIA', PORTAL: 'PORTAL', ACTION: 'ACTION', STORY: 'STORY' });
export const HOTSPOT_STATE = Object.freeze({ HIDDEN: 'HIDDEN', AVAILABLE: 'AVAILABLE', NEAR: 'NEAR', HOVER: 'HOVER', ACTIVE: 'ACTIVE', VISITED: 'VISITED', NEXT_ROUTE: 'NEXT_ROUTE' });
export const ACTION = Object.freeze({ FOCUS_ENTITY: 'FOCUS_ENTITY', RELEASE_FOCUS: 'RELEASE_FOCUS', OPEN_INFO: 'OPEN_INFO', PLAY_MEDIA: 'PLAY_MEDIA', ACTIVATE_PORTAL: 'ACTIVATE_PORTAL', START_ROUTE: 'START_ROUTE', TRIGGER_STORY: 'TRIGGER_STORY', SET_STATE: 'SET_STATE' });
export const TRANSITION_BEHAVIOUR = Object.freeze({ CONTINUOUS: 'CONTINUOUS', CUT: 'CUT', TELEPORT: 'TELEPORT', CINEMATIC: 'CINEMATIC' });
export const REPRESENTATION_HINT = Object.freeze({ DOOR: 'DOOR', OPENING: 'OPENING', SCREEN: 'SCREEN', ARTWORK: 'ARTWORK', WINDOW: 'WINDOW', NONE: 'NONE' });
export const SHOT_INTENT = Object.freeze({ ENTRY: 'ENTRY', OVERVIEW: 'OVERVIEW', LEAD: 'LEAD', ACCOMPANIED: 'ACCOMPANIED', CONTEMPLATION: 'CONTEMPLATION', FOCUS: 'FOCUS', DETAIL: 'DETAIL', PORTAL: 'PORTAL', EXIT: 'EXIT' });
export const SPACE_STATE = Object.freeze({ UNLOADED: 'UNLOADED', PRELOADING: 'PRELOADING', WARMING: 'WARMING', READY: 'READY', ACTIVE: 'ACTIVE', COOLING: 'COOLING', DISPOSED: 'DISPOSED' });

/** Camera authority states. Exactly one controller is authoritative per frame. */
export const CAMERA_AUTHORITY = Object.freeze({
  AUTHOR: 'AUTHOR',
  EXPLORE: 'EXPLORE',
  THIRD_PERSON_EXPLORE: 'THIRD_PERSON_EXPLORE',
  FOCUS: 'FOCUS',
  DIRECTED: 'DIRECTED',
  TRANSITION: 'TRANSITION'
});

export const FORBIDDEN_RENDER_KEYS = Object.freeze(['mesh','geometry','material','materials','shader','texture','object3d','object3D','scene','renderer','threeObject','uniforms']);
export const MEDIA_KIND = Object.freeze({ IMAGE: 'IMAGE', VIDEO: 'VIDEO', AUDIO: 'AUDIO', GENERATED: 'GENERATED' });
export const SCHEMA_VERSION = 1;
