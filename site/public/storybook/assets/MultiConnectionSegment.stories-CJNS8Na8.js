import{J as s,B as n}from"./iframe-CdY22T7n.js";import{M as i}from"./MultiConnectionSegment-C0A-rPgL.js";import{a as m}from"./connections-DUId3Rta.js";import"./preload-helper-PPVm8Dsz.js";import"./StatusBarSegment-B9b9S1Aa.js";import"./index-CqE97RaD.js";import"./cn-DDt1maD9.js";import"./createLucideIcon-CIh8D4qA.js";import"./notifications-CxwpcP25.js";import"./react-CM93qTYy.js";import"./toast-CRDfB1Gr.js";import"./ipc-CvYYIIIu.js";import"./schema-DS6dFCac.js";import"./tabs-C7I9_q2c.js";import"./selection-CNDBGd8q.js";import"./ui-D4eVvrGh.js";import"./settings-Df4NhSNk.js";import"./index-8X-GOh7L.js";import"./driver-capabilities-BByz55u6.js";const{fn:d}=__STORYBOOK_MODULE_TEST__;function c(e){m.setState({connectedIds:new Set(Array.from({length:e},(p,a)=>`c${a}`))})}const B={title:"Components/Shell/StatusBar/MultiConnectionSegment",component:i,parameters:{layout:"centered"},args:{onClick:d()},decorators:[e=>n.jsx("div",{className:"flex h-7 items-stretch bg-bg-primary border border-border-default rounded",children:n.jsx(e,{})})]},r={decorators:[e=>(s.useEffect(()=>{c(2)},[]),n.jsx(e,{}))]},t={decorators:[e=>(s.useEffect(()=>{c(5)},[]),n.jsx(e,{}))]},o={decorators:[e=>(s.useEffect(()=>{c(1)},[]),n.jsx(e,{}))]};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  decorators: [Story => {
    useEffect(() => {
      seedConnected(2);
    }, []);
    return <Story />;
  }]
}`,...r.parameters?.docs?.source},description:{story:"Two active connections — the minimum to render.",...r.parameters?.docs?.description}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  decorators: [Story => {
    useEffect(() => {
      seedConnected(5);
    }, []);
    return <Story />;
  }]
}`,...t.parameters?.docs?.source},description:{story:"Several active connections.",...t.parameters?.docs?.description}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  decorators: [Story => {
    useEffect(() => {
      seedConnected(1);
    }, []);
    return <Story />;
  }]
}`,...o.parameters?.docs?.source},description:{story:"A single connection renders nothing (count must be > 1).",...o.parameters?.docs?.description}}};const N=["Two","Many","SingleRendersNothing"];export{t as Many,o as SingleRendersNothing,r as Two,N as __namedExportsOrder,B as default};
