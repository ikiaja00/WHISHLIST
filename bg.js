/* Moving "liquid" background (plain WebGL, no library). Falls back to the cream page colour if WebGL is unavailable. */
(()=>{
const cv=document.getElementById('bg');if(!cv)return;
const gl=cv.getContext('webgl',{antialias:false,alpha:false});
if(!gl){cv.remove();return}
const VS='attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
const FS=`
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform float t;uniform vec2 r;uniform vec2 m;uniform float s;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p);vec2 f=fract(p);vec2 u=f*f*(3.-2.*f);
  return mix(mix(h(i),h(i+vec2(1.,0.)),u.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),u.x),u.y);}
float fbm(vec2 p){float v=0.;float a=.5;for(int i=0;i<5;i++){v+=a*n(p);p*=2.;a*=.5;}return v;}
vec3 pal(float x){vec3 a=vec3(1.,.97,.94);vec3 b=vec3(1.,.88,.91);vec3 c=vec3(.99,.76,.84);vec3 d=vec3(.95,.62,.74);
  if(x<.5)return mix(a,b,x*2.);
  if(x<.8)return mix(b,c,(x-.5)/.3);
  return mix(c,d,(x-.8)/.2);}
void main(){
  vec2 uv=gl_FragCoord.xy/r;vec2 p=uv;p.x*=r.x/r.y;
  vec2 mm=m;mm.x*=r.x/r.y;
  float inf=exp(-distance(p,mm)*4.)*s;
  vec2 q=p;q.x+=sin(q.y*4.+t*.35)*.15;q.y+=cos(q.x*4.+t*.25)*.15;q+=inf*.3;
  float v=fbm(q*2.5+t*.05)+inf*.6;v=smoothstep(.25,.95,v);
  vec3 col=pal(v);
  col=mix(col,vec3(1.,.97,.94),smoothstep(.2,.9,distance(uv,vec2(.5,.5)))*.35);
  col+=(h(gl_FragCoord.xy+t*100.)-.5)*.02;
  gl_FragColor=vec4(col,1.);}`;
const mk=(type,src)=>{const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);return s};
const pr=gl.createProgram();gl.attachShader(pr,mk(gl.VERTEX_SHADER,VS));gl.attachShader(pr,mk(gl.FRAGMENT_SHADER,FS));gl.linkProgram(pr);
if(!gl.getProgramParameter(pr,gl.LINK_STATUS)){console.warn('Background shader failed:',gl.getProgramInfoLog(pr));cv.remove();return}
gl.useProgram(pr);
gl.bindBuffer(gl.ARRAY_BUFFER,gl.createBuffer());
gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
const loc=gl.getAttribLocation(pr,'p');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
const U=k=>gl.getUniformLocation(pr,k),ut=U('t'),ur=U('r'),um=U('m'),us=U('s');
const still=matchMedia('(prefers-reduced-motion:reduce)').matches;
let tx=.5,ty=.5,mx=.5,my=.5,ms=0;
function size(){cv.width=Math.max(2,innerWidth*.5|0);cv.height=Math.max(2,innerHeight*.5|0);gl.viewport(0,0,cv.width,cv.height);if(still)requestAnimationFrame(frame)}
addEventListener('resize',size);
addEventListener('pointermove',e=>{tx=e.clientX/innerWidth;ty=1-e.clientY/innerHeight;ms=1});
function frame(now){
  const t=still?3:now/1000;
  mx+=(tx-mx)*.08;my+=(ty-my)*.08;ms*=.96;
  if(ms<.05){tx=.5+Math.sin(t*.25)*.3;ty=.5+Math.cos(t*.18)*.25;ms=.3}
  gl.uniform1f(ut,t);gl.uniform2f(ur,cv.width,cv.height);gl.uniform2f(um,mx,my);gl.uniform1f(us,ms);
  gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
  if(!still)requestAnimationFrame(frame);
}
size();requestAnimationFrame(frame);
})();
