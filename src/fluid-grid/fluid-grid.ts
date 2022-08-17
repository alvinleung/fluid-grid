import * as twgl from "twgl.js";
import { createTimer } from "./utils";

//@ts-ignore
import FLUID_FRAG from "./fluid.frag";
//@ts-ignore
import FLUID_VERT from "./fluid.vert";

const init = (canvas: HTMLCanvasElement, gl: WebGLRenderingContext) => {
  // init webgl
  const program = twgl.createProgramFromSources(gl, [
    FLUID_VERT,
    FLUID_FRAG,
  ]);
  const programInfo = twgl.createProgramInfoFromProgram(gl, program);

  const arrays = {
    a_position: [-1, -1, 0, 1, -1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1, 1, 0],
  };
  const bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);

  return { programInfo, bufferInfo }
}

interface RenderInfo {
  canvas: HTMLCanvasElement,
  gl: WebGLRenderingContext,
  bufferInfo: twgl.BufferInfo,
  programInfo: twgl.ProgramInfo,
  delta: number,
  elapsedTime: number
}
const render = ({
  canvas,
  gl,
  delta,
  elapsedTime,
  programInfo,
  bufferInfo
}: RenderInfo) => {
  const uniforms = {
    uResolution: [canvas.width, canvas.height],
    uMouse: [0, 0],
    uTime: elapsedTime
  };

  gl.useProgram(programInfo.program);
  twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
  twgl.setUniforms(programInfo, uniforms);
  twgl.drawBufferInfo(gl, bufferInfo);
}

export const createFluidGrid = (canvas: HTMLCanvasElement) => {
  const gl = canvas.getContext("webgl") as WebGLRenderingContext
  const { programInfo, bufferInfo } = init(canvas, gl)

  const timer = createTimer();

  requestAnimationFrame(() => {
    render({
      canvas,
      gl,
      delta: 0,
      elapsedTime: timer.getCurrentTime(),
      bufferInfo,
      programInfo
    })
  })

}

