import{B as o}from"./iframe-CdY22T7n.js";import{S as s}from"./Stack--Ivib9E_.js";import"./preload-helper-PPVm8Dsz.js";import"./cn-DDt1maD9.js";const r=({children:e})=>o.jsx("div",{style:{padding:"8px 16px",background:"var(--color-bg-tertiary)",borderRadius:4,fontSize:12,color:"var(--color-text-primary)",border:"1px solid var(--color-border-default)"},children:e}),l={title:"Primitives/Layout/Stack",component:s,argTypes:{direction:{control:"select",options:["vertical","horizontal"]},gap:{control:"select",options:[void 0,"xs","sm","md","lg","xl"]},align:{control:"select",options:[void 0,"start","center","end","stretch","baseline"]}}},t={args:{direction:"vertical",gap:"md",children:o.jsxs(o.Fragment,{children:[o.jsx(r,{children:"First"}),o.jsx(r,{children:"Second"}),o.jsx(r,{children:"Third"})]})}},i={render:()=>o.jsx("div",{style:{display:"flex",flexDirection:"column",gap:24},children:["vertical","horizontal"].map(e=>o.jsxs("div",{children:[o.jsxs("div",{style:{fontSize:11,color:"var(--color-text-secondary)",marginBottom:6},children:['direction="',e,'"']}),o.jsxs(s,{direction:e,gap:"sm",children:[o.jsx(r,{children:"First"}),o.jsx(r,{children:"Second"}),o.jsx(r,{children:"Third"})]})]},e))})};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    direction: 'vertical',
    gap: 'md',
    children: <>
        <DemoBox>First</DemoBox>
        <DemoBox>Second</DemoBox>
        <DemoBox>Third</DemoBox>
      </>
  }
}`,...t.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: 24
  }}>
      {(['vertical', 'horizontal'] as const).map(dir => <div key={dir}>
          <div style={{
        fontSize: 11,
        color: 'var(--color-text-secondary)',
        marginBottom: 6
      }}>direction="{dir}"</div>
          <Stack direction={dir} gap="sm">
            <DemoBox>First</DemoBox>
            <DemoBox>Second</DemoBox>
            <DemoBox>Third</DemoBox>
          </Stack>
        </div>)}
    </div>
}`,...i.parameters?.docs?.source}}};const m=["Default","Variants"];export{t as Default,i as Variants,m as __namedExportsOrder,l as default};
