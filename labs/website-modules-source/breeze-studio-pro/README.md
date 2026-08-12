# Breeze Studio PRO V3

Independent Escaparates Pro module built additively from the preserved Breeze engine.

Source engine:
- Juanmaes83/breeze
- commit 0ab82342f9169f20e32b0e90babcc4707e694906

V3 authoring model:
- explicit Upload -> Saved -> Apply -> Applied state for every asset;
- image/video mapped onto the simulated cloth;
- cloth Scale / Position X / Position Y;
- background image/video with Scale / Position X / Position Y;
- original Breeze HDRI preserved as lighting while a custom visual background is active;
- original Venus de Milo preserved;
- uploaded GLB/GLTF/OBJ object can replace the sculpture;
- applied replacement geometry rebuilds the real BVH cloth collider;
- built-in object templates: Venus, Abstract Torus Knot, Abstract Orbit, Museum Plinth;
- original Breeze scene, camera and physics controls preserved;
- PNG, WebM and clean preview.

Banderolas Dinamicas remains untouched and is not a runtime dependency.
The proven Banderolas asset/video pattern informed this independent implementation.
