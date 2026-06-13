import{B as e}from"./iframe-CdY22T7n.js";import{T as i}from"./Tooltip-DFQSTWFy.js";import{B as n}from"./Button-DVlKTRa-.js";import"./preload-helper-PPVm8Dsz.js";import"./floating-ui.react-BTPmBFa-.js";import"./index-kMnmcFYy.js";import"./index-Cf8GF5kW.js";import"./index-CqE97RaD.js";import"./cn-DDt1maD9.js";const v={title:"Primitives/Surfaces/Tooltip",component:i,argTypes:{side:{control:"select",options:["top","bottom","left","right"]},size:{control:"select",options:["sm","md","lg"]},content:{control:"text"}}},o={args:{content:"This is a tooltip",side:"top",children:e.jsx(n,{variant:"outline",children:"Hover me"})}},s={args:{content:"",children:null},render:()=>e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(2, 1fr)",gap:24,padding:40},children:["top","bottom","left","right"].map(t=>e.jsx(i,{content:`Tooltip on ${t}`,side:t,children:e.jsxs(n,{variant:"outline",style:{width:"100%"},children:['side="',t,'"']})},t))})},r={args:{content:"",children:null},render:()=>e.jsx("div",{style:{display:"flex",gap:24,padding:40},children:["sm","md","lg"].map(t=>e.jsx(i,{content:`size="${t}"`,side:"bottom",size:t,children:e.jsxs(n,{variant:"outline",children:['size="',t,'"']})},t))})};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    content: 'This is a tooltip',
    side: 'top',
    children: <Button variant="outline">Hover me</Button>
  }
}`,...o.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    content: '',
    children: null as any
  },
  render: () => <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 24,
    padding: 40
  }}>
      {(['top', 'bottom', 'left', 'right'] as const).map(side => <Tooltip key={side} content={\`Tooltip on \${side}\`} side={side}>
          <Button variant="outline" style={{
        width: '100%'
      }}>side="{side}"</Button>
        </Tooltip>)}
    </div>
}`,...s.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    content: '',
    children: null as any
  },
  render: () => <div style={{
    display: 'flex',
    gap: 24,
    padding: 40
  }}>
      {(['sm', 'md', 'lg'] as const).map(size => <Tooltip key={size} content={\`size="\${size}"\`} side="bottom" size={size}>
          <Button variant="outline">size="{size}"</Button>
        </Tooltip>)}
    </div>
}`,...r.parameters?.docs?.source}}};const y=["Default","Variants","Sizes"];export{o as Default,r as Sizes,s as Variants,y as __namedExportsOrder,v as default};
