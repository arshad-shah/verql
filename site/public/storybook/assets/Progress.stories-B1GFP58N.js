import{B as r}from"./iframe-CdY22T7n.js";import{P as n}from"./Progress-BZJHEeVB.js";import"./preload-helper-PPVm8Dsz.js";import"./index-CqE97RaD.js";import"./cn-DDt1maD9.js";const m={title:"Primitives/Feedback/Progress",component:n,argTypes:{value:{control:{type:"range",min:0,max:100,step:1}},max:{control:"number"},size:{control:"inline-radio",options:["sm","md","lg"]}}},s={args:{value:60,max:100,"aria-label":"Upload progress"},decorators:[e=>r.jsx("div",{style:{width:320},children:r.jsx(e,{})})]},o={render:()=>r.jsx("div",{style:{width:320,display:"flex",flexDirection:"column",gap:12},children:[0,25,50,75,100].map(e=>r.jsxs("div",{children:[r.jsxs("div",{style:{fontSize:11,color:"var(--color-text-secondary)",marginBottom:4},children:[e,"%"]}),r.jsx(n,{value:e,"aria-label":`Progress ${e}%`})]},e))})},a={render:()=>r.jsx("div",{style:{width:320,display:"flex",flexDirection:"column",gap:12},children:["sm","md","lg"].map(e=>r.jsxs("div",{children:[r.jsx("div",{style:{fontSize:11,color:"var(--color-text-secondary)",marginBottom:4},children:e}),r.jsx(n,{value:60,size:e,"aria-label":`Progress ${e}`})]},e))})};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    value: 60,
    max: 100,
    'aria-label': 'Upload progress'
  },
  decorators: [Story => <div style={{
    width: 320
  }}><Story /></div>]
}`,...s.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    width: 320,
    display: 'flex',
    flexDirection: 'column',
    gap: 12
  }}>
      {[0, 25, 50, 75, 100].map(value => <div key={value}>
          <div style={{
        fontSize: 11,
        color: 'var(--color-text-secondary)',
        marginBottom: 4
      }}>{value}%</div>
          <Progress value={value} aria-label={\`Progress \${value}%\`} />
        </div>)}
    </div>
}`,...o.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    width: 320,
    display: 'flex',
    flexDirection: 'column',
    gap: 12
  }}>
      {(['sm', 'md', 'lg'] as const).map(size => <div key={size}>
          <div style={{
        fontSize: 11,
        color: 'var(--color-text-secondary)',
        marginBottom: 4
      }}>{size}</div>
          <Progress value={60} size={size} aria-label={\`Progress \${size}\`} />
        </div>)}
    </div>
}`,...a.parameters?.docs?.source}}};const p=["Default","States","Sizes"];export{s as Default,a as Sizes,o as States,p as __namedExportsOrder,m as default};
