export const bufferVertexShader = `
precision highp float;
void main(){
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`;
