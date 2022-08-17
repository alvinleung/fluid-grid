type Uniforms = {
  [key: string]: any
}

export class Program {
  program: WebGLProgram;
  uniforms: Uniforms;
  gl: WebGLRenderingContext;

  constructor(gl: WebGLRenderingContext, vertexShader, fragmentShader) {
    this.program = createProgram(gl, vertexShader, fragmentShader);
    this.uniforms = getUniforms(gl, this.program);
    this.gl = gl;
  }

  bind() {
    this.gl.useProgram(this.program);
  }
}

export function createProgram(gl: WebGLRenderingContext, vertexShader, fragmentShader) {
  let program = gl.createProgram();

  if (!program) throw "Cannot create shader"

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS))
    console.trace(gl.getProgramInfoLog(program));

  return program;
}


export function compileShader(gl: WebGLRenderingContext, type: number, sourceStr: string, keywords: string[]) {

  const source = addKeywords(sourceStr, keywords);

  const shader = gl.createShader(type);

  if (!shader) throw "Cannot create shader"

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.trace(gl.getShaderInfoLog(shader));
  }

  return shader;
};

function addKeywords(source: string, keywords: string[]) {
  if (keywords == null) return source;
  let keywordsString = '';

  keywords.forEach(keyword => {
    keywordsString += '#define ' + keyword + '\n';
  });
  return keywordsString + source;
}

export function getUniforms(gl: WebGLRenderingContext, program: WebGLProgram) {
  let uniforms = {};
  let uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < uniformCount; i++) {
    const activeUniform = gl.getActiveUniform(program, i)
    if (!activeUniform) throw "Cannot get active uniform from shader";

    let uniformName = activeUniform.name;
    uniforms[uniformName] = gl.getUniformLocation(program, uniformName);
  }
  return uniforms;
}

