import{B as s}from"./iframe-CdY22T7n.js";import{M as c}from"./ModelPicker-BWrVDTSU.js";import"./preload-helper-PPVm8Dsz.js";import"./Text-u8VLJp0e.js";import"./index-CqE97RaD.js";import"./cn-DDt1maD9.js";import"./Card-UMTkYlih.js";import"./ScrollArea-DsVAjX50.js";import"./useClickOutside-iKaz7lvc.js";import"./I18nProvider-QSPSpfHa.js";import"./index-8X-GOh7L.js";import"./settings-Df4NhSNk.js";import"./ipc-CvYYIIIu.js";import"./react-CM93qTYy.js";const{fn:t}=__STORYBOOK_MODULE_TEST__,a=[{id:"anthropic",name:"Anthropic"},{id:"openai",name:"OpenAI"}],i=[{id:"claude-opus",name:"Claude Opus",contextWindow:2e5,capabilities:["chat","tool-calling"]},{id:"claude-sonnet",name:"Claude Sonnet",contextWindow:2e5,capabilities:["chat","tool-calling"]},{id:"gpt-4o",name:"GPT-4o",contextWindow:128e3,capabilities:["chat","tool-calling"]}],E={title:"Components/AI/ModelPicker",component:c,args:{onSelect:t(),onSelectProvider:t(),onDismiss:t()},decorators:[n=>s.jsx("div",{style:{position:"relative",width:320,height:320},children:s.jsx(n,{})})]},e={args:{providers:a,models:i,activeModel:"claude-opus"}},o={args:{providers:[a[0]],models:i.slice(0,2),activeModel:"claude-sonnet"}},r={args:{providers:[],models:[],activeModel:null}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  args: {
    providers,
    models,
    activeModel: 'claude-opus'
  }
}`,...e.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    providers: [providers[0]],
    models: models.slice(0, 2),
    activeModel: 'claude-sonnet'
  }
}`,...o.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    providers: [],
    models: [],
    activeModel: null
  }
}`,...r.parameters?.docs?.source}}};const P=["Default","SingleProvider","Empty"];export{e as Default,r as Empty,o as SingleProvider,P as __namedExportsOrder,E as default};
