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
    vec3 N = normalize(vNormalW);
    vec3 L = normalize(uLightDirection);

    float fresnel = pow(1.0 - max(dot(N, V), 0.0), 2.1);
    float forwardScatter = pow(max(dot(V, -L), 0.0), 3.1);
    float daySide = smoothstep(-0.2, 0.7, dot(N, L));

    float alpha = (fresnel * 0.86 + forwardScatter * 0.18) * daySide * uIntensity;
    vec3 color = mix(uAtmosphereColor * 0.82, uAtmosphereColor * 1.1, forwardScatter);

    gl_FragColor = vec4(color, alpha);
  }
`;
