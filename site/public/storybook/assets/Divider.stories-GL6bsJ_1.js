import{B as e}from"./iframe-CdY22T7n.js";import{D as i}from"./Divider-CC5zJA6v.js";import"./preload-helper-PPVm8Dsz.js";import"./cn-DDt1maD9.js";const l={title:"Primitives/Layout/Divider",component:i,argTypes:{orientation:{control:"select",options:["horizontal","vertical"]}}},r={args:{orientation:"horizontal"},decorators:[o=>e.jsxs("div",{style:{width:300,color:"var(--color-text-primary)"},children:[e.jsx("div",{style:{padding:"8px 0",fontSize:12},children:"Above the divider"}),e.jsx(o,{}),e.jsx("div",{style:{padding:"8px 0",fontSize:12},children:"Below the divider"})]})]},t={render:()=>e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:12,height:40,color:"var(--color-text-primary)",fontSize:12},children:[e.jsx("span",{children:"Left"}),e.jsx(i,{orientation:"vertical",style:{height:"100%"}}),e.jsx("span",{children:"Right"})]})};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    orientation: 'horizontal'
  },
  decorators: [Story => <div style={{
    width: 300,
    color: 'var(--color-text-primary)'
  }}>
        <div style={{
      padding: '8px 0',
      fontSize: 12
    }}>Above the divider</div>
        <Story />
        <div style={{
      padding: '8px 0',
      fontSize: 12
    }}>Below the divider</div>
      </div>]
}`,...r.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    height: 40,
    color: 'var(--color-text-primary)',
    fontSize: 12
  }}>
      <span>Left</span>
      <Divider orientation="vertical" style={{
      height: '100%'
    }} />
      <span>Right</span>
    </div>
}`,...t.parameters?.docs?.source}}};const c=["Default","Vertical"];export{r as Default,t as Vertical,c as __namedExportsOrder,l as default};
