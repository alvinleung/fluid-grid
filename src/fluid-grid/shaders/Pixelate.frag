#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
#ifdef GL_ES
precision mediump float;
#endif

precision mediump sampler2D;

uniform vec2 uResolution;
uniform vec2 uMouse;
uniform float uTime;

uniform sampler2D uTexture;
varying vec2 vUv;

void main() {
    // gl_FragColor = vec4(0.1,1.0,.4,1.0);;

    float pixels = 720.0;
    float dx = 15.0 * (1.0 / pixels);
    float dy = 10.0 * (1.0 / pixels);
    vec2 coord = vec2(dx * floor(vUv.x / dx), 
                      dy * floor(vUv.y / dy));

    vec4 fluidPixelColour = texture2D(uTexture, coord);
    
    gl_FragColor = vec4(vec3(fluidPixelColour.x), 1.0);
}