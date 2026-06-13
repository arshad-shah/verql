import{J as s,B as r}from"./iframe-CdY22T7n.js";import{C as d}from"./ChatInput-DcNnlHxw.js";import{u as c}from"./ai-CvrNmzOO.js";import"./preload-helper-PPVm8Dsz.js";import"./connections-DUId3Rta.js";import"./notifications-CxwpcP25.js";import"./react-CM93qTYy.js";import"./toast-CRDfB1Gr.js";import"./ipc-CvYYIIIu.js";import"./schema-DS6dFCac.js";import"./tabs-C7I9_q2c.js";import"./selection-CNDBGd8q.js";import"./ui-D4eVvrGh.js";import"./settings-Df4NhSNk.js";import"./index-8X-GOh7L.js";import"./driver-capabilities-BByz55u6.js";import"./Button-DVlKTRa-.js";import"./index-CqE97RaD.js";import"./cn-DDt1maD9.js";import"./Card-UMTkYlih.js";import"./Text-u8VLJp0e.js";import"./SchemaAutocomplete-N4cW1zyr.js";import"./ModelPicker-BWrVDTSU.js";import"./ScrollArea-DsVAjX50.js";import"./useClickOutside-iKaz7lvc.js";import"./I18nProvider-QSPSpfHa.js";import"./chevron-down-D2vYOdxz.js";import"./createLucideIcon-CIh8D4qA.js";import"./square-SnO96Uuy.js";import"./arrow-up-DGQOQQzZ.js";import"./db-error-BYObUJyz.js";import"./data-nouns-BDP8SmCF.js";import"./notify-error-vjblLAFU.js";import"./registry-D16PU4cN.js";function m(e={}){const{isStreaming:i=!1,activeModel:p="claude-sonnet-4-6",modelName:u="Claude Sonnet 4.6"}=e;c.setState({isStreaming:i,activeModel:p,models:[{id:"claude-sonnet-4-6",name:"Claude Sonnet 4.6",providerId:"anthropic",contextWindow:1e6},{id:"gpt-4o",name:"GPT-4o",providerId:"openai",contextWindow:128e3},{id:"llama3:latest",name:"llama3:latest",providerId:"ollama",contextWindow:8192}],providers:[{id:"anthropic",name:"Anthropic",configured:!0},{id:"openai",name:"OpenAI",configured:!0},{id:"ollama",name:"Ollama",configured:!0}],sendMessage:async()=>{},abort:async()=>{}})}const Q={title:"Components/AI/ChatInput",component:d,decorators:[e=>r.jsx("div",{className:"w-90 border border-border-default rounded-md bg-bg-secondary",children:r.jsx(e,{})})]},t={decorators:[e=>(s.useEffect(()=>{m()},[]),r.jsx(e,{}))]},o={decorators:[e=>(s.useEffect(()=>{m({isStreaming:!0})},[]),r.jsx(e,{}))]},a={decorators:[e=>(s.useEffect(()=>{m({activeModel:"gpt-4o"})},[]),r.jsx(e,{}))]},n={decorators:[e=>(s.useEffect(()=>{m({activeModel:"llama3:latest"})},[]),r.jsx(e,{}))]};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  decorators: [Story => {
    useEffect(() => {
      seedAI();
    }, []);
    return <Story />;
  }]
}`,...t.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  decorators: [Story => {
    useEffect(() => {
      seedAI({
        isStreaming: true
      });
    }, []);
    return <Story />;
  }]
}`,...o.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  decorators: [Story => {
    useEffect(() => {
      seedAI({
        activeModel: 'gpt-4o'
      });
    }, []);
    return <Story />;
  }]
}`,...a.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  decorators: [Story => {
    useEffect(() => {
      seedAI({
        activeModel: 'llama3:latest'
      });
    }, []);
    return <Story />;
  }]
}`,...n.parameters?.docs?.source}}};const U=["Empty","Streaming","ModelGpt","ModelOllama"];export{t as Empty,a as ModelGpt,n as ModelOllama,o as Streaming,U as __namedExportsOrder,Q as default};
