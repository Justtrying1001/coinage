export const PLANET_VERTEX_SHADER = `
  varying vec3 vNormalW;
  varying vec3 vPositionW;
  varying float vElevation;

  uniform float uRadius;
  uniform float uSeedA;
  uniform float uSeedB;
  uniform float uWobbleFrequency;
  uniform float uWobbleAmplitude;
  uniform float uRidgeWarp;
  uniform float uMacroStrength;
  uniform float uMicroStrength;
  uniform float uCraterDensity;

  float hash13(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.yzx + 33.33);
    return fract((p.x + p.y) * p.z);
  }

  float valueNoise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float n000 = hash13(i + vec3(0.0, 0.0, 0.0));
    float n100 = hash13(i + vec3(1.0, 0.0, 0.0));
    float n010 = hash13(i + vec3(0.0, 1.0, 0.0));
    float n110 = hash13(i + vec3(1.0, 1.0, 0.0));
    float n001 = hash13(i + vec3(0.0, 0.0, 1.0));
    float n101 = hash13(i + vec3(1.0, 0.0, 1.0));
    float n011 = hash13(i + vec3(0.0, 1.0, 1.0));
    float n111 = hash13(i + vec3(1.0, 1.0, 1.0));

    float nx00 = mix(n000, n100, f.x);
    float nx10 = mix(n010, n110, f.x);
    float nx01 = mix(n001, n101, f.x);
    float nx11 = mix(n011, n111, f.x);

    float nxy0 = mix(nx00, nx10, f.y);
    float nxy1 = mix(nx01, nx11, f.y);

    return mix(nxy0, nxy1, f.z);
  }

  float fbm(vec3 p) {
    float sum = 0.0;
    float amp = 0.5;
    float freq = 1.0;

    for (int i = 0; i < 5; i++) {
      sum += valueNoise(p * freq) * amp;
      freq *= 2.05;
      amp *= 0.52;
    }

    return sum;
  }

  float ridged(vec3 p) {
    float n = fbm(p);
    n = abs(n * 2.0 - 1.0);
    return 1.0 - n;
  }

  void main() {
    vec3 n = normalize(normal);

    vec3 macroPoint = n * (uWobbleFrequency * 1.2 + 1.0) + vec3(uSeedA * 9.0, uSeedB * 7.0, uSeedA * 3.0);
    vec3 microPoint = n * (uWobbleFrequency * 4.7 + 2.0) + vec3(uSeedB * 11.0, uSeedA * 13.0, uSeedB * 5.0);

    float macro = fbm(macroPoint) * 2.0 - 1.0;
    float ridges = ridged(macroPoint * (1.2 + uRidgeWarp * 1.8));
    float micro = fbm(microPoint) * 2.0 - 1.0;

    float craterMask = smoothstep(0.65, 1.0, valueNoise(microPoint * 0.45 + vec3(uSeedA * 2.0)));
    float crater = -craterMask * uCraterDensity * 0.08;

    float elevation =
      macro * (uMacroStrength * 0.23 + uWobbleAmplitude * 0.35) +
      ridges * (uMacroStrength * 0.19 + uRidgeWarp * 0.12) +
      micro * (uMicroStrength * 0.11) +
      crater;

    elevation = clamp(elevation, -0.32, 0.45);

    vec3 displaced = n * uRadius * (1.0 + elevation);

    vec4 worldPos = modelMatrix * vec4(displaced, 1.0);
    vPositionW = worldPos.xyz;
    vNormalW = normalize(mat3(modelMatrix) * normalize(displaced));
    vElevation = elevation;

    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

export const PLANET_FRAGMENT_SHADER = `
  varying vec3 vNormalW;
  varying vec3 vPositionW;
  varying float vElevation;

  uniform vec3 uBaseColor;
  uniform vec3 uAccentColor;
  uniform float uRoughness;

  void main() {
    vec3 N = normalize(vNormalW);

    vec3 lightA = normalize(vec3(0.45, 0.7, 0.6));
    vec3 lightB = normalize(vec3(-0.55, -0.25, 0.75));

    float diffA = max(dot(N, lightA), 0.0);
    float diffB = max(dot(N, lightB), 0.0);

    float elevationMask = smoothstep(-0.05, 0.22, vElevation);
    vec3 albedo = mix(uBaseColor, uAccentColor, elevationMask * 0.72);

    float ambient = 0.24;
    float lighting = ambient + diffA * 0.82 + diffB * 0.28;

    vec3 V = normalize(cameraPosition - vPositionW);
    vec3 H = normalize(lightA + V);
    float spec = pow(max(dot(N, H), 0.0), mix(52.0, 8.0, uRoughness)) * 0.25;

    vec3 color = albedo * lighting + vec3(spec);

    gl_FragColor = vec4(color, 1.0);
  }
`;
