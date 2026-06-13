import{B as e}from"./iframe-CdY22T7n.js";import{T as i}from"./Text-u8VLJp0e.js";import"./preload-helper-PPVm8Dsz.js";import"./index-CqE97RaD.js";import"./cn-DDt1maD9.js";const d={title:"Primitives/Typography/Text",component:i,argTypes:{size:{control:"select",options:["xs","sm","base","lg","xl"]},color:{control:"select",options:["primary","secondary","muted","disabled","accent","success","warning","error"]},weight:{control:"select",options:["normal","medium","semibold","bold"]},truncate:{control:"boolean"}}},r={args:{size:"sm",color:"primary",weight:"normal",children:"The quick brown fox jumps over the lazy dog"}},s={render:()=>e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:24},children:[e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:11,color:"var(--color-text-secondary)",marginBottom:6},children:"Sizes"}),e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:8},children:["xs","sm","base","lg","xl"].map(o=>e.jsxs(i,{size:o,children:['size="',o,'" — The quick brown fox']},o))})]}),e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:11,color:"var(--color-text-secondary)",marginBottom:6},children:"Colors"}),e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:8},children:["primary","secondary","muted","disabled","accent","success","warning","error"].map(o=>e.jsxs(i,{color:o,children:['color="',o,'" — The quick brown fox']},o))})]})]})};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    size: 'sm',
    color: 'primary',
    weight: 'normal',
    children: 'The quick brown fox jumps over the lazy dog'
  }
}`,...r.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: 24
  }}>
      <div>
        <div style={{
        fontSize: 11,
        color: 'var(--color-text-secondary)',
        marginBottom: 6
      }}>Sizes</div>
        <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8
      }}>
          {(['xs', 'sm', 'base', 'lg', 'xl'] as const).map(size => <Text key={size} size={size}>
              size="{size}" — The quick brown fox
            </Text>)}
        </div>
      </div>
      <div>
        <div style={{
        fontSize: 11,
        color: 'var(--color-text-secondary)',
        marginBottom: 6
      }}>Colors</div>
        <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8
      }}>
          {(['primary', 'secondary', 'muted', 'disabled', 'accent', 'success', 'warning', 'error'] as const).map(color => <Text key={color} color={color}>
              color="{color}" — The quick brown fox
            </Text>)}
        </div>
      </div>
    </div>
}`,...s.parameters?.docs?.source}}};const m=["Default","Variants"];export{r as Default,s as Variants,m as __namedExportsOrder,d as default};
