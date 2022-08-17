#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform float uTime;

void main() {
  gl_FragColor = vec4(0.0,(sin(uTime*0.001)+1.0)/2.0,0.0,1.0);
}