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
uniform sampler2D uTextureLineShape;
uniform sampler2D uTextureDotShape;

varying vec2 vUv;


float THRESHOLD_1 = .2;
float THRESHOLD_2 = .5;
float THRESHOLD_3 = .7;

float drawLine (vec2 p1, vec2 p2, vec2 uv, float a)
{
    float r = 0.;
    float one_px = 1. / uResolution.x; //not really one px
    
    // get dist between points
    float d = distance(p1, p2);
    
    // get dist between current pixel and p1
    float duv = distance(p1, uv);

    //if point is on line, according to dist, it should match current uv 
    r = 1.-floor(1.-(a*one_px)+distance (mix(p1, p2, clamp(duv/d, 0., 1.)),  uv));
        
    return r;
}

void main() {
  // gl_FragColor = vec4(0.1,1.0,.4,1.0);;

  float pixels = 1080.0;
  float dx = 15.0 * (1.0 / pixels);
  float dy = 10.0 * (1.0 / pixels);
  vec2 coord = vec2(dx * floor(vUv.x / dx), 
                    dy * floor(vUv.y / dy));

  vec4 fluidPixelColour = texture2D(uTexture, coord);
  float fluidValue = fluidPixelColour.x;


  // gl_FragColor = lineShapeColour;

  // gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);

  if (fluidValue < THRESHOLD_1) {
    vec4 lineShapeColour = texture2D(uTextureLineShape, vUv * 110.);
    gl_FragColor = vec4(vec3(lineShapeColour), 1.0);
    return;
  }

  if (fluidValue < THRESHOLD_2) {
    vec4 dotShapeColour = texture2D(uTextureDotShape, vUv * 110.);
    gl_FragColor = vec4(vec3(dotShapeColour), 1.0);
    return;
  }

  if (fluidValue < THRESHOLD_3) {
    // return;
  }
  gl_FragColor = vec4(vec3(0.0), 1.0);
}