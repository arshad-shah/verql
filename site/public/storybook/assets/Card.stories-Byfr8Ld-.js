import{B as r}from"./iframe-CdY22T7n.js";import{C as n}from"./Card-UMTkYlih.js";import"./preload-helper-PPVm8Dsz.js";import"./index-CqE97RaD.js";import"./cn-DDt1maD9.js";const c={title:"Primitives/Surfaces/Card",component:n,argTypes:{padding:{control:"select",options:["none","sm","md","lg","xl"]}}},e={args:{padding:"md",children:r.jsxs("div",{style:{color:"var(--color-text-primary)",fontSize:13},children:[r.jsx("div",{style:{fontWeight:600,marginBottom:4},children:"Card title"}),r.jsx("div",{style:{color:"var(--color-text-secondary)"},children:"Some card body content goes here."})]}),style:{width:280}}},o={render:()=>r.jsx("div",{style:{display:"flex",flexDirection:"column",gap:12,width:280},children:["none","sm","md","lg","xl"].map(t=>r.jsx(n,{padding:t,children:r.jsxs("div",{style:{color:"var(--color-text-primary)",fontSize:12},children:['padding="',t,'"']})},t))})};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  args: {
    padding: 'md',
    children: <div style={{
      color: 'var(--color-text-primary)',
      fontSize: 13
    }}>
        <div style={{
        fontWeight: 600,
        marginBottom: 4
      }}>Card title</div>
        <div style={{
        color: 'var(--color-text-secondary)'
      }}>Some card body content goes here.</div>
      </div>,
    style: {
      width: 280
    }
  }
}`,...e.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    width: 280
  }}>
      {(['none', 'sm', 'md', 'lg', 'xl'] as const).map(padding => <Card key={padding} padding={padding}>
          <div style={{
        color: 'var(--color-text-primary)',
        fontSize: 12
      }}>padding="{padding}"</div>
        </Card>)}
    </div>
}`,...o.parameters?.docs?.source}}};const m=["Default","Variants"];export{e as Default,o as Variants,m as __namedExportsOrder,c as default};
