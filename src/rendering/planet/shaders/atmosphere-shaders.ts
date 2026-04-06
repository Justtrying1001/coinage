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

    float viewDot = clamp(dot(N, V), 0.0, 1.0);
    float horizon = pow(1.0 - viewDot, 3.1);
    float forwardScatter = pow(max(dot(V, -L), 0.0), 2.6) * 0.45 + 0.55;
    float litEdge = pow(max(dot(N, L), 0.0), 1.25) * 0.26 + 0.74;
    float edgeTightening = smoothstep(0.02, 0.62, horizon);

    float alpha = horizon * forwardScatter * litEdge * edgeTightening * uIntensity * uDensity;
    gl_FragColor = vec4(uAtmosphereColor, alpha);
  }
`;
