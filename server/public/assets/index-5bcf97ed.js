import{h as T,g as z,am as U,s as B,_ as m,m as F,an as C,e as j,n as A,o as I,j as a,w as X,x as N,a as t,F as O,L as D,T as n,S as r,C as u,ao as h,c as y,ap as E,d as H,aq as k,ar as K,as as q,at as V,au as G,av as J,aw as Q,ax as Y,ay as Z,az as aa}from"./index-8d5c91a2.js";import{P as ia,B as ea}from"./index-f9ff5fde.js";import{C as g}from"./index-b5e2d7a2.js";function ra(i){return String(i).match(/[\d.\-+]*\s*(.*)/)[1]||""}function na(i){return parseFloat(i)}function ta(i){return T("MuiSkeleton",i)}z("MuiSkeleton",["root","text","rectangular","rounded","circular","pulse","wave","withChildren","fitContent","heightAuto"]);const sa=["animation","className","component","height","style","variant","width"];let v=i=>i,L,W,S,R;const oa=i=>{const{classes:e,variant:s,animation:c,hasChildren:d,width:f,height:p}=i;return N({root:["root",s,c,d&&"withChildren",d&&!f&&"fitContent",d&&!p&&"heightAuto"]},ta,e)},ca=U(L||(L=v`
  0% {
    opacity: 1;
  }

  50% {
    opacity: 0.4;
  }

  100% {
    opacity: 1;
  }
`)),la=U(W||(W=v`
  0% {
    transform: translateX(-100%);
  }

  50% {
    /* +0.5s of delay between each loop */
    transform: translateX(100%);
  }

  100% {
    transform: translateX(100%);
  }
`)),da=B("span",{name:"MuiSkeleton",slot:"Root",overridesResolver:(i,e)=>{const{ownerState:s}=i;return[e.root,e[s.variant],s.animation!==!1&&e[s.animation],s.hasChildren&&e.withChildren,s.hasChildren&&!s.width&&e.fitContent,s.hasChildren&&!s.height&&e.heightAuto]}})(({theme:i,ownerState:e})=>{const s=ra(i.shape.borderRadius)||"px",c=na(i.shape.borderRadius);return m({display:"block",backgroundColor:i.vars?i.vars.palette.Skeleton.bg:F(i.palette.text.primary,i.palette.mode==="light"?.11:.13),height:"1.2em"},e.variant==="text"&&{marginTop:0,marginBottom:0,height:"auto",transformOrigin:"0 55%",transform:"scale(1, 0.60)",borderRadius:`${c}${s}/${Math.round(c/.6*10)/10}${s}`,"&:empty:before":{content:'"\\00a0"'}},e.variant==="circular"&&{borderRadius:"50%"},e.variant==="rounded"&&{borderRadius:(i.vars||i).shape.borderRadius},e.hasChildren&&{"& > *":{visibility:"hidden"}},e.hasChildren&&!e.width&&{maxWidth:"fit-content"},e.hasChildren&&!e.height&&{height:"auto"})},({ownerState:i})=>i.animation==="pulse"&&C(S||(S=v`
      animation: ${0} 1.5s ease-in-out 0.5s infinite;
    `),ca),({ownerState:i,theme:e})=>i.animation==="wave"&&C(R||(R=v`
      position: relative;
      overflow: hidden;

      /* Fix bug in Safari https://bugs.webkit.org/show_bug.cgi?id=68196 */
      -webkit-mask-image: -webkit-radial-gradient(white, black);

      &::after {
        animation: ${0} 1.6s linear 0.5s infinite;
        background: linear-gradient(
          90deg,
          transparent,
          ${0},
          transparent
        );
        content: '';
        position: absolute;
        transform: translateX(-100%); /* Avoid flash during server-side hydration */
        bottom: 0;
        left: 0;
        right: 0;
        top: 0;
      }
    `),la,(e.vars||e).palette.action.hover)),ha=j.forwardRef(function(e,s){const c=A({props:e,name:"MuiSkeleton"}),{animation:d="pulse",className:f,component:p="span",height:b,style:_,variant:$="text",width:P}=c,w=I(c,sa),x=m({},c,{animation:d,component:p,variant:$,hasChildren:!!w.children}),M=oa(x);return a(da,m({as:p,ref:s,className:X(M.root,f),ownerState:x},w,{style:m({width:P,height:b},_)}))}),l=ha,o=["primary","secondary","tertiary","cuaternary","error","warning","success","info"];function ma(){return t(O,{children:[a(ia,{title:"Loaders Elements",children:t(ea,{"aria-label":"breadcrumb",sx:{textTransform:"uppercase"},children:[a(D,{underline:"hover",href:"#!",children:"Inicio"}),a(n,{color:"text.tertiary",children:"Components"}),a(n,{color:"text.tertiary",children:"Loaders"})]})}),t(r,{spacing:3,children:[t(u,{type:"section",children:[a(g,{title:"MUI Loaders",subtitle:"React progress MUI components"}),t(r,{spacing:3,children:[a(r,{direction:"row",spacing:2,flexWrap:"wrap",children:o.map((i,e)=>t(r,{spacing:1,children:[a(h,{color:i}),a(n,{variant:"caption",children:i})]},e))}),a(n,{variant:"subtitle1",children:"Thickness"}),a(r,{direction:"row",spacing:2,flexWrap:"wrap",children:o.map((i,e)=>t(r,{spacing:1,children:[a(h,{color:i,thickness:9}),a(n,{variant:"caption",children:i})]},e))}),a(n,{variant:"subtitle1",children:"Size"}),a(r,{direction:"row",spacing:2,flexWrap:"wrap",children:o.map((i,e)=>t(r,{spacing:1,children:[a(h,{color:i,size:70}),a(n,{variant:"caption",children:i})]},e))}),a(n,{variant:"subtitle1",children:"Custom Circle progress"}),a(r,{direction:"row",spacing:2,flexWrap:"wrap",children:o.map((i,e)=>t(r,{spacing:1,children:[t(y,{sx:{position:"relative"},children:[a(h,{variant:"determinate",sx:{color:s=>s.palette.grey[s.palette.mode==="light"?200:800]},size:70,thickness:6,value:100}),a(h,{variant:"indeterminate",disableShrink:!0,color:i,sx:{animationDuration:"1000ms",position:"absolute",left:0,[`& .${E.circle}`]:{strokeLinecap:"round"}},size:70,thickness:6})]}),a(n,{variant:"caption",children:i})]},e))}),a(n,{variant:"subtitle1",children:"Linear Progress"}),a(r,{direction:"column",spacing:2,flexWrap:"wrap",children:o.map((i,e)=>t("div",{children:[a(n,{variant:"caption",children:i}),a(H,{color:i})]},e))})]})]}),t(u,{type:"section",children:[a(g,{title:"Custom Logo Loader"}),a(k,{}),a(y,{bgcolor:"background.default",py:4,mt:3,children:a(k,{})})]}),t(u,{type:"section",children:[a(g,{title:"Custom Loaders",subtitle:"Use the one you like best"}),t(r,{spacing:3,children:[a(n,{variant:"subtitle1",children:"Rotating plane"}),a(r,{direction:"row",spacing:2,flexWrap:"wrap",children:o.map((i,e)=>t(r,{spacing:1,children:[a(K,{color:`${i}.main`}),a(n,{variant:"caption",children:i})]},e))}),a(n,{variant:"subtitle1",children:"Double bounce"}),a(r,{direction:"row",spacing:2,flexWrap:"wrap",children:o.map((i,e)=>t(r,{spacing:1,children:[a(q,{color:i}),a(n,{variant:"caption",children:i})]},e))}),a(n,{variant:"subtitle1",children:"Wave"}),a(r,{direction:"row",spacing:5,flexWrap:"wrap",children:o.map((i,e)=>t(r,{spacing:1,children:[a(V,{color:i}),a(n,{variant:"caption",children:i})]},e))}),a(n,{variant:"subtitle1",children:"Wandering cubes"}),a(r,{direction:"row",spacing:5,flexWrap:"wrap",children:o.map((i,e)=>t(r,{spacing:1,children:[a(G,{color:i}),a(n,{variant:"caption",children:i})]},e))}),a(n,{variant:"subtitle1",children:"Chasing dots"}),a(r,{direction:"row",spacing:5,flexWrap:"wrap",children:o.map((i,e)=>t(r,{spacing:1,children:[a(J,{color:i}),a(n,{variant:"caption",children:i})]},e))}),a(n,{variant:"subtitle1",children:"Three bounce"}),a(r,{direction:"row",spacing:5,flexWrap:"wrap",children:o.map((i,e)=>t(r,{spacing:1,children:[a(Q,{color:i}),a(n,{variant:"caption",children:i})]},e))}),a(n,{variant:"subtitle1",children:"Cube grid"}),a(r,{direction:"row",spacing:5,flexWrap:"wrap",children:o.map((i,e)=>t(r,{spacing:1,children:[a(Y,{color:i}),a(n,{variant:"caption",children:i})]},e))}),a(n,{variant:"subtitle1",children:"Circle"}),a(r,{direction:"row",spacing:5,flexWrap:"wrap",children:o.map((i,e)=>t(r,{spacing:1,children:[a(Z,{color:i}),a(n,{variant:"caption",children:i})]},e))}),a(n,{variant:"subtitle1",children:"Fading circle"}),a(r,{direction:"row",spacing:5,flexWrap:"wrap",children:o.map((i,e)=>t(r,{spacing:1,children:[a(aa,{color:i}),a(n,{variant:"caption",children:i})]},e))})]})]}),t(u,{type:"section",children:[a(g,{title:"MUI Skeleton"}),t(r,{spacing:1,children:[a(l,{variant:"text",sx:{fontSize:"1rem"}}),a(l,{variant:"circular",width:40,height:40}),a(l,{variant:"rectangular",width:210,height:60}),a(l,{variant:"rounded",width:210,height:60}),a(l,{}),a(l,{animation:"wave"}),a(l,{animation:!1})]})]})]})]})}export{ma as default};
