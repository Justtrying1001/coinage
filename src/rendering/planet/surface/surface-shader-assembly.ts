export const SURFACE_VERTEX_SHADER_PLANET = `
  attribute float aUnscaledElevation;

  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;
  varying float vElevation;

  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vElevation = aUnscaledElevation;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

export const SURFACE_FRAGMENT_SHADER_PLANET = `
  #define MAX_GRADIENT_SIZE 6

  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;
  varying float vElevation;

  uniform vec2 uMinMax;
  uniform float uSeaLevel;
  uniform float uLandGradientSize;
  uniform float uDepthGradientSize;
  uniform float uLandAnchors[MAX_GRADIENT_SIZE];
  uniform float uDepthAnchors[MAX_GRADIENT_SIZE];
  uniform vec3 uLandColors[MAX_GRADIENT_SIZE];
  uniform vec3 uDepthColors[MAX_GRADIENT_SIZE];
  uniform vec3 uLightDirection;
  uniform float uAmbientStrength;

  float clamp01(float v) {
    return clamp(v, 0.0, 1.0);
  }

  float inverseLerp(float a, float b, float v) {
    float d = max(0.0001, b - a);
    return clamp01((v - a) / d);
  }

  vec3 sampleLandGradient(float t) {
    int count = int(uLandGradientSize);
    if (count <= 0) return vec3(1.0, 0.0, 1.0);
    vec3 color = uLandColors[0];
    for (int i = 1; i < MAX_GRADIENT_SIZE; i++) {
      if (i >= count) break;
      if (t <= uLandAnchors[i]) {
        float blend = smoothstep(uLandAnchors[i - 1], uLandAnchors[i], t);
        color = mix(uLandColors[i - 1], uLandColors[i], blend);
        break;
      }
      color = uLandColors[i];
    }
    return color;
  }

  vec3 sampleDepthGradient(float t) {
    int count = int(uDepthGradientSize);
    if (count <= 0) return vec3(1.0, 0.0, 1.0);
    vec3 color = uDepthColors[0];
    for (int i = 1; i < MAX_GRADIENT_SIZE; i++) {
      if (i >= count) break;
      if (t <= uDepthAnchors[i]) {
        float blend = smoothstep(uDepthAnchors[i - 1], uDepthAnchors[i], t);
        color = mix(uDepthColors[i - 1], uDepthColors[i], blend);
        break;
      }
      color = uDepthColors[i];
    }
    return color;
  }

  void main() {
    const float shoreMixRange = 0.005;

    float minElevation = uMinMax.x;
    float maxElevation = max(uMinMax.y, minElevation + 0.0001);

    vec3 baseColor;
    float roughness;
    float metalness;

    if (vElevation > uSeaLevel + shoreMixRange) {
      float t = inverseLerp(uSeaLevel + shoreMixRange, maxElevation, vElevation);
      baseColor = sampleLandGradient(t);
      roughness = 0.48;
      metalness = 0.02;
    } else if (vElevation >= uSeaLevel) {
      float landT = inverseLerp(uSeaLevel + shoreMixRange, maxElevation, vElevation);
      float depthT = inverseLerp(minElevation, uSeaLevel, vElevation);
      float shoreT = smoothstep(uSeaLevel, uSeaLevel + shoreMixRange, vElevation);
      vec3 land = sampleLandGradient(landT);
      vec3 depth = sampleDepthGradient(depthT);
      baseColor = mix(depth, land, shoreT);
      roughness = mix(0.08, 0.48, shoreT);
      metalness = mix(0.36, 0.02, shoreT);
    } else {
      float t = inverseLerp(minElevation, uSeaLevel, vElevation);
      baseColor = sampleDepthGradient(t);
      roughness = 0.06;
      metalness = 0.38;
    }

    if (length(baseColor) < 0.0001) {
      baseColor = vec3(0.85, 0.2, 0.9);
    }

    vec3 n = normalize(vWorldNormal);
    vec3 l = normalize(uLightDirection);
    vec3 v = normalize(cameraPosition - vWorldPos);
    vec3 h = normalize(l + v);

    float ndl = max(dot(n, l), 0.0);
    float ndh = max(dot(n, h), 0.0);

    float ambient = clamp(uAmbientStrength, 0.0, 0.9);
    float diffuse = ambient + ndl * (1.0 - ambient);
    float specPower = mix(12.0, 80.0, 1.0 - roughness);
    float specular = pow(ndh, specPower) * (0.05 + metalness * 0.6);

    vec3 color = baseColor * diffuse + vec3(specular);
    gl_FragColor = vec4(color, 1.0);
  }
`;

export const SURFACE_VERTEX_SHADER_GALAXY = SURFACE_VERTEX_SHADER_PLANET;
export const SURFACE_FRAGMENT_SHADER_GALAXY = SURFACE_FRAGMENT_SHADER_PLANET;

export function getSurfacePlanetFragmentShader(): string {
  return SURFACE_FRAGMENT_SHADER_PLANET;
}
