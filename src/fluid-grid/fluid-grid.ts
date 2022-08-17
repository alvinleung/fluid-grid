// Inspiration
// https://github.com/PavelDoGreat/WebGL-Fluid-Simulation/blob/master/script.js
// https://experiments.withgoogle.com/starfluid

import { createTimer } from "./utils";

import BASE_VERT from "./shaders/BaseVertexShader.vert";
import NOISE_FRAG from "./shaders/Fluid.frag";
import SHAPE_FRAG from "./shaders/ShapeShader.frag";
import PIXELATE_FRAG from "./shaders/Pixelate.frag";

import COPY_FRAG from "./shaders/fluid/copy.frag";
import CLEAR_FRAG from "./shaders/fluid/clear.frag";
import FLUID_ADVECTION_FRAG from "./shaders/fluid/fluidAdvection.frag";
import FLUID_CURL_FRAG from "./shaders/fluid/fluidCurl.frag";
import FLUID_DIVERGENCE_FRAG from "./shaders/fluid/fluidDivergence.frag";
import FLUID_GRADIENT_SUBTRACT_FRAG from "./shaders/fluid/fluidGradientSubtract.frag";
import FLUID_PRESSURE_FRAG from "./shaders/fluid/fluidPressure.frag";
import FLUID_SPLAT_FRAG from "./shaders/fluid/fluidSplat.frag";
import FLUID_VORTICITY_FRAG from "./shaders/fluid/fluidVorticity.frag";
import DISPLAY_FRAG from "./shaders/DisplayShader.frag";
import COLOR_FRAG from "./shaders/fluid/Color.frag";


import { compileShader, createProgram, Program } from "./WebGL/Program";
import { Material } from "./WebGL/Material";
import { createDoubleFBO, createFBO, FrameBufferObject } from "./WebGL/FrameBufferObject";
import { getWebGLContext } from "./WebGL/getContext";
import { createRenderer } from "./WebGL/Renderer";
import { createTextureFromCanvas } from "./WebGL/Texture";
import { Pointer } from "./WebGL/Pointer";

const config = {
  SIM_RESOLUTION: 128, // default 128
  DISPLAY_RESOLUTION: 512, // default 1024
  DENSITY_DISSIPATION: 20, // default 1
  VELOCITY_DISSIPATION: 0.01,// default .2
  PRESSURE: 0.8, // default .8
  PRESSURE_ITERATIONS: 20, // default 20
  CURL: 30, // default 30
  SPLAT_RADIUS: 0.5, //default 0.25
  SPLAT_FORCE: 6000 //default 6000
}

function getResolution(gl: WebGLRenderingContext, resolution: number) {
  let aspectRatio = gl.drawingBufferWidth / gl.drawingBufferHeight;
  if (aspectRatio < 1)
    aspectRatio = 1.0 / aspectRatio;

  let min = Math.round(resolution);
  let max = Math.round(resolution * aspectRatio);

  if (gl.drawingBufferWidth > gl.drawingBufferHeight)
    return { width: max, height: min };
  else
    return { width: min, height: max };
}

function getTextureScale(texture: HTMLCanvasElement | HTMLImageElement, width: number, height: number) {
  return {
    x: width / texture.width,
    y: height / texture.height
  };
}

function scaleByPixelRatio(input: number) {
  let pixelRatio = window.devicePixelRatio || 1;
  return Math.floor(input * pixelRatio);
}

const createLineShape = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 24;
  canvas.height = 24;
  const context = canvas.getContext("2d") as CanvasRenderingContext2D;
  context.beginPath();
  context.strokeStyle = "#FFFFFF";
  context.moveTo(2, 2);
  context.lineTo(12, 12);
  context.stroke();
  return canvas;
}

const createDotShape = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 24;
  canvas.height = 24;
  const context = canvas.getContext("2d") as CanvasRenderingContext2D;

  context.fillStyle = "#FFF";
  context.fillRect(8, 8, 4, 4);

  return canvas;
}


const createFrameBuffers = (gl: WebGLRenderingContext, ext) => {
  const simRes = getResolution(gl, config.SIM_RESOLUTION);

  const texType = ext.halfFloatTexType;
  const rgba = ext.formatRGBA;
  const rg = ext.formatRG;
  const r = ext.formatR;
  const filtering = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;

  gl.disable(gl.BLEND);

  // init rendering framebuffers
  const velocityFBO = createDoubleFBO(gl, simRes.width, simRes.height, rg.internalFormat, rg.format, texType, filtering);
  const divergenceFBO = createFBO(gl, simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
  const curlFBO = createFBO(gl, simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
  const pressureFBO = createDoubleFBO(gl, simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);

  // init rendering FBO
  const displayResolution = getResolution(gl, config.DISPLAY_RESOLUTION);
  const displayFBO = createDoubleFBO(gl, displayResolution.width, displayResolution.height, rgba.internalFormat, rgba.format, texType, gl.NEAREST);

  return {
    displayFBO,
    pressureFBO,
    curlFBO,
    divergenceFBO,
    velocityFBO
  }
}

export const createFluidGrid = (canvas: HTMLCanvasElement) => {

  const { gl, ext } = getWebGLContext(canvas);



  // for rendering
  const baseVertexShader = compileShader(gl, gl.VERTEX_SHADER, BASE_VERT, []);
  const noiseShader = compileShader(gl, gl.FRAGMENT_SHADER, NOISE_FRAG, []);
  const pixelateShader = compileShader(gl, gl.FRAGMENT_SHADER, PIXELATE_FRAG, []);
  const shapeShader = compileShader(gl, gl.FRAGMENT_SHADER, SHAPE_FRAG, []);
  const displayShader = compileShader(gl, gl.FRAGMENT_SHADER, DISPLAY_FRAG, []);

  const noiseProgram = new Program(gl, baseVertexShader, noiseShader);
  const pixelateProgram = new Program(gl, baseVertexShader, pixelateShader);
  const shapeProgram = new Program(gl, baseVertexShader, shapeShader);

  // for final output
  const displayProgram = new Program(gl, baseVertexShader, displayShader);

  // utilities
  const clearShader = compileShader(gl, gl.FRAGMENT_SHADER, CLEAR_FRAG, []);
  const colorShader = compileShader(gl, gl.FRAGMENT_SHADER, COLOR_FRAG, []);
  const clearProgram = new Program(gl, baseVertexShader, clearShader);
  const colorProgram = new Program(gl, baseVertexShader, colorShader);

  // for fluid simulation
  const splatShader = compileShader(gl, gl.FRAGMENT_SHADER, FLUID_SPLAT_FRAG, []);
  const advectionShader = compileShader(gl, gl.FRAGMENT_SHADER, FLUID_ADVECTION_FRAG, ext.supportLinearFiltering ? [] : ['MANUAL_FILTERING']);
  const divergenceShader = compileShader(gl, gl.FRAGMENT_SHADER, FLUID_DIVERGENCE_FRAG, []);
  const curlShader = compileShader(gl, gl.FRAGMENT_SHADER, FLUID_CURL_FRAG, []);
  const vorticityShader = compileShader(gl, gl.FRAGMENT_SHADER, FLUID_VORTICITY_FRAG, []);
  const pressureShader = compileShader(gl, gl.FRAGMENT_SHADER, FLUID_PRESSURE_FRAG, []);
  const gradientSubtractShader = compileShader(gl, gl.FRAGMENT_SHADER, FLUID_GRADIENT_SUBTRACT_FRAG, []);

  const splatProgram = new Program(gl, baseVertexShader, splatShader);
  const advectionProgram = new Program(gl, baseVertexShader, advectionShader);
  const divergenceProgram = new Program(gl, baseVertexShader, divergenceShader);
  const curlProgram = new Program(gl, baseVertexShader, curlShader);
  const vorticityProgram = new Program(gl, baseVertexShader, vorticityShader);
  const pressureProgram = new Program(gl, baseVertexShader, pressureShader);
  const gradientSubtractProgram = new Program(gl, baseVertexShader, gradientSubtractShader);

  // Create Frame Buffers
  // const displayFBO = createFBO(gl, displayWidth, displayHeight, rgba.internalFormat, rgba.format, texType, gl.NEAREST);

  const { displayFBO, curlFBO, velocityFBO, divergenceFBO, pressureFBO } = createFrameBuffers(gl, ext);

  const timer = createTimer();

  const { lineTexture, dotTexture } = (() => {
    const lineShape = createLineShape();
    const lineTexture = createTextureFromCanvas(gl, lineShape);

    const dotShape = createDotShape();
    const dotTexture = createTextureFromCanvas(gl, dotShape);
    return { lineTexture, dotTexture }
  })();

  const Renderer = createRenderer(gl);



  function correctRadius(radius: number) {
    let aspectRatio = canvas.width / canvas.height;
    if (aspectRatio > 1)
      radius *= aspectRatio;
    return radius;
  }

  function multipleSplats(amount) {
    for (let i = 0; i < amount; i++) {
      const x = Math.random();
      const y = Math.random();
      const dx = 1000 * (Math.random() - 0.5);
      const dy = 1000 * (Math.random() - 0.5);
      splat(x, y, dx, dy);
    }
  }

  function splatPointer(pointer: Pointer) {
    let dx = pointer.deltaX * config.SPLAT_FORCE;
    let dy = pointer.deltaY * config.SPLAT_FORCE;
    splat(pointer.texcoordX, pointer.texcoordY, dx, dy);
  }

  function splat(x, y, dx, dy) {
    if (x === undefined || y === undefined || dx === undefined || dy === undefined) {
      return;
    }

    splatProgram.bind();
    gl.uniform1i(splatProgram.uniforms.uTarget, velocityFBO.read.attach(0));
    gl.uniform1f(splatProgram.uniforms.aspectRatio, canvas.width / canvas.height);
    gl.uniform2f(splatProgram.uniforms.point, x, y);
    gl.uniform3f(splatProgram.uniforms.color, dx, dy, 0.0);
    gl.uniform1f(splatProgram.uniforms.radius, correctRadius(config.SPLAT_RADIUS / 100.0));
    Renderer.renderToFrameBuffer(velocityFBO.write);
    velocityFBO.swap();

    gl.uniform1i(splatProgram.uniforms.uTarget, displayFBO.read.attach(0));
    gl.uniform3f(splatProgram.uniforms.color, 0.5, 0.5, 1.0);
    Renderer.renderToFrameBuffer(displayFBO.write);
    displayFBO.swap();
  }

  const pointer = new Pointer();
  window.addEventListener("mousemove", (e) => {
    let posX = (e.clientX);
    let posY = (e.clientY);
    pointer.update(canvas, posX, posY);
  })

  function applyInputs() {
    if (pointer.moved) {
      pointer.moved = false;
      splatPointer(pointer);
    }
  }

  // setInterval(() => {
  //   splat(Math.random(), Math.random(), Math.random() * config.SPLAT_FORCE, Math.random() * config.SPLAT_FORCE);
  // }, 1000)

  const SHOW_FLUID_SIMULATION = false;

  const render = () => {

    applyInputs();

    const delta = timer.getDeltaMillisec() / 1000 / 20;

    gl.disable(gl.BLEND);

    curlProgram.bind();
    gl.uniform2f(curlProgram.uniforms.texelSize, velocityFBO.texelSizeX, velocityFBO.texelSizeY);
    gl.uniform1i(curlProgram.uniforms.uVelocity, velocityFBO.read.attach(0));

    Renderer.renderToFrameBuffer(curlFBO);

    vorticityProgram.bind();
    gl.uniform2f(vorticityProgram.uniforms.texelSize, velocityFBO.texelSizeX, velocityFBO.texelSizeY);
    gl.uniform1i(vorticityProgram.uniforms.uVelocity, velocityFBO.read.attach(0));
    gl.uniform1i(vorticityProgram.uniforms.uCurl, curlFBO.attach(1));
    gl.uniform1f(vorticityProgram.uniforms.curl, config.CURL);
    gl.uniform1f(vorticityProgram.uniforms.dt, delta);

    Renderer.renderToFrameBuffer(velocityFBO.write);
    velocityFBO.swap();


    divergenceProgram.bind();
    gl.uniform2f(divergenceProgram.uniforms.texelSize, velocityFBO.texelSizeX, velocityFBO.texelSizeY);
    gl.uniform1i(divergenceProgram.uniforms.uVelocity, velocityFBO.read.attach(0));

    Renderer.renderToFrameBuffer(divergenceFBO);


    clearProgram.bind();
    gl.uniform1i(clearProgram.uniforms.uTexture, pressureFBO.read.attach(0));
    gl.uniform1f(clearProgram.uniforms.value, config.PRESSURE);
    Renderer.renderToFrameBuffer(pressureFBO.write);
    pressureFBO.swap();

    pressureProgram.bind();
    gl.uniform2f(pressureProgram.uniforms.texelSize, velocityFBO.texelSizeX, velocityFBO.texelSizeY);
    gl.uniform1i(pressureProgram.uniforms.uDivergence, divergenceFBO.attach(0));
    for (let i = 0; i < config.PRESSURE_ITERATIONS; i++) {
      gl.uniform1i(pressureProgram.uniforms.uPressure, pressureFBO.read.attach(1));
      Renderer.renderToFrameBuffer(pressureFBO.write);
      pressureFBO.swap();
    }


    gradientSubtractProgram.bind();
    gl.uniform2f(gradientSubtractProgram.uniforms.texelSize, velocityFBO.texelSizeX, velocityFBO.texelSizeY);
    gl.uniform1i(gradientSubtractProgram.uniforms.uPressure, velocityFBO.read.attach(0));
    gl.uniform1i(gradientSubtractProgram.uniforms.uVelocity, velocityFBO.read.attach(1));

    Renderer.renderToFrameBuffer(velocityFBO.write);
    velocityFBO.swap();


    advectionProgram.bind();
    gl.uniform2f(advectionProgram.uniforms.texelSize, velocityFBO.texelSizeX, velocityFBO.texelSizeY);
    if (!ext.supportLinearFiltering)
      gl.uniform2f(advectionProgram.uniforms.dyeTexelSize, velocityFBO.texelSizeX, velocityFBO.texelSizeY);
    let velocityId = velocityFBO.read.attach(0);
    gl.uniform1i(advectionProgram.uniforms.uVelocity, velocityId);
    gl.uniform1i(advectionProgram.uniforms.uSource, velocityId);
    gl.uniform1f(advectionProgram.uniforms.dt, delta);
    gl.uniform1f(advectionProgram.uniforms.dissipation, config.VELOCITY_DISSIPATION);
    Renderer.renderToFrameBuffer(velocityFBO.write);
    velocityFBO.swap();

    // output to display program
    if (!ext.supportLinearFiltering)
      gl.uniform2f(advectionProgram.uniforms.dyeTexelSize, displayFBO.texelSizeX, displayFBO.texelSizeY);
    gl.uniform1i(advectionProgram.uniforms.uVelocity, velocityFBO.read.attach(0));
    gl.uniform1i(advectionProgram.uniforms.uSource, displayFBO.read.attach(1));
    gl.uniform1f(advectionProgram.uniforms.dissipation, config.DENSITY_DISSIPATION);
    Renderer.renderToFrameBuffer(displayFBO.write);
    displayFBO.swap();

    // colorProgram.bind();
    // gl.uniform4f(colorProgram.uniforms.color, 0, 1, 0, 1);


    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.BLEND);

    // render blank background
    colorProgram.bind();
    gl.uniform4f(colorProgram.uniforms.color, .0, .0, .0, 1);

    displayProgram.bind();
    gl.uniform2f(displayProgram.uniforms.texelSize, 1.0 / window.innerWidth, 1.0 / window.innerHeight);
    gl.uniform1i(displayProgram.uniforms.uTexture, displayFBO.read.attach(0));
    Renderer.renderToFrameBuffer(displayFBO.write);

    if (!SHOW_FLUID_SIMULATION) {
      shapeProgram.bind();
      gl.uniform1i(shapeProgram.uniforms.uTexture, displayFBO.read.attach(0));
      gl.uniform1i(shapeProgram.uniforms.uTextureLineShape, lineTexture.attach(1));
      gl.uniform1i(shapeProgram.uniforms.uTextureDotShape, dotTexture.attach(2));
    }

    // render it to screen
    Renderer.renderToScreen();

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);

}





