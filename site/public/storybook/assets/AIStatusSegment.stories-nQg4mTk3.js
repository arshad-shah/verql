import{J as c,B as i}from"./iframe-CdY22T7n.js";import{A as a}from"./AIStatusSegment-BxzqCcrS.js";import{u as d}from"./ai-CvrNmzOO.js";import"./preload-helper-PPVm8Dsz.js";import"./Popover-ekmZQG1b.js";import"./cn-DDt1maD9.js";import"./Switch-BBKi_QXD.js";import"./index-CqE97RaD.js";import"./Text-u8VLJp0e.js";import"./ui-D4eVvrGh.js";import"./settings-Df4NhSNk.js";import"./ipc-CvYYIIIu.js";import"./react-CM93qTYy.js";import"./index-8X-GOh7L.js";import"./tabs-C7I9_q2c.js";import"./selection-CNDBGd8q.js";import"./monaco-ai-completion-CdHzj8mH.js";import"./StatusBarSegment-B9b9S1Aa.js";import"./format-CHIMByc-.js";import"./I18nProvider-QSPSpfHa.js";import"./loader-circle-O_NBEwYb.js";import"./createLucideIcon-CIh8D4qA.js";import"./sparkles-CxexV2Kg.js";import"./eye-JPLtWa-Z.js";import"./zap-DNul0GQD.js";import"./shield-DDsFW79G.js";import"./minimize-2-Bj0r3-JT.js";import"./settings-CXM-ENgy.js";import"./db-error-BYObUJyz.js";import"./driver-capabilities-BByz55u6.js";import"./data-nouns-BDP8SmCF.js";import"./notify-error-vjblLAFU.js";import"./toast-CRDfB1Gr.js";import"./notifications-CxwpcP25.js";import"./connections-DUId3Rta.js";import"./schema-DS6dFCac.js";import"./registry-D16PU4cN.js";const{userEvent:u,within:l}=__STORYBOOK_MODULE_TEST__;function g(){window.electronAPI={invoke:async()=>{},on:()=>()=>{}}}const S=[{id:"claude-opus",name:"Claude Opus",contextWindow:2e5,capabilities:["chat","tool-calling"]}],v={id:"anthropic",name:"Anthropic"};function n(e){return function(){return c.useEffect(()=>{g(),d.setState({isStreaming:e.isStreaming??!1,activeModel:"claude-opus",activeProvider:v,models:S,sessionStats:{totalInputTokens:e.used??24e3,totalOutputTokens:0,toolCallCount:e.toolCallCount??3},permissionProfile:e.permissionProfile??"ask-write"})},[]),i.jsx("div",{style:{height:28,display:"flex",alignItems:"stretch",background:"var(--color-bg-secondary)"},children:i.jsx(a,{})})}}const ee={title:"Components/AI/AIStatusSegment",component:a},r={render:n({})},t={render:n({isStreaming:!0,used:12e4})},o={render:n({used:19e4,permissionProfile:"auto"})},s={render:n({used:8e4,permissionProfile:"read-only"}),play:async({canvasElement:e})=>{const p=l(e).getByRole("button");await u.click(p)}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: seed({})
}`,...r.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  render: seed({
    isStreaming: true,
    used: 120_000
  })
}`,...t.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: seed({
    used: 190_000,
    permissionProfile: 'auto'
  })
}`,...o.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render: seed({
    used: 80_000,
    permissionProfile: 'read-only'
  }),
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button');
    await userEvent.click(trigger);
  }
}`,...s.parameters?.docs?.source}}};const re=["Idle","Streaming","NearLimit","PopoverOpen"];export{r as Idle,o as NearLimit,s as PopoverOpen,t as Streaming,re as __namedExportsOrder,ee as default};
