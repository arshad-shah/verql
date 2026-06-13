import{B as e}from"./iframe-CdY22T7n.js";import{B as r}from"./BadgeIndicator-BlVGNMQr.js";import"./preload-helper-PPVm8Dsz.js";import"./index-CqE97RaD.js";import"./cn-DDt1maD9.js";const t=({children:n})=>e.jsx("button",{className:"inline-flex items-center justify-center h-9 w-9 rounded-md bg-bg-elevated text-text-primary hover:bg-bg-hover","aria-label":"Notifications",children:n}),a=()=>e.jsxs("svg",{xmlns:"http://www.w3.org/2000/svg",width:"18",height:"18",viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",children:[e.jsx("path",{d:"M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"}),e.jsx("path",{d:"M10.3 21a1.94 1.94 0 0 0 3.4 0"})]}),h={title:"Primitives/Data Display/BadgeIndicator",component:r,argTypes:{variant:{control:"select",options:["dot","number"]},side:{control:"select",options:["top-right","top-left","bottom-right","bottom-left"]},count:{control:"number"},max:{control:"number"},hidden:{control:"boolean"}}},o={args:{variant:"dot",children:null},render:n=>e.jsx(r,{...n,children:e.jsx(t,{children:e.jsx(a,{})})})},s={args:{variant:"number",count:5},render:n=>e.jsx(r,{...n,children:e.jsx(t,{children:e.jsx(a,{})})})},c={name:"Number exceeding max",args:{variant:"number",count:150,max:99},render:n=>e.jsx(r,{...n,children:e.jsx(t,{children:e.jsx(a,{})})})},d={args:{variant:"dot",hidden:!0},render:n=>e.jsx(r,{...n,children:e.jsx(t,{children:e.jsx(a,{})})})},i={name:"Zero count hides indicator",args:{variant:"number",count:0},render:n=>e.jsx(r,{...n,children:e.jsx(t,{children:e.jsx(a,{})})})},l={name:"On avatar",args:{variant:"dot"},render:n=>e.jsx(r,{...n,children:e.jsx("span",{className:"inline-flex items-center justify-center h-10 w-10 rounded-full bg-accent/10 text-accent font-medium text-sm",children:"AS"})})},m={name:"All four corners",render:()=>e.jsx("div",{style:{display:"flex",gap:24,alignItems:"center"},children:["top-right","top-left","bottom-right","bottom-left"].map(n=>e.jsx(r,{variant:"number",count:3,side:n,children:e.jsx(t,{children:e.jsx(a,{})})},n))})},u={render:()=>e.jsxs("div",{style:{display:"flex",gap:24,alignItems:"center"},children:[e.jsx(r,{variant:"dot",children:e.jsx(t,{children:e.jsx(a,{})})}),e.jsx(r,{variant:"number",count:3,children:e.jsx(t,{children:e.jsx(a,{})})}),e.jsx(r,{variant:"number",count:150,max:99,children:e.jsx(t,{children:e.jsx(a,{})})})]})};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'dot',
    children: null as unknown as ReactNode
  },
  render: args => <BadgeIndicator {...args}>
      <IconButton>
        <BellIcon />
      </IconButton>
    </BadgeIndicator>
}`,...o.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'number',
    count: 5
  },
  render: args => <BadgeIndicator {...args}>
      <IconButton>
        <BellIcon />
      </IconButton>
    </BadgeIndicator>
}`,...s.parameters?.docs?.source}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  name: 'Number exceeding max',
  args: {
    variant: 'number',
    count: 150,
    max: 99
  },
  render: args => <BadgeIndicator {...args}>
      <IconButton>
        <BellIcon />
      </IconButton>
    </BadgeIndicator>
}`,...c.parameters?.docs?.source}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'dot',
    hidden: true
  },
  render: args => <BadgeIndicator {...args}>
      <IconButton>
        <BellIcon />
      </IconButton>
    </BadgeIndicator>
}`,...d.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  name: 'Zero count hides indicator',
  args: {
    variant: 'number',
    count: 0
  },
  render: args => <BadgeIndicator {...args}>
      <IconButton>
        <BellIcon />
      </IconButton>
    </BadgeIndicator>
}`,...i.parameters?.docs?.source}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  name: 'On avatar',
  args: {
    variant: 'dot'
  },
  render: args => <BadgeIndicator {...args}>
      <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-accent/10 text-accent font-medium text-sm">
        AS
      </span>
    </BadgeIndicator>
}`,...l.parameters?.docs?.source}}};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  name: 'All four corners',
  render: () => <div style={{
    display: 'flex',
    gap: 24,
    alignItems: 'center'
  }}>
      {(['top-right', 'top-left', 'bottom-right', 'bottom-left'] as const).map(side => <BadgeIndicator key={side} variant="number" count={3} side={side}>
          <IconButton>
            <BellIcon />
          </IconButton>
        </BadgeIndicator>)}
    </div>
}`,...m.parameters?.docs?.source}}};u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    gap: 24,
    alignItems: 'center'
  }}>
      <BadgeIndicator variant="dot">
        <IconButton>
          <BellIcon />
        </IconButton>
      </BadgeIndicator>
      <BadgeIndicator variant="number" count={3}>
        <IconButton>
          <BellIcon />
        </IconButton>
      </BadgeIndicator>
      <BadgeIndicator variant="number" count={150} max={99}>
        <IconButton>
          <BellIcon />
        </IconButton>
      </BadgeIndicator>
    </div>
}`,...u.parameters?.docs?.source}}};const j=["Dot","Number","OverMax","Hidden","ZeroCount","OnAvatar","Sides","Variants"];export{o as Dot,d as Hidden,s as Number,l as OnAvatar,c as OverMax,m as Sides,u as Variants,i as ZeroCount,j as __namedExportsOrder,h as default};
