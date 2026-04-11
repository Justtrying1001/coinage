export const atmosphereFragmentShader = `
precision mediump float;
uniform vec3 uColor;
uniform float uIntensity;
varying vec3 vNormal;
void main() {
  float intensity = pow(max(0.0, 0.45 - dot(normalize(vNormal), vec3(0.0, 0.0, 1.0))), 2.0) * uIntensity;
  gl_FragColor = vec4(uColor * intensity, intensity);
}`;
