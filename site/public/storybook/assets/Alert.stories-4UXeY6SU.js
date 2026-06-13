import{B as e}from"./iframe-CdY22T7n.js";import{A as t}from"./Alert-Dvw7u8hm.js";import{S as d}from"./shield-DDsFW79G.js";import"./preload-helper-PPVm8Dsz.js";import"./index-CqE97RaD.js";import"./cn-DDt1maD9.js";import"./Flex-CE2f2iq4.js";import"./Text-u8VLJp0e.js";import"./Button-DVlKTRa-.js";import"./x-CFCsdqrP.js";import"./createLucideIcon-CIh8D4qA.js";import"./info-xDV3YaJU.js";import"./triangle-alert-BmHsaBbn.js";import"./circle-check-CBnAbgkE.js";const{fn:u}=__STORYBOOK_MODULE_TEST__,I={title:"Primitives/Feedback/Alert",component:t,argTypes:{variant:{control:"select",options:["default","success","error","warning","info"]},title:{control:"text"}}},s={args:{variant:"info",title:"Heads up",children:"You can change your settings in the preferences panel."},decorators:[r=>e.jsx("div",{style:{width:380},children:e.jsx(r,{})})]},a={render:()=>e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:10,width:380},children:[e.jsx(t,{variant:"default",title:"Default",children:"Something happened that you should know about."}),e.jsx(t,{variant:"success",title:"Success",children:"Query executed — 42 rows returned."}),e.jsx(t,{variant:"error",title:"Error",children:"Failed to connect: authentication failed."}),e.jsx(t,{variant:"warning",title:"Warning",children:"This operation will modify 1,234 rows."}),e.jsx(t,{variant:"info",title:"Info",children:"Indexes will be rebuilt on next startup."})]})},i={args:{variant:"warning",title:"Unsaved changes",children:"You have unsaved changes that will be lost if you navigate away.",onClose:u()},decorators:[r=>e.jsx("div",{style:{width:380},children:e.jsx(r,{})})]},n={args:{variant:"info",title:"Security update",children:"A new security patch is available for your database driver.",icon:e.jsx(d,{size:16,className:"mt-0.5 shrink-0"})},decorators:[r=>e.jsx("div",{style:{width:380},children:e.jsx(r,{})})]},o={args:{variant:"success",title:"Done",children:"All migrations completed successfully.",icon:null},decorators:[r=>e.jsx("div",{style:{width:380},children:e.jsx(r,{})})]},l={args:{variant:"error",title:"Connection lost"},decorators:[r=>e.jsx("div",{style:{width:380},children:e.jsx(r,{})})]},c={args:{variant:"info",children:"Indexes will be rebuilt on next startup."},decorators:[r=>e.jsx("div",{style:{width:380},children:e.jsx(r,{})})]};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'info',
    title: 'Heads up',
    children: 'You can change your settings in the preferences panel.'
  },
  decorators: [Story => <div style={{
    width: 380
  }}><Story /></div>]
}`,...s.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    width: 380
  }}>
      <Alert variant="default" title="Default">Something happened that you should know about.</Alert>
      <Alert variant="success" title="Success">Query executed — 42 rows returned.</Alert>
      <Alert variant="error" title="Error">Failed to connect: authentication failed.</Alert>
      <Alert variant="warning" title="Warning">This operation will modify 1,234 rows.</Alert>
      <Alert variant="info" title="Info">Indexes will be rebuilt on next startup.</Alert>
    </div>
}`,...a.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'warning',
    title: 'Unsaved changes',
    children: 'You have unsaved changes that will be lost if you navigate away.',
    onClose: fn()
  },
  decorators: [Story => <div style={{
    width: 380
  }}><Story /></div>]
}`,...i.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'info',
    title: 'Security update',
    children: 'A new security patch is available for your database driver.',
    icon: <Shield size={16} className="mt-0.5 shrink-0" />
  },
  decorators: [Story => <div style={{
    width: 380
  }}><Story /></div>]
}`,...n.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'success',
    title: 'Done',
    children: 'All migrations completed successfully.',
    icon: null
  },
  decorators: [Story => <div style={{
    width: 380
  }}><Story /></div>]
}`,...o.parameters?.docs?.source}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'error',
    title: 'Connection lost'
  },
  decorators: [Story => <div style={{
    width: 380
  }}><Story /></div>]
}`,...l.parameters?.docs?.source}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'info',
    children: 'Indexes will be rebuilt on next startup.'
  },
  decorators: [Story => <div style={{
    width: 380
  }}><Story /></div>]
}`,...c.parameters?.docs?.source}}};const O=["Default","Variants","Dismissible","CustomIcon","NoIcon","TitleOnly","DescriptionOnly"];export{n as CustomIcon,s as Default,c as DescriptionOnly,i as Dismissible,o as NoIcon,l as TitleOnly,a as Variants,O as __namedExportsOrder,I as default};
