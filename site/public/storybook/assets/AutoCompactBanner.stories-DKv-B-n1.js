import{B as d,J as u}from"./iframe-CdY22T7n.js";import{A as m}from"./AutoCompactBanner-CpHU1TK2.js";import{u as l}from"./ai-CvrNmzOO.js";import"./preload-helper-PPVm8Dsz.js";import"./I18nProvider-QSPSpfHa.js";import"./index-8X-GOh7L.js";import"./settings-Df4NhSNk.js";import"./ipc-CvYYIIIu.js";import"./react-CM93qTYy.js";import"./triangle-alert-BmHsaBbn.js";import"./createLucideIcon-CIh8D4qA.js";import"./loader-circle-O_NBEwYb.js";import"./check-BxkDBxqF.js";import"./rotate-ccw-C-lQpUWg.js";import"./x-CFCsdqrP.js";import"./db-error-BYObUJyz.js";import"./driver-capabilities-BByz55u6.js";import"./data-nouns-BDP8SmCF.js";import"./notify-error-vjblLAFU.js";import"./toast-CRDfB1Gr.js";import"./notifications-CxwpcP25.js";import"./ui-D4eVvrGh.js";import"./connections-DUId3Rta.js";import"./schema-DS6dFCac.js";import"./tabs-C7I9_q2c.js";import"./selection-CNDBGd8q.js";import"./registry-D16PU4cN.js";function g(){window.electronAPI={invoke:async()=>{},on:()=>()=>{}}}const c=e=>Array.from({length:e},(p,i)=>({id:String(i),role:i%2===0?"user":"assistant",content:`m${i}`,timestamp:0}));function o(e){return function(){return u.useEffect(()=>{g(),l.setState({activeModel:"demo",models:[{id:"demo",name:"demo",contextWindow:e.contextWindow,inputCost:0,outputCost:0}],sessionStats:{totalInputTokens:e.used,totalOutputTokens:0,toolCallCount:0},messages:c(e.messageCount??8),isStreaming:!1,isAwaitingResponse:!1,isCompacting:e.isCompacting??!1,activeConversationId:"c1",autoCompactSuppressed:e.suppressed?{c1:!0}:{},lastPreCompactMessages:e.lastSnapshot??null})},[]),d.jsx(m,{})}}const z={title:"Components/AI/AutoCompactBanner",component:m,decorators:[e=>d.jsx("div",{style:{width:380,background:"var(--color-bg-primary)"},children:d.jsx(e,{})})]},t={render:o({used:3e4,contextWindow:2e5})},r={render:o({used:164e3,contextWindow:2e5})},s={render:o({used:164e3,contextWindow:2e5,isCompacting:!0})},n={render:o({used:3e4,contextWindow:2e5,lastSnapshot:c(8)})},a={render:o({used:192e3,contextWindow:2e5})};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  render: seed({
    used: 30_000,
    contextWindow: 200_000
  })
}`,...t.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: seed({
    used: 164_000,
    contextWindow: 200_000
  })
}`,...r.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render: seed({
    used: 164_000,
    contextWindow: 200_000,
    isCompacting: true
  })
}`,...s.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  render: seed({
    used: 30_000,
    contextWindow: 200_000,
    lastSnapshot: msgs(8)
  })
}`,...n.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  render: seed({
    used: 192_000,
    contextWindow: 200_000
  })
}`,...a.parameters?.docs?.source}}};const D=["Idle","Pending","Compacting","SuccessWithUndo","Forced"];export{s as Compacting,a as Forced,t as Idle,r as Pending,n as SuccessWithUndo,D as __namedExportsOrder,z as default};
