// Inspiration
// https://github.com/PavelDoGreat/WebGL-Fluid-Simulation/blob/master/script.js
// https://experiments.withgoogle.com/starfluid

import { createTimer } from "./utils";

import BASE_VERT from "./shaders/BaseVertexShader.vert";
import FLUID_FRAG from "./shaders/Fluid.frag";
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



import { compileShader, createProgram, Program } from "./WebGL/Program";
import { Material } from "./WebGL/Material";
import { createDoubleFBO, createFBO, FrameBufferObject } from "./WebGL/FrameBufferObject";
import { getWebGLContext } from "./WebGL/getContext";
import { createRenderer } from "./WebGL/Renderer";
import { createTextureFromCanvas } from "./WebGL/Texture";

interface RenderInfo {
  canvas: HTMLCanvasElement,
  gl: WebGLRenderingContext,
  delta: number,
  elapsedTime: number
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


export const createFluidGrid = (canvas: HTMLCanvasElement) => {

  // ================================================================
  // for user input
  const mousePos = {
    x: 0,
    y: 0
  }
  window.addEventListener("mousemove", (e) => {
    mousePos.x = e.clientX;
    mousePos.y = e.clientY;
  })

  // ================================================================

  const { gl, ext } = getWebGLContext(canvas);
  const texType = ext.halfFloatTexType;
  const rgba = ext.formatRGBA;
  const rg = ext.formatRG;
  const r = ext.formatR;
  const filtering = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;


  const baseVertexShader = compileShader(gl, gl.VERTEX_SHADER, BASE_VERT, []);
  const fluidShader = compileShader(gl, gl.FRAGMENT_SHADER, FLUID_FRAG, []);
  const pixelateShader = compileShader(gl, gl.FRAGMENT_SHADER, PIXELATE_FRAG, []);
  const shapeShader = compileShader(gl, gl.FRAGMENT_SHADER, SHAPE_FRAG, []);

  const fluidProgram = new Program(gl, baseVertexShader, fluidShader);
  const pixelateProgram = new Program(gl, baseVertexShader, pixelateShader);
  const shapeProgram = new Program(gl, baseVertexShader, shapeShader);


  // Create Frame Buffers
  const displayWidth = window.innerWidth;
  const displayHeight = window.innerHeight;
  const fluidFBO = createDoubleFBO(gl, displayWidth, displayHeight, rgba.internalFormat, rgba.format, texType, gl.NEAREST);
  const pixelateFBO = createDoubleFBO(gl, displayWidth, displayHeight, rgba.internalFormat, rgba.format, texType, gl.NEAREST);
  // const displayFBO = createFBO(gl, displayWidth, displayHeight, rgba.internalFormat, rgba.format, texType, gl.NEAREST);

  const timer = createTimer();
  const { lineTexture, dotTexture } = (() => {
    const lineShape = createLineShape();
    const lineTexture = createTextureFromCanvas(gl, lineShape);

    const dotShape = createDotShape();
    const dotTexture = createTextureFromCanvas(gl, dotShape);
    return { lineTexture, dotTexture }
  })();

  const Renderer = createRenderer(gl);
  const render = () => {
    fluidProgram.bind()
    gl.uniform1f(fluidProgram.uniforms.uTime, timer.getCurrentTime() / 1000);
    gl.uniform2fv(fluidProgram.uniforms.uResolution, [window.innerWidth, window.innerHeight]);
    gl.uniform2fv(fluidProgram.uniforms.uMouse, [mousePos.x, mousePos.y]);

    Renderer.renderToFrameBuffer(fluidFBO.write);
    fluidFBO.swap(); // flip it for the next stage in the pipeline

    // pixelateProgram.bind();
    // gl.uniform1i(pixelateProgram.uniforms.uTexture, fluidFBO.read.attach(0)); // insert the data to the program

    // Renderer.renderToFrameBuffer(pixelateFBO.write);
    // pixelateFBO.swap();

    shapeProgram.bind();
    gl.uniform1i(shapeProgram.uniforms.uTexture, fluidFBO.read.attach(0));
    gl.uniform1i(shapeProgram.uniforms.uTextureLineShape, lineTexture.attach(1));
    gl.uniform1i(shapeProgram.uniforms.uTextureDotShape, dotTexture.attach(2));

    // render it to screen
    Renderer.renderToScreen();

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);

}





