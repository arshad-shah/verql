import{B as a,J as i}from"./iframe-CdY22T7n.js";import{E as d}from"./ExplainPanel-VSF4Rsr_.js";import{u as s}from"./explain-CTZMmjyt.js";import"./preload-helper-PPVm8Dsz.js";import"./Button-DVlKTRa-.js";import"./index-CqE97RaD.js";import"./cn-DDt1maD9.js";import"./notify-error-vjblLAFU.js";import"./toast-CRDfB1Gr.js";import"./ipc-CvYYIIIu.js";import"./react-CM93qTYy.js";import"./notifications-CxwpcP25.js";import"./db-error-BYObUJyz.js";import"./index-8X-GOh7L.js";import"./driver-capabilities-BByz55u6.js";import"./data-nouns-BDP8SmCF.js";import"./I18nProvider-QSPSpfHa.js";import"./settings-Df4NhSNk.js";import"./loader-circle-O_NBEwYb.js";import"./createLucideIcon-CIh8D4qA.js";import"./sparkles-CxexV2Kg.js";function m(){window.electronAPI={invoke:async()=>({streamId:"s1",model:"claude-opus"}),on:()=>()=>{}}}const p={rows:[{id:1,name:"Ada",orders:12},{id:2,name:"Linus",orders:7}],fields:[{name:"id",dataType:"int4"},{name:"name",dataType:"text"},{name:"orders",dataType:"int8"}],rowCount:2,duration:14,affectedRows:0};function n(e){return function(){return i.useEffect(()=>{m(),e.loading?s.getState().startStream(e.tabId,"s1","claude-opus"):s.setState({byTab:{}})},[]),a.jsx(d,{tabId:e.tabId,sql:"SELECT u.name, count(o.id) AS orders FROM users u JOIN orders o ON o.user_id = u.id GROUP BY u.name;",results:p,explanation:e.explanation??null})}}const v={title:"Components/AI/ExplainPanel",component:d,decorators:[e=>a.jsx("div",{style:{padding:16},children:a.jsx(e,{})})]},r={render:n({tabId:"tab-idle"})},o={render:n({tabId:"tab-done",explanation:"This query joins users and orders…"})},t={render:n({tabId:"tab-loading",loading:!0})};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: seed({
    tabId: 'tab-idle'
  })
}`,...r.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: seed({
    tabId: 'tab-done',
    explanation: 'This query joins users and orders…'
  })
}`,...o.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  render: seed({
    tabId: 'tab-loading',
    loading: true
  })
}`,...t.parameters?.docs?.source}}};const B=["Idle","HasExplanation","Loading"];export{o as HasExplanation,r as Idle,t as Loading,B as __namedExportsOrder,v as default};
