import{B as e}from"./iframe-CdY22T7n.js";import{K as a}from"./KeyValue-a9TLj5lg.js";import"./preload-helper-PPVm8Dsz.js";import"./index-CqE97RaD.js";import"./cn-DDt1maD9.js";import"./check-BxkDBxqF.js";import"./createLucideIcon-CIh8D4qA.js";const g={title:"Primitives/Data Display/KeyValue",component:a,argTypes:{label:{control:"text"},value:{control:"text"},orientation:{control:"inline-radio",options:["horizontal","vertical"]},align:{control:"inline-radio",options:["between","start"]},size:{control:"inline-radio",options:["sm","md"]},tone:{control:"select",options:["default","muted","success","warning","error"]},monospace:{control:"boolean"},copyable:{control:"boolean"}}},l={args:{label:"Database",value:"PostgreSQL 15.3"},decorators:[d=>e.jsx("div",{style:{width:280},children:e.jsx(d,{})})]},r={render:()=>e.jsxs("div",{style:{width:280,display:"flex",flexDirection:"column",gap:8,padding:12,border:"1px solid var(--color-border-default)",borderRadius:8},children:[e.jsx(a,{label:"Host",value:"localhost"}),e.jsx(a,{label:"Port",value:"5432"}),e.jsx(a,{label:"Database",value:"my_db"}),e.jsx(a,{label:"SSL",value:"Enabled"}),e.jsx(a,{label:"Max connections",value:"100"})]})},o={name:"Vertical (card layout)",render:()=>e.jsxs("div",{style:{width:320,display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,padding:16,border:"1px solid var(--color-border-default)",borderRadius:8},children:[e.jsx(a,{orientation:"vertical",label:"Status",value:"Online",tone:"success"}),e.jsx(a,{orientation:"vertical",label:"Latency",value:"14 ms"}),e.jsx(a,{orientation:"vertical",label:"Region",value:"us-east-1"}),e.jsx(a,{orientation:"vertical",label:"Tier",value:"Premium"})]})},t={render:()=>e.jsxs("div",{style:{width:280,display:"flex",flexDirection:"column",gap:8},children:[e.jsx(a,{label:"Default",value:"—"}),e.jsx(a,{label:"Muted",value:"Idle",tone:"muted"}),e.jsx(a,{label:"Success",value:"Healthy",tone:"success"}),e.jsx(a,{label:"Warning",value:"Degraded",tone:"warning"}),e.jsx(a,{label:"Error",value:"Down",tone:"error"})]})},s={render:()=>e.jsxs("div",{style:{width:320,display:"flex",flexDirection:"column",gap:8},children:[e.jsx(a,{label:"Connection ID",value:"c7d1f8b2-1a3e-4a5f-9c2b-8e7d6f5a4321",monospace:!0}),e.jsx(a,{label:"Host",value:"db-primary.internal.example.com",monospace:!0}),e.jsx(a,{label:"Port",value:"5432",monospace:!0})]})},i={name:"Copyable (hover to reveal)",render:()=>e.jsxs("div",{style:{width:320,display:"flex",flexDirection:"column",gap:8},children:[e.jsx(a,{label:"Host",value:"db-primary.internal.example.com",monospace:!0,copyable:!0}),e.jsx(a,{label:"Connection ID",value:"c7d1f8b2-1a3e-4a5f-9c2b-8e7d6f5a4321",monospace:!0,copyable:!0}),e.jsx(a,{label:"Region",value:"us-east-1",copyable:!0})]})},n={name:"Horizontal start-aligned",render:()=>e.jsxs("div",{style:{width:320,display:"flex",flexDirection:"column",gap:4},children:[e.jsx(a,{align:"start",label:"Driver:",value:"postgres"}),e.jsx(a,{align:"start",label:"Schema:",value:"public"}),e.jsx(a,{align:"start",label:"Encoding:",value:"UTF8"})]})},c={render:()=>e.jsxs("div",{style:{width:280,display:"flex",flexDirection:"column",gap:12},children:[e.jsx(a,{size:"sm",label:"Small",value:"Compact dense layout"}),e.jsx(a,{size:"md",label:"Medium",value:"Comfortable layout"})]})};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    label: 'Database',
    value: 'PostgreSQL 15.3'
  },
  decorators: [Story => <div style={{
    width: 280
  }}><Story /></div>]
}`,...l.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    width: 280,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    padding: 12,
    border: '1px solid var(--color-border-default)',
    borderRadius: 8
  }}>
      <KeyValue label="Host" value="localhost" />
      <KeyValue label="Port" value="5432" />
      <KeyValue label="Database" value="my_db" />
      <KeyValue label="SSL" value="Enabled" />
      <KeyValue label="Max connections" value="100" />
    </div>
}`,...r.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  name: 'Vertical (card layout)',
  render: () => <div style={{
    width: 320,
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
    padding: 16,
    border: '1px solid var(--color-border-default)',
    borderRadius: 8
  }}>
      <KeyValue orientation="vertical" label="Status" value="Online" tone="success" />
      <KeyValue orientation="vertical" label="Latency" value="14 ms" />
      <KeyValue orientation="vertical" label="Region" value="us-east-1" />
      <KeyValue orientation="vertical" label="Tier" value="Premium" />
    </div>
}`,...o.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    width: 280,
    display: 'flex',
    flexDirection: 'column',
    gap: 8
  }}>
      <KeyValue label="Default" value="—" />
      <KeyValue label="Muted" value="Idle" tone="muted" />
      <KeyValue label="Success" value="Healthy" tone="success" />
      <KeyValue label="Warning" value="Degraded" tone="warning" />
      <KeyValue label="Error" value="Down" tone="error" />
    </div>
}`,...t.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    width: 320,
    display: 'flex',
    flexDirection: 'column',
    gap: 8
  }}>
      <KeyValue label="Connection ID" value="c7d1f8b2-1a3e-4a5f-9c2b-8e7d6f5a4321" monospace />
      <KeyValue label="Host" value="db-primary.internal.example.com" monospace />
      <KeyValue label="Port" value="5432" monospace />
    </div>
}`,...s.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  name: 'Copyable (hover to reveal)',
  render: () => <div style={{
    width: 320,
    display: 'flex',
    flexDirection: 'column',
    gap: 8
  }}>
      <KeyValue label="Host" value="db-primary.internal.example.com" monospace copyable />
      <KeyValue label="Connection ID" value="c7d1f8b2-1a3e-4a5f-9c2b-8e7d6f5a4321" monospace copyable />
      <KeyValue label="Region" value="us-east-1" copyable />
    </div>
}`,...i.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  name: 'Horizontal start-aligned',
  render: () => <div style={{
    width: 320,
    display: 'flex',
    flexDirection: 'column',
    gap: 4
  }}>
      <KeyValue align="start" label="Driver:" value="postgres" />
      <KeyValue align="start" label="Schema:" value="public" />
      <KeyValue align="start" label="Encoding:" value="UTF8" />
    </div>
}`,...n.parameters?.docs?.source}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    width: 280,
    display: 'flex',
    flexDirection: 'column',
    gap: 12
  }}>
      <KeyValue size="sm" label="Small" value="Compact dense layout" />
      <KeyValue size="md" label="Medium" value="Comfortable layout" />
    </div>
}`,...c.parameters?.docs?.source}}};const f=["Default","List","Vertical","Tones","Monospace","Copyable","StartAligned","Sizes"];export{i as Copyable,l as Default,r as List,s as Monospace,c as Sizes,n as StartAligned,t as Tones,o as Vertical,f as __namedExportsOrder,g as default};
