precision mediump float;

uniform bool u_isRadical;
uniform vec3 u_normalColor;
uniform vec3 u_radicalColor;

varying vec2 v_uv;
uniform float u_vertexIndex;
uniform float u_strokeIndex;
uniform float u_randomSeed;


float random (in vec2 st) {
    return fract(sin(dot(st.xy,
                         vec2(12.9898,78.233)))*
        43758.5453123);
}

// Based on Morgan McGuire @morgan3d
// https://www.shadertoy.com/view/4dS3Wd
float noise (in vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    // Four corners in 2D of a tile
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(a, b, u.x) +
            (c - a)* u.y * (1.0 - u.x) +
            (d - b) * u.x * u.y;
}

#define OCTAVES 6
float fbm (in vec2 st) {
    // Initial values
    float value = 0.0;
    float amplitude = .5;
    float frequency = 0.;
    //
    // Loop of octaves
    for (int i = 0; i < OCTAVES; i++) {
        value += amplitude * noise(st);
        st *= 2.;
        amplitude *= .5;
    }
    return value;
}


void main() {
  vec3 color = u_isRadical ? u_radicalColor : u_normalColor;

  // Example: Draw a circle using UVs
  vec2 center = vec2(0.5, 0.5);
  float radius = 0.5;

  float nzx = fbm(v_uv*vec2(1., 20.0)+123.12+u_strokeIndex+u_randomSeed)*2.-1.;
  float nzy = fbm(v_uv*vec2(1., 20.0)+21.312+u_strokeIndex+u_randomSeed)*2.-1.;
  vec2 noised_uv = v_uv + 0.55*vec2(nzx, nzy);

  float dist = distance(noised_uv, center);
  float circle = smoothstep(.5, .45, dist);

  float nz = fbm(v_uv*vec2(1., 20.0)+u_strokeIndex+u_randomSeed);
  float ar = random(vec2(u_strokeIndex, u_strokeIndex+u_randomSeed))*0.3;
  nz = smoothstep(.3+ar, .4+ar, nz) * 1.0;

  //nz = nz / (1.+v_vertexIndex/40.0);

  color = mix(color, vec3(.7*smoothstep(.45, .55, random(vec2(u_strokeIndex, u_strokeIndex+u_randomSeed+12.2)))), nz);

  // Visualize UVs for testing
  gl_FragColor = vec4(v_uv, 0.0, 1.0);
  gl_FragColor = vec4(vec3(circle), 1.);
  gl_FragColor = vec4(vec3(color), circle);
}
