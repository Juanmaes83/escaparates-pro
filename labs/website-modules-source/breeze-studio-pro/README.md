# Breeze Studio PRO V4

Independent Escaparates Pro module built additively from the preserved Breeze engine.

Source engine:
- Juanmaes83/breeze
- pinned commit 0ab82342f9169f20e32b0e90babcc4707e694906

V4 authoring model:
- explicit SUBIR -> CARGADO -> START -> APPLIED state;
- image/video background with transform controls;
- image/video mapped to simulated cloth;
- cloth opacity, brightness, contrast and saturation via a cloth-only CanvasTexture pipeline;
- Scale / Position X / Position Y;
- original Experience modes preserved: Prairie Cloth, Autumn Leaves, Sakura Petals;
- additive Experience presets: Museum Cloth, Gallery Wind, Fashion Drapery, Product Reveal;
- original Venus de Milo preserved;
- generated templates preserved: Torus Knot, Abstract Orbit, Museum Plinth;
- real local CC0 templates from Khronos glTF Sample Assets: Corset mannequin, Lantern, BoomBox;
- uploaded GLB/GLTF/OBJ object support;
- replacement geometry rebuilds the real BVH cloth collider;
- PNG, WebM and clean preview.

Banderolas Dinamicas remains untouched and is not a runtime dependency.
Its proven media-state pattern informed this independent implementation.
