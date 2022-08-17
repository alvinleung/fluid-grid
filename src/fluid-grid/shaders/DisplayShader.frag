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

varying vec2 texelSize;
uniform sampler2D uVelocity;

uniform sampler2D uTexture;
uniform sampler2D uSource;
uniform float dissipation;
varying vec2 vUv;

void main() {
    // gl_FragColor = vec4(0.1,1.0,.4,1.0);;
    vec3 c = texture2D(uSource, vUv).rgb;

    gl_FragColor = vec4(c, 1.0);
}