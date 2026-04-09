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

  struct GradientStop {
    float anchor;
    vec3 color;
  };

  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;
  varying float vElevation;

  uniform vec2 uMinMax;
  uniform float uSeaLevel;
  uniform float uLandGradientSize;
  uniform float uDepthGradientSize;
  uniform GradientStop uLandGradient[MAX_GRADIENT_SIZE];
  uniform GradientStop uDepthGradient[MAX_GRADIENT_SIZE];
  uniform vec3 uLightDirection;

  float saturate(float v) {
    return clamp(v, 0.0, 1.0);
  }

  float inverseLerp(float a, float b, float v) {
    float d = max(0.0001, b - a);
    return saturate((v - a) / d);
  }

  vec3 sampleGradient(GradientStop grad[MAX_GRADIENT_SIZE], float size, float t) {
    int count = int(size);
    vec3 color = grad[0].color;

    for (int i = 1; i < MAX_GRADIENT_SIZE; i++) {
      if (i >= count) break;
      if (t <= grad[i].anchor) {
        float blend = smoothstep(grad[i - 1].anchor, grad[i].anchor, t);
        color = mix(grad[i - 1].color, grad[i].color, blend);
        break;
      }
      color = grad[i].color;
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
      baseColor = sampleGradient(uLandGradient, uLandGradientSize, t);
      roughness = 0.48;
      metalness = 0.02;
    } else if (vElevation >= uSeaLevel) {
      float landT = inverseLerp(uSeaLevel + shoreMixRange, maxElevation, vElevation);
      float depthT = inverseLerp(minElevation, uSeaLevel, vElevation);
      float shoreT = smoothstep(uSeaLevel, uSeaLevel + shoreMixRange, vElevation);
      vec3 land = sampleGradient(uLandGradient, uLandGradientSize, landT);
      vec3 depth = sampleGradient(uDepthGradient, uDepthGradientSize, depthT);
      baseColor = mix(depth, land, shoreT);
      roughness = mix(0.08, 0.48, shoreT);
      metalness = mix(0.36, 0.02, shoreT);
    } else {
      float t = inverseLerp(minElevation, uSeaLevel, vElevation);
      baseColor = sampleGradient(uDepthGradient, uDepthGradientSize, t);
      roughness = 0.06;
      metalness = 0.38;
    }

    vec3 n = normalize(vWorldNormal);
    vec3 l = normalize(uLightDirection);
    vec3 v = normalize(cameraPosition - vWorldPos);
    vec3 h = normalize(l + v);

    float ndl = max(dot(n, l), 0.0);
    float ndh = max(dot(n, h), 0.0);

    float diffuse = 0.26 + ndl * 0.74;
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
