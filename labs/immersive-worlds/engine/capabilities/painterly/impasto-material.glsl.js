/**
 * Impasto Composite Material — Museum Living Art Capability
 *
 * Sculpted from: Juanmaes83/wet-paint-flow (WPF-4)
 * Upstream: Original work by Juanmaes83
 * License: MIT (code only)
 *
 * Full-screen compositing pass that combines a base image, stroke pigment
 * buffer, and paint height buffer into a physically-plausible impasto
 * rendering with:
 * - Sobel-derived normals from paint height
 * - GGX microfacet wet specular
 * - Variable roughness (wet=glossy, dry=matte)
 * - Clearcoat layer
 * - Bristle ridge highlights
 * - Pooled-edge darkening
 * - Procedural canvas weave texture
 *
 * Content-agnostic — no scene-specific palettes, semantic zones, or
 * debug modes. Expects three input textures and scalar uniforms.
 */

const IMPASTO_COMPOSITE_VERTEX = /* glsl */`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const IMPASTO_COMPOSITE_FRAGMENT = /* glsl */`
  varying vec2 vUv;
  uniform sampler2D uBase;
  uniform sampler2D uStroke;
  uniform sampler2D uHeight;
  uniform vec2 uTexel;
  uniform float uImpasto;
  uniform float uWetness;
  uniform float uLightAngle;
  uniform float uTime;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  const float PI = 3.14159265359;

  float saturatePaint(float value) {
    return clamp(value, 0.0, 1.0);
  }

  float distributionGGX(float nDotH, float roughness) {
    float alpha = roughness * roughness;
    float alpha2 = alpha * alpha;
    float denom = nDotH * nDotH * (alpha2 - 1.0) + 1.0;
    return alpha2 / max(PI * denom * denom, 0.0001);
  }

  float geometrySmith(float nDotV, float nDotL, float roughness) {
    float r = roughness + 1.0;
    float k = (r * r) * 0.125;
    float ggxV = nDotV / max(nDotV * (1.0 - k) + k, 0.0001);
    float ggxL = nDotL / max(nDotL * (1.0 - k) + k, 0.0001);
    return ggxV * ggxL;
  }

  float wetSpecular(vec3 normal, vec3 lightDirection, float roughness) {
    vec3 viewDir = vec3(0.0, 0.0, 1.0);
    vec3 halfVec = normalize(lightDirection + viewDir);
    float nDotV = saturatePaint(dot(normal, viewDir));
    float nDotL = saturatePaint(dot(normal, lightDirection));
    float nDotH = saturatePaint(dot(normal, halfVec));
    float vDotH = saturatePaint(dot(viewDir, halfVec));
    float fresnel = 0.045 + (1.0 - 0.045) * pow(1.0 - vDotH, 5.0);
    float spec = distributionGGX(nDotH, roughness)
               * geometrySmith(nDotV, nDotL, roughness) * fresnel;
    return min(3.0, spec / max(4.0 * nDotV * nDotL, 0.001));
  }

  float paintHeight(vec2 coord) {
    return texture2D(uHeight, coord).r;
  }

  void main() {
    vec3 base = texture2D(uBase, vUv).rgb;
    vec4 stroke = texture2D(uStroke, vUv);
    vec4 paintState = texture2D(uHeight, vUv);
    float height = paintState.r;
    float wet = saturatePaint(paintState.g * 5.0) * saturatePaint(uWetness);
    float furrow = saturatePaint(paintState.b * 11.0);

    // Procedural canvas weave.
    vec2 pixel = vUv / uTexel;
    float canvasGrain = hash(floor(pixel * 0.46));
    float fineGrain = hash(floor(pixel * 1.17) + 17.0);
    float warpFiber = sin(pixel.y * 1.33 + sin(pixel.x * 0.021) * 1.8);
    float weftFiber = sin(pixel.x * 1.21 + sin(pixel.y * 0.018) * 1.6);
    float canvasWeave = warpFiber * weftFiber;
    vec3 canvasTone = vec3(0.835, 0.775, 0.665);
    canvasTone *= 0.968 + canvasGrain * 0.028 + fineGrain * 0.014 + canvasWeave * 0.009;

    // Show canvas through thin paint areas.
    base = mix(canvasTone, base, smoothstep(0.0, 0.08, stroke.a + height * 0.5));

    // Sobel normal from paint height buffer.
    float hTL = paintHeight(vUv + vec2(-uTexel.x,  uTexel.y));
    float hT  = paintHeight(vUv + vec2( 0.0,       uTexel.y));
    float hTR = paintHeight(vUv + vec2( uTexel.x,  uTexel.y));
    float hL  = paintHeight(vUv - vec2( uTexel.x,  0.0));
    float hR  = paintHeight(vUv + vec2( uTexel.x,  0.0));
    float hBL = paintHeight(vUv + vec2(-uTexel.x, -uTexel.y));
    float hB  = paintHeight(vUv - vec2( 0.0,       uTexel.y));
    float hBR = paintHeight(vUv + vec2( uTexel.x, -uTexel.y));

    vec2 gradient = vec2(
      hTL + 2.0 * hL + hBL - hTR - 2.0 * hR - hBR,
      hBL + 2.0 * hB + hBR - hTL - 2.0 * hT - hTR
    );
    vec3 paintNormal = normalize(vec3(
      gradient * (4.0 + uImpasto * 6.0),
      mix(1.08, 0.72, saturatePaint(uImpasto))
    ));

    vec3 lightDir = normalize(vec3(cos(uLightAngle), sin(uLightAngle), 0.72));
    float nDotL = saturatePaint(dot(paintNormal, lightDir));
    float diffuse = mix(0.78, 1.16, nDotL);
    float roughness = mix(0.44, 0.11, wet);
    float specular = wetSpecular(paintNormal, lightDir, roughness);

    vec3 halfDir = normalize(lightDir + vec3(0.0, 0.0, 1.0));
    float clearcoat = pow(saturatePaint(dot(paintNormal, halfDir)), mix(5.0, 13.0, wet));

    vec3 pigment = stroke.rgb / max(stroke.a, 0.065);
    pigment = clamp(pigment, vec3(0.0), vec3(1.45));

    float localPeak = max(max(max(hL, hR), max(hT, hB)), height);
    float pooledEdge = saturatePaint((localPeak - height) * 3.8);
    float ridgeCatch = saturatePaint(length(gradient) * 13.0 + pooledEdge * 0.7 + furrow * 0.3);

    pigment *= mix(0.91, 1.13, furrow);
    pigment *= 1.0 - pooledEdge * wet * 0.11;

    vec3 color = mix(base, pigment * diffuse, smoothstep(0.015, 0.78, stroke.a * 1.18));
    float paintMask = smoothstep(0.003, 0.055, height + stroke.a * 0.12);
    float grazingSheen = pow(1.0 - saturatePaint(paintNormal.z), 2.0) * wet;

    color += vec3(1.0, 0.9, 0.7) * (
      specular * 0.78
      + clearcoat * wet * (0.18 + ridgeCatch * 0.82)
      + grazingSheen * 0.075
    ) * paintMask * (0.34 + uImpasto * 0.32);

    color += vec3(0.58, 0.34, 0.12) * pooledEdge * wet * stroke.a * 0.075;
    color -= vec3(0.065, 0.05, 0.032)
           * saturatePaint(-dot(paintNormal.xy, lightDir.xy))
           * height * uImpasto;
    color *= 0.987 + canvasGrain * 0.017 + fineGrain * 0.008;

    gl_FragColor = vec4(color, 1.0);
  }
`;

const IMPASTO_UNIFORMS = {
  uBase:       { value: null },
  uStroke:     { value: null },
  uHeight:     { value: null },
  uTexel:      { value: null },
  uImpasto:    { value: 0.04 },
  uWetness:    { value: 0.31 },
  uLightAngle: { value: 0.0 },
  uTime:       { value: 0.0 },
};

export {
  IMPASTO_COMPOSITE_VERTEX,
  IMPASTO_COMPOSITE_FRAGMENT,
  IMPASTO_UNIFORMS,
};
