# Breeze Studio PRO

Independent Escaparates Pro module built additively from the Breeze engine.

Source engine:
- Juanmaes83/breeze
- commit 0ab82342f9169f20e32b0e90babcc4707e694906
- upstream lineage: holtsetio/breeze

Derivative additions only:
- custom authoring panel;
- robust image/video mapped onto the simulated cloth;
- cloth media Scale/X/Y;
- custom background image/video while preserving HDRI lighting;
- replaceable GLB/GLTF/OBJ 3D object with auto-normalization;
- uploaded 3D geometry becomes the real BVH cloth collider after scene rebuild;
- scene, camera, simulation, stiffness and friction controls;
- PNG, WebM and clean preview.

Banderolas Dinamicas remains untouched and is not a runtime dependency.
Its proven non-blocking video-loading pattern informed the V2 implementation.
