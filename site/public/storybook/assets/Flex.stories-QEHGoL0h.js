import{B as e}from"./iframe-CdY22T7n.js";import{F as s}from"./Flex-CE2f2iq4.js";import"./preload-helper-PPVm8Dsz.js";import"./cn-DDt1maD9.js";const o=({children:r})=>e.jsx("div",{style:{padding:"8px 16px",background:"var(--color-bg-tertiary)",borderRadius:4,fontSize:12,color:"var(--color-text-primary)",border:"1px solid var(--color-border-default)"},children:r}),d={title:"Primitives/Layout/Flex",component:s,argTypes:{direction:{control:"select",options:["row","column","row-reverse","column-reverse"]},gap:{control:"select",options:[void 0,"xs","sm","md","lg","xl"]},align:{control:"select",options:[void 0,"start","center","end","stretch","baseline"]},justify:{control:"select",options:[void 0,"start","center","end","between","around","evenly"]},wrap:{control:"boolean"}}},t={args:{direction:"row",gap:"md",align:"center",children:e.jsxs(e.Fragment,{children:[e.jsx(o,{children:"Item A"}),e.jsx(o,{children:"Item B"}),e.jsx(o,{children:"Item C"})]})}},n={render:()=>e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:24},children:["row","column","row-reverse","column-reverse"].map(r=>e.jsxs("div",{children:[e.jsxs("div",{style:{fontSize:11,color:"var(--color-text-secondary)",marginBottom:6},children:['direction="',r,'"']}),e.jsxs(s,{direction:r,gap:"sm",children:[e.jsx(o,{children:"A"}),e.jsx(o,{children:"B"}),e.jsx(o,{children:"C"})]})]},r))})};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    direction: 'row',
    gap: 'md',
    align: 'center',
    children: <>
        <DemoBox>Item A</DemoBox>
        <DemoBox>Item B</DemoBox>
        <DemoBox>Item C</DemoBox>
      </>
  }
}`,...t.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: 24
  }}>
      {(['row', 'column', 'row-reverse', 'column-reverse'] as const).map(dir => <div key={dir}>
          <div style={{
        fontSize: 11,
        color: 'var(--color-text-secondary)',
        marginBottom: 6
      }}>direction="{dir}"</div>
          <Flex direction={dir} gap="sm">
            <DemoBox>A</DemoBox>
            <DemoBox>B</DemoBox>
            <DemoBox>C</DemoBox>
          </Flex>
        </div>)}
    </div>
}`,...n.parameters?.docs?.source}}};const m=["Default","Variants"];export{t as Default,n as Variants,m as __namedExportsOrder,d as default};
