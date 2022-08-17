//https://github.com/PavelDoGreat/WebGL-Fluid-Simulation/blob/master/script.js

import * as twgl from "twgl.js";
import { createTimer } from "./utils";

//@ts-ignore
import BASE_VERT from "./shaders/BaseVertexShader.vert";
//@ts-ignore
import DISPLAY_FRAG from "./shaders/DisplayShader.frag";

import { compileShader, Program } from "./WebGL/Program";
import { Material } from "./WebGL/Material";
import { createFBO, FrameBufferObject } from "./WebGL/FrameBufferObject";
import { getWebGLContext } from "./WebGL/getContext";

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

  const { gl, ext } = getWebGLContext(canvas);

  const baseVertexShader = compileShader(gl, gl.VERTEX_SHADER, BASE_VERT, []);

  // const simpleProgram = new Program(gl, baseVertexShader, simpleFragShader);
  const displayMaterial = new Material(gl, baseVertexShader, DISPLAY_FRAG);

  const texType = ext.halfFloatTexType;
  const rgba = ext.formatRGBA;
  const rg = ext.formatRG;
  const r = ext.formatR;
  const filtering = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;


  const displayWidth = window.innerWidth;
  const displayHeight = window.innerHeight;
  const displayFBO = createFBO(gl, displayWidth, displayHeight, rgba.internalFormat, rgba.format, texType, gl.NEAREST);

  const timer = createTimer();

  const blit = (() => {
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

    return (target?: FrameBufferObject, clear = false) => {
      if (target == null) {
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      }
      else {
        gl.viewport(0, 0, target.width, target.height);
        gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
      }
      if (clear) {
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
      }
      // CHECK_FRAMEBUFFER_STATUS();
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    }
  })();

  const render = () => {
    // draw the display material
    displayMaterial.bind();
    gl.uniform1f(displayMaterial.uniforms.uTime, timer.getCurrentTime());

    displayMaterial.uniforms

    // render it to screen
    blit();
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);

}



