/**
 * Gradient-Map Recoloring — Museum Living Art Capability (shader utility)
 *
 * Sculpted from: Juanmaes83/van-gogh-crows (VGC-4)
 * Upstream: Three.js webgl_gpgpu_birds (MIT, mrdoob/three.js f85394be)
 * License: MIT
 *
 * A GLSL function that remaps a luminance value through a 3-stop color ramp
 * (shadow → midtone → highlight). Inject into any fragment shader for NPR
 * palette-based recoloring.
 *
 * Content-agnostic: no creature, texture, or scene references.
 */

/**
 * GLSL uniforms required by the gradient map function.
 * Add these to your material's uniform block.
 */
export const GRADIENT_MAP_UNIFORMS = {
  gradientMapShadowColor:     { value: null }, // THREE.Color
  gradientMapMidtoneColor:    { value: null }, // THREE.Color
  gradientMapHighlightColor:  { value: null }, // THREE.Color
  gradientMapShadowPosition:  { value: 0.0 },
  gradientMapMidpoint:        { value: 0.5 },
  gradientMapHighlightPosition: { value: 1.0 },
  gradientMapReverse:         { value: 0.0 }, // 0 or 1
  gradientMapStrength:        { value: 1.0 },
};

/**
 * GLSL snippet declaring uniforms. Paste into your shader's uniform block.
 */
export const GRADIENT_MAP_UNIFORM_DECLARATIONS = /* glsl */`
uniform vec3 gradientMapShadowColor;
uniform vec3 gradientMapMidtoneColor;
uniform vec3 gradientMapHighlightColor;
uniform float gradientMapShadowPosition;
uniform float gradientMapMidpoint;
uniform float gradientMapHighlightPosition;
uniform float gradientMapReverse;
uniform float gradientMapStrength;
`;

/**
 * GLSL function that performs 3-stop gradient-map recoloring.
 *
 * Usage in fragment shader:
 *   vec3 recolored = gradientMapRecolor(luminanceValue);
 *   finalColor = mix(originalColor, recolored, gradientMapStrength);
 */
export const GRADIENT_MAP_FUNCTION = /* glsl */`
vec3 gradientMapRecolor( float sourceLuma ) {
  float luma = mix( sourceLuma, 1.0 - sourceLuma, gradientMapReverse );
  float shadowPos = clamp( gradientMapShadowPosition, 0.0, 0.96 );
  float highlightPos = clamp( gradientMapHighlightPosition, shadowPos + 0.04, 1.0 );
  float midPos = clamp( gradientMapMidpoint, shadowPos + 0.02, highlightPos - 0.02 );
  vec3 shadowToMidtone = mix(
    gradientMapShadowColor,
    gradientMapMidtoneColor,
    clamp( ( luma - shadowPos ) / ( midPos - shadowPos ), 0.0, 1.0 )
  );
  vec3 midtoneToHighlight = mix(
    gradientMapMidtoneColor,
    gradientMapHighlightColor,
    clamp( ( luma - midPos ) / ( highlightPos - midPos ), 0.0, 1.0 )
  );
  return mix( shadowToMidtone, midtoneToHighlight, step( midPos, luma ) );
}
`;
