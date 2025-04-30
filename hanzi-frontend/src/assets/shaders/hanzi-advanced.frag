precision highp float;

uniform sampler2D u_texture;
uniform vec2 u_textureSize;
uniform float u_time;
uniform vec3 u_tintColor;
uniform vec3 u_tintColor2;
uniform float u_noiseAmp;
uniform float u_seed;
uniform float u_hasMargin;
uniform float u_useMask;
varying vec2 v_texCoord;

float randomNoise(vec2 p) {
  return fract(16791.414*sin(7.*p.x+p.y*73.41));
}

float random (in vec2 _st) {
    return fract(sin(dot(_st.xy,
                         vec2(12.9898,78.233)))*
        43758.5453123);
}

float noise (in vec2 _st) {
    vec2 i = floor(_st);
    vec2 f = fract(_st);

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

float noise3 (in vec2 _st, in float t) {
    vec2 i = floor(_st+t);
    vec2 f = fract(_st+t);

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

#define NUM_OCTAVES 5

float fbm (in vec2 _st) {
    float v = 0.0;
    float a = 0.5;
    vec2 shift = vec2(100.0);
    // Rotate to reduce axial bias
    mat2 rot = mat2(cos(0.5), sin(0.5),
                    -sin(0.5), cos(0.50));
    for (int i = 0; i < NUM_OCTAVES; ++i) {
        v += a * noise(_st);
        _st = rot * _st * 2.0 + shift;
        a *= 0.5;
    }
    return v;
}

float fbm3 (in vec2 _st, in float t) {
    float v = 0.0;
    float a = 0.5;
    vec2 shift = vec2(100.0);
    // Rotate to reduce axial bias
    mat2 rot = mat2(cos(0.5), sin(0.5),
                    -sin(0.5), cos(0.50));
    for (int i = 0; i < NUM_OCTAVES; ++i) {
        v += a * noise3(_st, t);
        _st = rot * _st * 2.0 + shift;
        a *= 0.5;
    }
    return v;
}

float fff(vec2 st, float seed){
    vec2 q = vec2(0.);
    q.x = fbm3(st + 0.1, seed*.11);
    q.y = fbm3(st + vec2(1.0), seed*.11);
    vec2 r = vec2(0.);
    r.x = fbm3(st + 1.0*q + vec2(1.7,9.2)+ 0.15*seed*0.11, seed*.11);
    r.y = fbm3(st + 1.0*q + vec2(8.3,2.8)+ 0.126*seed*0.11, seed*.11);
    float f = fbm3(st+r, seed*.11);
    float ff = (f*f*f+0.120*f*f+.5*f);

    return ff;
}

void main() {
    vec2 uv = v_texCoord;
    vec2 resolution = u_textureSize;
    vec2 st = uv*vec2(3.2, 13.)*195.64;
    
    // Sample original texture
    vec4 original = texture2D(u_texture, uv);
    
    // Create a blurred version by sampling nearby pixels
    vec4 blurred_original = vec4(0.0);
    float blur_size = 2.0 / resolution.x;
    for(float x = -2.0; x <= 2.0; x += 1.0) {
        for(float y = -2.0; y <= 2.0; y += 1.0) {
            vec2 offset = vec2(x * blur_size, y * blur_size);
            blurred_original += texture2D(u_texture, uv + offset);
        }
    }
    blurred_original /= 25.0;
    
    // Noise-based displacement
    float fafa = smoothstep(0.1, 0.9, 0.15 + fff(uv*633.1, 1.0+u_seed));
    float fafa2 = smoothstep(0.1, 0.9, 0.15 + fff(uv*633.1, 22.0+u_seed));
    vec2 displaced_uv = uv;
    displaced_uv.x += 0.02 * fafa;
    displaced_uv.y += 0.0027 * fafa2;
    
    // Distortion effect
    vec2 q = vec2(0.0);
    q.x = fbm3(st + 0.1, 0.*u_time*0.08);
    q.y = fbm3(st + vec2(1.0), 0.*u_time*0.08);
    vec2 r = vec2(0.0);
    r.x = fbm3(st + 1.0*q + vec2(1.7,9.2)+ 0.15*0.*u_time, 0.*u_time*0.08);
    r.y = fbm3(st + 1.0*q + vec2(8.3,2.8)+ 0.126*0.*u_time, 0.*u_time*0.08);
    float f = fbm3(st*2.35+r, 0.*u_time*0.48);
    float ff = (f*f*f+0.120*f*f+0.5*f);
    ff = smoothstep(0.22, 0.7, ff);
    ff = -0.5 + ff;
    ff *= 0.004;
    
    // Apply distortion to UVs
    vec2 uvrd = uv - 2.72*ff*vec2(1.5, 1.0);
    vec4 scattered_original = texture2D(u_texture, uvrd);
    
    // Combine effects
    vec4 outc;
    outc = (blurred_original*0.0+(1.0-0.0)*scattered_original);  // Split between blurred and scattered
    outc = (outc*0.99+(1.0-0.99)*original);  // Split between original image and the previous result
    
    // Apply mask if u_useMask is enabled
    if(u_useMask > 0.01) {
        float mask = original.r; // Use original alpha as mask
        outc *= vec4(mask);
    }
    
    // Apply salt and pepper noise for texture
    float salt = randomNoise(uv+u_seed/1000000.0+0.3143+0.*u_time*0.0001+fbm(uv)*0.02);
    salt = 0.9*(smoothstep(0.95, 0.999, salt)) * length(blurred_original.rgb);
    outc.rgb = 1.0 - (1.0-outc.rgb) * (1.0 - salt);
    
    float ssalt = randomNoise(uv+u_seed/1000000.0+4.3+0.3143+0.*u_time*0.0001+fbm(uv)*0.02);
    ssalt = 0.35*(smoothstep(0.5, 0.999, ssalt));
    outc.rgb = 1.0 - (1.0-outc.rgb) * (1.0 - ssalt);
    
    float pepper = randomNoise(uv+u_seed/1000000.0+1.3+0.3143+0.*u_time*0.0001+fbm(uv)*0.02);
    pepper = 0.035*(smoothstep(0.5, 0.999, pepper));
    outc.rgb -= pepper;
    
    // Apply tint colors based on intensity
    if(u_hasMargin > 0.01) {
        float intensity = original.r;
        outc.rgb = mix(outc.rgb * u_tintColor, outc.rgb * u_tintColor2, intensity);
    }
    
    // Final noise mix
    outc = outc*u_noiseAmp + (1.0-u_noiseAmp)*blurred_original;
    
    gl_FragColor = vec4(vec3(fafa2), 1.0);
    gl_FragColor = vec4(scattered_original.rgb, 1.0);
    gl_FragColor = vec4(1.-outc.rgb, 1.0);
    gl_FragColor = vec4(blurred_original.rgb, 1.);
}