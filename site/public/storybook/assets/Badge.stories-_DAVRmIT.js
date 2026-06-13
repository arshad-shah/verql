import{B as a}from"./iframe-CdY22T7n.js";import{B as i}from"./Badge-Dn_M9v_L.js";import"./preload-helper-PPVm8Dsz.js";import"./index-CqE97RaD.js";import"./cn-DDt1maD9.js";const p={title:"Primitives/Data Display/Badge",component:i,argTypes:{variant:{control:"select",options:["default","accent","success","warning","error","info"]},size:{control:"select",options:["xs","sm","md","lg","xl"]}}},s={args:{variant:"accent",size:"md",children:"New"}},r={render:()=>a.jsx("div",{style:{display:"flex",flexDirection:"column",gap:12},children:["sm","md","lg"].map(e=>a.jsx("div",{style:{display:"flex",gap:8,alignItems:"center"},children:["default","accent","success","warning","error","info"].map(t=>a.jsx(i,{variant:t,size:e,children:t},t))},e))})},n={render:()=>a.jsx("div",{style:{display:"flex",gap:8,alignItems:"center"},children:["xs","sm","md","lg","xl"].map(e=>a.jsx(i,{variant:"accent",size:e,children:e},e))})};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'accent',
    size: 'md',
    children: 'New'
  }
}`,...s.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: 12
  }}>
      {(['sm', 'md', 'lg'] as const).map(size => <div key={size} style={{
      display: 'flex',
      gap: 8,
      alignItems: 'center'
    }}>
          {(['default', 'accent', 'success', 'warning', 'error', 'info'] as const).map(variant => <Badge key={variant} variant={variant} size={size}>{variant}</Badge>)}
        </div>)}
    </div>
}`,...r.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    gap: 8,
    alignItems: 'center'
  }}>
      {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map(size => <Badge key={size} variant="accent" size={size}>{size}</Badge>)}
    </div>
}`,...n.parameters?.docs?.source}}};const g=["Default","Variants","Sizes"];export{s as Default,n as Sizes,r as Variants,g as __namedExportsOrder,p as default};
