import{B as o}from"./iframe-CdY22T7n.js";import{G as i}from"./Grid-C7p1bp0f.js";import"./preload-helper-PPVm8Dsz.js";import"./cn-DDt1maD9.js";const e=({children:r})=>o.jsx("div",{style:{padding:"8px 16px",background:"var(--color-bg-tertiary)",borderRadius:4,fontSize:12,color:"var(--color-text-primary)",border:"1px solid var(--color-border-default)",textAlign:"center"},children:r}),x={title:"Primitives/Layout/Grid",component:i,argTypes:{columns:{control:"select",options:[1,2,3,4,5,6,12]},gap:{control:"select",options:[void 0,"xs","sm","md","lg","xl"]}}},s={args:{columns:3,gap:"md",children:o.jsxs(o.Fragment,{children:[o.jsx(e,{children:"1"}),o.jsx(e,{children:"2"}),o.jsx(e,{children:"3"}),o.jsx(e,{children:"4"}),o.jsx(e,{children:"5"}),o.jsx(e,{children:"6"})]}),style:{width:480}}},n={render:()=>o.jsx("div",{style:{display:"flex",flexDirection:"column",gap:24,width:480},children:[2,3,4].map(r=>o.jsxs("div",{children:[o.jsxs("div",{style:{fontSize:11,color:"var(--color-text-secondary)",marginBottom:6},children:["columns=",r]}),o.jsx(i,{columns:r,gap:"sm",children:Array.from({length:r*2},(a,t)=>o.jsx(e,{children:t+1},t))})]},r))})};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    columns: 3,
    gap: 'md',
    children: <>
        <DemoBox>1</DemoBox>
        <DemoBox>2</DemoBox>
        <DemoBox>3</DemoBox>
        <DemoBox>4</DemoBox>
        <DemoBox>5</DemoBox>
        <DemoBox>6</DemoBox>
      </>,
    style: {
      width: 480
    }
  }
}`,...s.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
    width: 480
  }}>
      {([2, 3, 4] as const).map(cols => <div key={cols}>
          <div style={{
        fontSize: 11,
        color: 'var(--color-text-secondary)',
        marginBottom: 6
      }}>columns={cols}</div>
          <Grid columns={cols} gap="sm">
            {Array.from({
          length: cols * 2
        }, (_, i) => <DemoBox key={i}>{i + 1}</DemoBox>)}
          </Grid>
        </div>)}
    </div>
}`,...n.parameters?.docs?.source}}};const p=["Default","Variants"];export{s as Default,n as Variants,p as __namedExportsOrder,x as default};
