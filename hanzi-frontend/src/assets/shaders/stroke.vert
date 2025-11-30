attribute vec2 a_offset; // offset for quad corners: (-1,-1), (1,-1), (-1,1), (1,1)
attribute vec2 a_uv; // UV coordinates for the quad

varying vec2 v_uv;

uniform vec2 u_resolution;
uniform vec2 u_position;
uniform float u_angle;
uniform float u_size;
uniform float u_vertexIndex;
uniform float u_strokeIndex;
uniform float u_randomSeed;

void main() {
  // Rotate the offset by the angle
  float c = cos(u_angle);
  float s = sin(u_angle);
  vec2 s_offset = a_offset * vec2(1., 1.0);
  vec2 rotatedOffset = vec2(
    s_offset.x * c - s_offset.y * s,
    s_offset.x * s + s_offset.y * c
  );

  // Scale the offset by size
  vec2 scaledOffset = rotatedOffset * u_size;

  // Apply offset to position
  vec2 position = u_position + scaledOffset;

  // Convert from pixel coordinates to clip space
  vec2 clipSpace = (position / u_resolution) * 2.0 - 1.0;
  clipSpace.y *= -1.0; // Flip Y axis

  gl_Position = vec4(clipSpace, 0.0, 1.0);

  // Pass varyings to fragment shader
  v_uv = a_uv;
}
