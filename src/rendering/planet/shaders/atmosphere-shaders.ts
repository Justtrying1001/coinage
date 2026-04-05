export const ATMOSPHERE_VERTEX_SHADER = `
  varying vec3 vNormalW;
  varying vec3 vPositionW;

  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vPositionW = worldPos.xyz;
    vNormalW = normalize(mat3(modelMatrix) * normal);

    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

export const ATMOSPHERE_FRAGMENT_SHADER = `
  varying vec3 vNormalW;
  varying vec3 vPositionW;

  uniform vec3 uAtmosphereColor;
  uniform float uIntensity;
  uniform vec3 uLightDirection;

  void main() {
    vec3 V = normalize(cameraPosition - vPositionW);
    float fresnel = pow(1.0 - max(dot(normalize(vNormalW), V), 0.0), 3.1);
    float alpha = fresnel * uIntensity;
    gl_FragColor = vec4(uAtmosphereColor, alpha);
  }
`;
