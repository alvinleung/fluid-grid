// Inspiration
// https://github.com/PavelDoGreat/WebGL-Fluid-Simulation/blob/master/script.js
// https://experiments.withgoogle.com/starfluid

import * as twgl from "twgl.js";
import { createTimer } from "./utils";

//@ts-ignore
import BASE_VERT from "./shaders/BaseVertexShader.vert";
//@ts-ignore
import FLUID_FRAG from "./shaders/Fluid.frag";
//@ts-ignore
import DISPLAY_FRAG from "./shaders/DisplayShader.frag";
//@ts-ignore
import PIXELATE_FRAG from "./shaders/Pixelate.frag";

import { compileShader, createProgram, Program } from "./WebGL/Program";
import { Material } from "./WebGL/Material";
import { createDoubleFBO, createFBO, FrameBufferObject } from "./WebGL/FrameBufferObject";
import { getWebGLContext } from "./WebGL/getContext";
import { createRenderer } from "./WebGL/Renderer";

interface RenderInfo {
  canvas: HTMLCanvasElement,
  gl: WebGLRenderingContext,
  delta: number,
  elapsedTime: number
}
const render = ({
  canvas,
  gl,
  delta,
  elapsedTime,
}: RenderInfo) => {

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

  const fluidProgram = new Program(gl, baseVertexShader, fluidShader);
  const pixelateProgram = new Program(gl, baseVertexShader, pixelateShader);


  // Create Frame Buffers
  const displayWidth = window.innerWidth;
  const displayHeight = window.innerHeight;
  const fluidFBO = createDoubleFBO(gl, displayWidth, displayHeight, rgba.internalFormat, rgba.format, texType, gl.NEAREST);
  const pixelateFBO = createDoubleFBO(gl, displayWidth, displayHeight, rgba.internalFormat, rgba.format, texType, gl.NEAREST);
  // const displayFBO = createFBO(gl, displayWidth, displayHeight, rgba.internalFormat, rgba.format, texType, gl.NEAREST);

  const timer = createTimer();
  const Renderer = createRenderer(gl);

  const render = () => {
    // draw the display material
    fluidProgram.bind()
    gl.uniform1f(fluidProgram.uniforms.uTime, timer.getCurrentTime() / 1000);
    gl.uniform2fv(fluidProgram.uniforms.uResolution, [window.innerWidth, window.innerHeight]);
    gl.uniform2fv(fluidProgram.uniforms.uMouse, [mousePos.x, mousePos.y]);

    Renderer.renderToFrameBuffer(fluidFBO.write);
    fluidFBO.swap(); // flip it for the next stage in the pipeline

    pixelateProgram.bind();
    gl.uniform1i(pixelateProgram.uniforms.uTexture, fluidFBO.read.attach(0)); // insert the data to the program
    // Renderer.renderToFrameBuffer(fluidFBO.write);

    // render it to screen
    Renderer.renderToScreen();

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);

}





