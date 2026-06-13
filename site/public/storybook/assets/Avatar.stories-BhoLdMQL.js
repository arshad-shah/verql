import{B as e}from"./iframe-CdY22T7n.js";import{A as t}from"./Avatar-BtYeYK_B.js";import"./preload-helper-PPVm8Dsz.js";import"./index-CqE97RaD.js";import"./cn-DDt1maD9.js";const d={title:"Primitives/Data Display/Avatar",component:t,argTypes:{size:{control:"select",options:["xs","sm","md","lg","xl"]},name:{control:"text"}}},a={args:{name:"John Doe",size:"md"}},r={render:()=>e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:16},children:[e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:11,color:"var(--color-text-secondary)",marginBottom:6},children:"Sizes"}),e.jsx("div",{style:{display:"flex",gap:12,alignItems:"center"},children:["xs","sm","md","lg","xl"].map(s=>e.jsx(t,{name:"John Doe",size:s},s))})]}),e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:11,color:"var(--color-text-secondary)",marginBottom:6},children:"Initials"}),e.jsx("div",{style:{display:"flex",gap:8},children:["Alice Brown","Bob Smith","Charlie D","E","First Last Name"].map(s=>e.jsx(t,{name:s},s))})]})]})};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    name: 'John Doe',
    size: 'md'
  }
}`,...a.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: 16
  }}>
      <div>
        <div style={{
        fontSize: 11,
        color: 'var(--color-text-secondary)',
        marginBottom: 6
      }}>Sizes</div>
        <div style={{
        display: 'flex',
        gap: 12,
        alignItems: 'center'
      }}>
          {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map(size => <Avatar key={size} name="John Doe" size={size} />)}
        </div>
      </div>
      <div>
        <div style={{
        fontSize: 11,
        color: 'var(--color-text-secondary)',
        marginBottom: 6
      }}>Initials</div>
        <div style={{
        display: 'flex',
        gap: 8
      }}>
          {['Alice Brown', 'Bob Smith', 'Charlie D', 'E', 'First Last Name'].map(name => <Avatar key={name} name={name} />)}
        </div>
      </div>
    </div>
}`,...r.parameters?.docs?.source}}};const c=["Default","Variants"];export{a as Default,r as Variants,c as __namedExportsOrder,d as default};
