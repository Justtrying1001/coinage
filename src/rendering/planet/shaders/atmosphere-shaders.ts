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
  uniform float uDensity;
  uniform vec3 uLightDirection;

  void main() {
    vec3 V = normalize(cameraPosition - vPositionW);
    vec3 N = normalize(vNormalW);
    vec3 L = normalize(uLightDirection);

    float horizon = pow(1.0 - max(dot(N, V), 0.0), 2.4);
    float forwardScatter = pow(max(dot(V, -L), 0.0), 2.0) * 0.55 + 0.45;
    float litEdge = pow(max(dot(N, L), 0.0), 0.8) * 0.22 + 0.78;

    float alpha = horizon * forwardScatter * litEdge * uIntensity * uDensity;
    gl_FragColor = vec4(uAtmosphereColor, alpha);
  }
`;
