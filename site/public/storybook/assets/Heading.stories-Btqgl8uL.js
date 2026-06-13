import{B as n}from"./iframe-CdY22T7n.js";import{H as o}from"./Heading-BkWmjzHt.js";import"./preload-helper-PPVm8Dsz.js";import"./cn-DDt1maD9.js";const c={title:"Primitives/Typography/Heading",component:o,argTypes:{level:{control:"select",options:[1,2,3,4,5,6]}}},e={args:{level:2,children:"The quick brown fox jumps over the lazy dog"}},r={render:()=>n.jsx("div",{style:{display:"flex",flexDirection:"column",gap:12},children:[1,2,3,4,5,6].map(a=>n.jsxs(o,{level:a,children:["Heading level ",a]},a))})};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  args: {
    level: 2,
    children: 'The quick brown fox jumps over the lazy dog'
  }
}`,...e.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: 12
  }}>
      {([1, 2, 3, 4, 5, 6] as const).map(level => <Heading key={level} level={level}>
          Heading level {level}
        </Heading>)}
    </div>
}`,...r.parameters?.docs?.source}}};const d=["Default","Variants"];export{e as Default,r as Variants,d as __namedExportsOrder,c as default};
