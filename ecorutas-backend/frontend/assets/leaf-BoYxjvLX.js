import{r as c}from"./index-BRU4RZZk.js";/**
 * @license lucide-react v1.64.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const B=t=>t==null?void 0:t.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase();/**
 * @license lucide-react v1.64.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */function p(t,e,n=[]){if(e==null)throw new Error("[lucide]: iconNode is required when icon name is used");return{name:B(t),size:24,node:e,...n.length>0?{aliases:n}:{}}}/**
 * @license lucide-react v1.64.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const E=t=>{let e="",n=!1;for(const o of t){if(o==="-"||o==="_"||o<=" "){n=e.length>0;continue}e.length===0?e+=o.toLowerCase():e+=n?o.toUpperCase():o,n=!1}return e};/**
 * @license lucide-react v1.64.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const I=t=>{const e=E(t);return e.charAt(0).toUpperCase()+e.slice(1)};/**
 * @license lucide-react v1.64.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const m=(...t)=>t.filter((e,n,o)=>!!e&&e.trim()!==""&&o.indexOf(e)===n).join(" ").trim();/**
 * @license lucide-react v1.64.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const r={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor","stroke-width":2,"stroke-linecap":"round","stroke-linejoin":"round"};/**
 * @license lucide-react v1.64.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */function S(t){return t!=null}function $(t,e={}){var b,w;const n=e.attributeNames??{},o=i=>n[i]??i,l=t.size??t.width??r.width,d=t.size??t.height??r.height,h=((b=t.aliases)==null?void 0:b.filter(i=>typeof i=="string"&&i.trim()!=="").map(i=>`lucide-${i}`))??[],f=[...t.name?[`lucide-${t.name}`]:[],...h],s=((w=e.className)==null?void 0:w.split(" ").filter(Boolean))??[],k=e.includeDefaultClasses===!1?m(...s):m("lucide",...f,...s),x=e.absoluteStrokeWidth?Number(e.strokeWidth??r["stroke-width"])*Number(t.size??t.width??r.width)/Number(e.size??e.width??r.width):e.strokeWidth??r["stroke-width"];return["svg",{...Object.entries(r).reduce((i,[u,a])=>(i[o(u)]=a,i),{}),..."color"in e&&e.color&&{[o("stroke")]:e.color},..."size"in e&&S(e.size)&&{[o("width")]:e.size,[o("height")]:e.size},..."width"in e&&S(e.width)&&{[o("width")]:e.width},..."height"in e&&S(e.height)&&{[o("height")]:e.height},[o("stroke-width")]:x,...k&&{[o("class")]:k},[o("viewBox")]:`0 0 ${l} ${d}`,...e.hasA11yProp===!1?{[o("aria-hidden")]:"true"}:{},..."attributes"in e&&e.attributes},t.node.map(i=>{const[u,a,C]=i,g=e.nonScalingStroke?{[o("vector-effect")]:"non-scaling-stroke",...a}:a;return C?[u,g,C]:[u,g]})]}/**
 * @license lucide-react v1.64.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */function P(t,e={}){return $(t,{...e,attributeNames:{...e.attributeNames,class:"className","stroke-width":"strokeWidth","stroke-linecap":"strokeLinecap","stroke-linejoin":"strokeLinejoin","vector-effect":"vectorEffect"}})}/**
 * @license lucide-react v1.64.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const D=t=>{for(const e in t)if(e.startsWith("aria-")||e==="role"||e==="title")return!0;return!1},R=c.createContext({}),_=()=>c.useContext(R),F=c.forwardRef(({color:t,size:e,width:n,height:o,strokeWidth:l,absoluteStrokeWidth:d,nonScalingStroke:h,className:f="",children:s,iconNode:k=[],icon:x={node:k,aliases:[],size:24},...N},b)=>{const{size:w=24,strokeWidth:i=2,absoluteStrokeWidth:u=!1,nonScalingStroke:a=!1,color:C="currentColor",className:g=""}=_()??{},z=!!s||D(N),[W,L,v=[]]=P(x,{color:t??C,width:n??e??w,height:o??e??w,strokeWidth:l??i,absoluteStrokeWidth:d??u,nonScalingStroke:h??a,className:m(g,f),hasA11yProp:z,attributes:N});return c.createElement(W,{ref:b,...L},[...v.map(([y,j])=>c.createElement(y,j)),...Array.isArray(s)?s:[s]])});/**
 * @license lucide-react v1.64.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */function M(t,e=[],n=[]){const o=typeof t=="string"?p(t,e,n):t,l=c.forwardRef(({className:d,...h},f)=>c.createElement(F,{ref:f,icon:o,className:d,...h}));return o.name&&(l.displayName=I(o.name)),l}/**
 * @license lucide-react v1.64.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const A={name:"leaf",size:24,node:[["path",{d:"M11 20a10 10 0 0010-10 25.9 25.9 0 00-1.04-7.281 1 1 0 00-1.755-.325C15.833 5.5 13 5.5 9.8 6.1A7 7 0 0011 20",key:"1wjnjv"}],["path",{d:"M2 21a5 5 0 012.911-4.544C7.613 15.212 8.351 15.24 11 13",key:"c1ejpn"}]]};A.node;const q=M(A);export{q as L,M as c};
