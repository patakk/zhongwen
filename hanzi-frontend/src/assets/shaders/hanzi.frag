precision mediump float;

uniform sampler2D u_texture;
uniform vec2 u_textureSize;
uniform float u_time;
varying vec2 v_texCoord;

void main() {
  // Sample the texture 
  vec4 texColor = texture2D(u_texture, v_texCoord);
  
  // Apply a simple color effect based on the character intensity
  // For debugging: black to red, white to green
  float intensity = texColor.r; // Assuming grayscale, all channels are the same
  vec3 color = mix(vec3(1.0, 0.0, 0.0), vec3(0.0, 1.0, 0.0), intensity);
  
  // Add some time-based animation for effect
  color += 0.6 * sin(u_time * 0.01 + v_texCoord.x * 10.0) * vec3(0.0, 0.0, intensity);
  
  gl_FragColor = vec4(color, 1.0);
}