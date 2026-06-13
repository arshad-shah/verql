import{B as t}from"./iframe-CdY22T7n.js";import{A as i}from"./ActionChip-u0nwh5q9.js";import{a as e}from"./registry-D16PU4cN.js";import"./preload-helper-PPVm8Dsz.js";import"./toast-CRDfB1Gr.js";import"./ipc-CvYYIIIu.js";import"./react-CM93qTYy.js";import"./I18nProvider-QSPSpfHa.js";import"./index-8X-GOh7L.js";import"./settings-Df4NhSNk.js";import"./triangle-alert-BmHsaBbn.js";import"./createLucideIcon-CIh8D4qA.js";import"./network-DvKTch__.js";import"./panel-left-BRFinNOa.js";import"./plus-CAnyLFIc.js";import"./settings-CXM-ENgy.js";e.register({id:"new-connection",title:"Add a Connection",description:"Open the connection form",kind:"navigation",run:()=>{}});e.register({id:"run-sql",title:"Run SQL",description:"Run a statement",kind:"mutating",run:()=>{}});const N={title:"Components/AI/ActionChip",component:i,decorators:[a=>t.jsx("div",{style:{padding:16},children:t.jsx(a,{})})]},n={args:{actionId:"new-connection",params:{},children:"Add a connection"}},r={args:{actionId:"run-sql",params:{sql:"CREATE INDEX ..."},children:"Run CREATE INDEX"}},o={args:{actionId:"does-not-exist",params:{},children:"Open something"}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  args: {
    actionId: 'new-connection',
    params: {},
    children: 'Add a connection'
  }
}`,...n.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    actionId: 'run-sql',
    params: {
      sql: 'CREATE INDEX ...'
    },
    children: 'Run CREATE INDEX'
  }
}`,...r.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    actionId: 'does-not-exist',
    params: {},
    children: 'Open something'
  }
}`,...o.parameters?.docs?.source}}};const f=["Navigation","Mutating","Unavailable"];export{r as Mutating,n as Navigation,o as Unavailable,f as __namedExportsOrder,N as default};
