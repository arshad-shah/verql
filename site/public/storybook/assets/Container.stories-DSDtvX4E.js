import{B as a}from"./iframe-CdY22T7n.js";import{C as t}from"./Container-D0pENg5w.js";import"./preload-helper-PPVm8Dsz.js";import"./cn-DDt1maD9.js";const l={title:"Primitives/Layout/Container",component:t,argTypes:{size:{control:"select",options:["sm","md","lg","xl","full"]}}},r={args:{size:"md",children:"Container content — centered with max-width constraint.",style:{background:"var(--color-bg-secondary)",border:"1px solid var(--color-border-default)",color:"var(--color-text-primary)",padding:16,borderRadius:6}}},o={render:()=>a.jsx("div",{style:{display:"flex",flexDirection:"column",gap:12,width:"100%"},children:["sm","md","lg","xl","full"].map(e=>a.jsx(t,{size:e,children:a.jsxs("div",{style:{background:"var(--color-bg-secondary)",border:"1px solid var(--color-border-default)",color:"var(--color-text-primary)",padding:"8px 12px",borderRadius:4,fontSize:12},children:['size="',e,'"']})},e))})};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    size: 'md',
    children: 'Container content — centered with max-width constraint.',
    style: {
      background: 'var(--color-bg-secondary)',
      border: '1px solid var(--color-border-default)',
      color: 'var(--color-text-primary)',
      padding: 16,
      borderRadius: 6
    }
  }
}`,...r.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    width: '100%'
  }}>
      {(['sm', 'md', 'lg', 'xl', 'full'] as const).map(size => <Container key={size} size={size}>
          <div style={{
        background: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border-default)',
        color: 'var(--color-text-primary)',
        padding: '8px 12px',
        borderRadius: 4,
        fontSize: 12
      }}>
            size="{size}"
          </div>
        </Container>)}
    </div>
}`,...o.parameters?.docs?.source}}};const c=["Default","Variants"];export{r as Default,o as Variants,c as __namedExportsOrder,l as default};
