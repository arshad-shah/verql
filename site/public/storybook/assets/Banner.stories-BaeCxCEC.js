import{B as n}from"./iframe-CdY22T7n.js";import{B as e}from"./Banner-B-2Lw8fl.js";import{B as c}from"./Button-DVlKTRa-.js";import"./preload-helper-PPVm8Dsz.js";import"./index-CqE97RaD.js";import"./cn-DDt1maD9.js";import"./Flex-CE2f2iq4.js";import"./Text-u8VLJp0e.js";import"./x-CFCsdqrP.js";import"./createLucideIcon-CIh8D4qA.js";import"./info-xDV3YaJU.js";import"./triangle-alert-BmHsaBbn.js";const{fn:l}=__STORYBOOK_MODULE_TEST__,D={title:"Primitives/Feedback/Banner",component:e,argTypes:{variant:{control:"select",options:["default","success","info","warning","error"]}}},r={args:{variant:"info",children:"A new version of verql is available. Restart to update.",style:{width:480}}},a={render:()=>n.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:4,width:480},children:[n.jsx(e,{variant:"default",children:"Default system message banner."}),n.jsx(e,{variant:"success",children:"Success: changes saved."}),n.jsx(e,{variant:"info",children:"Info: scheduled maintenance on Sunday 02:00 UTC."}),n.jsx(e,{variant:"warning",children:"Warning: your trial expires in 3 days."}),n.jsx(e,{variant:"error",children:"Error: failed to sync — check connection."})]})},s={args:{variant:"warning",children:"Your trial expires in 3 days.",onDismiss:l(),style:{width:480}}},i={args:{variant:"info",children:"A new version of verql is available.",action:n.jsx(c,{variant:"ghost",size:"xs",children:"Update now"}),style:{width:480}}},t={args:{variant:"error",children:"Connection lost. Reconnect to continue.",action:n.jsx(c,{variant:"ghost",size:"xs",children:"Reconnect"}),onDismiss:l(),style:{width:480}}},o={args:{variant:"info",children:"Simple text-only banner without an icon.",icon:null,style:{width:480}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'info',
    children: 'A new version of verql is available. Restart to update.',
    style: {
      width: 480
    }
  }
}`,...r.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    width: 480
  }}>
      <Banner variant="default">Default system message banner.</Banner>
      <Banner variant="success">Success: changes saved.</Banner>
      <Banner variant="info">Info: scheduled maintenance on Sunday 02:00 UTC.</Banner>
      <Banner variant="warning">Warning: your trial expires in 3 days.</Banner>
      <Banner variant="error">Error: failed to sync — check connection.</Banner>
    </div>
}`,...a.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'warning',
    children: 'Your trial expires in 3 days.',
    onDismiss: fn(),
    style: {
      width: 480
    }
  }
}`,...s.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'info',
    children: 'A new version of verql is available.',
    action: <Button variant="ghost" size="xs">Update now</Button>,
    style: {
      width: 480
    }
  }
}`,...i.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'error',
    children: 'Connection lost. Reconnect to continue.',
    action: <Button variant="ghost" size="xs">Reconnect</Button>,
    onDismiss: fn(),
    style: {
      width: 480
    }
  }
}`,...t.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'info',
    children: 'Simple text-only banner without an icon.',
    icon: null,
    style: {
      width: 480
    }
  }
}`,...o.parameters?.docs?.source}}};const S=["Default","Variants","Dismissible","WithAction","WithActionAndDismiss","NoIcon"];export{r as Default,s as Dismissible,o as NoIcon,a as Variants,i as WithAction,t as WithActionAndDismiss,S as __namedExportsOrder,D as default};
