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
    vec4 fluidPixelColour = texture2D(uTexture, vUv);
    
    gl_FragColor = vec4(vec3(fluidPixelColour.x), 1.0);
}