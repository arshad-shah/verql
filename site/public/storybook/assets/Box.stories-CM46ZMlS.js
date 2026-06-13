import{B as a}from"./iframe-CdY22T7n.js";import{B as d}from"./Box-Bd47NzIT.js";import"./preload-helper-PPVm8Dsz.js";import"./cn-DDt1maD9.js";const c={title:"Primitives/Layout/Box",component:d,argTypes:{padding:{control:"select",options:[void 0,"xs","sm","md","lg","xl"]},paddingX:{control:"select",options:[void 0,"xs","sm","md","lg","xl"]},paddingY:{control:"select",options:[void 0,"xs","sm","md","lg","xl"]},radius:{control:"select",options:[void 0,"sm","md","lg","full"]}}},r={args:{padding:"md",radius:"md",children:"Box content",style:{background:"var(--color-bg-secondary)",border:"1px solid var(--color-border-default)",color:"var(--color-text-primary)"}}},o={render:()=>a.jsx("div",{style:{display:"flex",flexDirection:"column",gap:12},children:["xs","sm","md","lg","xl"].map(e=>a.jsxs(d,{padding:e,style:{background:"var(--color-bg-secondary)",border:"1px solid var(--color-border-default)",color:"var(--color-text-primary)",borderRadius:6},children:['padding="',e,'"']},e))})};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    padding: 'md',
    radius: 'md',
    children: 'Box content',
    style: {
      background: 'var(--color-bg-secondary)',
      border: '1px solid var(--color-border-default)',
      color: 'var(--color-text-primary)'
    }
  }
}`,...r.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: 12
  }}>
      {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map(p => <Box key={p} padding={p} style={{
      background: 'var(--color-bg-secondary)',
      border: '1px solid var(--color-border-default)',
      color: 'var(--color-text-primary)',
      borderRadius: 6
    }}>
          padding="{p}"
        </Box>)}
    </div>
}`,...o.parameters?.docs?.source}}};const i=["Default","Variants"];export{r as Default,o as Variants,i as __namedExportsOrder,c as default};
