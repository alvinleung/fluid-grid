precision highp float;
precision mediump sampler2D;

uniform vec2 uResolution;
uniform vec2 uMouse;
uniform float uTime;

uniform vec2 texelSize;
uniform sampler2D uVelocity;

uniform sampler2D uTexture;
uniform sampler2D uSource;
uniform float dissipation;

varying vec2 vUv;
varying vec2 vL;
varying vec2 vR;
varying vec2 vT;
varying vec2 vB;

void main() {

    // vec3 color = texture2D(uTexture, gl_FragCoord.xy).rgb;
    // gl_FragColor = vec4(color, 1.0);
    // return;

    // gl_FragColor = vec4(0.1,1.0,.4,1.0);;
    vec3 c = texture2D(uTexture, vUv).rgb;
    // c *= diffuse;

    gl_FragColor = vec4(vec3(c), 1.0);
}