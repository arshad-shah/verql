import{B as a}from"./iframe-CdY22T7n.js";import{S as n}from"./Spinner-BZmpou-y.js";import"./preload-helper-PPVm8Dsz.js";import"./index-CqE97RaD.js";import"./cn-DDt1maD9.js";const p={title:"Primitives/Feedback/Spinner",component:n,argTypes:{size:{control:"select",options:["xs","sm","md","lg","xl"]},label:{control:"text"}}},e={args:{size:"md",label:"Loading"}},s={render:()=>a.jsx("div",{style:{display:"flex",gap:16,alignItems:"center"},children:["xs","sm","md","lg","xl"].map(r=>a.jsx(n,{size:r,label:`${r} spinner`},r))})};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  args: {
    size: 'md',
    label: 'Loading'
  }
}`,...e.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    gap: 16,
    alignItems: 'center'
  }}>
      {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map(size => <Spinner key={size} size={size} label={\`\${size} spinner\`} />)}
    </div>
}`,...s.parameters?.docs?.source}}};const c=["Default","Variants"];export{e as Default,s as Variants,c as __namedExportsOrder,p as default};
