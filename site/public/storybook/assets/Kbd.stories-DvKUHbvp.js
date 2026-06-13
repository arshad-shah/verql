import{B as e}from"./iframe-CdY22T7n.js";import{K as l,a as s}from"./KbdGroup-CVThv8mv.js";import"./preload-helper-PPVm8Dsz.js";import"./index-CqE97RaD.js";import"./cn-DDt1maD9.js";import"./createLucideIcon-CIh8D4qA.js";import"./arrow-down-sHqQ2fUb.js";import"./arrow-up-DGQOQQzZ.js";const v={title:"Primitives/Typography/Kbd",component:l,argTypes:{size:{control:"inline-radio",options:["xs","sm","md","lg","xl"]},variant:{control:"inline-radio",options:["solid","outline","ghost"]}}},r=({label:o,children:x})=>e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:16,minWidth:360},children:[e.jsx("span",{style:{width:80,fontSize:12,color:"var(--color-text-tertiary)"},children:o}),e.jsx("div",{style:{display:"flex",alignItems:"center",gap:12},children:x})]}),a={args:{children:"K",size:"md",variant:"solid"}},i={render:()=>e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:12},children:["xs","sm","md","lg","xl"].map(o=>e.jsxs(r,{label:o,children:[e.jsx(l,{size:o,children:"K"}),e.jsx(l,{size:o,children:"Esc"})]},o))})},d={render:()=>e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:12},children:[e.jsx(r,{label:"solid",children:e.jsx(l,{variant:"solid",children:"K"})}),e.jsx(r,{label:"outline",children:e.jsx(l,{variant:"outline",children:"K"})}),e.jsx(r,{label:"ghost",children:e.jsx(l,{variant:"ghost",children:"K"})})]})},t={render:()=>e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:16},children:["solid","outline","ghost"].map(o=>e.jsxs(r,{label:o,children:[e.jsx(l,{size:"sm",variant:o,children:"K"}),e.jsx(l,{size:"md",variant:o,children:"K"}),e.jsx(l,{size:"lg",variant:o,children:"K"})]},o))})},n={render:()=>e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:12},children:[e.jsx(r,{label:"palette",children:e.jsx(s,{keys:["mod","shift","p"]})}),e.jsx(r,{label:"save",children:e.jsx(s,{accelerator:"CmdOrCtrl+S"})}),e.jsx(r,{label:"undo",children:e.jsx(s,{keys:["mod","z"]})}),e.jsx(r,{label:"redo",children:e.jsx(s,{keys:["mod","shift","z"]})}),e.jsx(r,{label:"escape",children:e.jsx(s,{keys:["escape"]})}),e.jsxs(r,{label:"arrows",children:[e.jsx(s,{keys:["up"]}),e.jsx(s,{keys:["down"]}),e.jsx(s,{keys:["left"]}),e.jsx(s,{keys:["right"]})]}),e.jsxs(r,{label:"enter / tab / space",children:[e.jsx(s,{keys:["enter"]}),e.jsx(s,{keys:["tab"]}),e.jsx(s,{keys:["space"]})]})]})},p={render:()=>e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:12},children:[e.jsx(r,{label:"gap",children:e.jsx(s,{keys:["mod","shift","p"],separator:"gap"})}),e.jsx(r,{label:"plus",children:e.jsx(s,{keys:["mod","shift","p"],separator:"plus"})})]})},c={render:()=>e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:12},children:[e.jsx(r,{label:"sm",children:e.jsx(s,{keys:["mod","shift","p"],size:"sm"})}),e.jsx(r,{label:"md",children:e.jsx(s,{keys:["mod","shift","p"],size:"md"})}),e.jsx(r,{label:"lg",children:e.jsx(s,{keys:["mod","shift","p"],size:"lg"})})]})},m={render:()=>e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:12},children:[e.jsx(r,{label:"solid",children:e.jsx(s,{keys:["mod","shift","p"],variant:"solid"})}),e.jsx(r,{label:"outline",children:e.jsx(s,{keys:["mod","shift","p"],variant:"outline"})}),e.jsx(r,{label:"ghost",children:e.jsx(s,{keys:["mod","shift","p"],variant:"ghost"})})]})};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    children: 'K',
    size: 'md',
    variant: 'solid'
  }
}`,...a.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: 12
  }}>
      {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map(size => <Row key={size} label={size}>
          <Kbd size={size}>K</Kbd>
          <Kbd size={size}>Esc</Kbd>
        </Row>)}
    </div>
}`,...i.parameters?.docs?.source}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: 12
  }}>
      <Row label="solid"><Kbd variant="solid">K</Kbd></Row>
      <Row label="outline"><Kbd variant="outline">K</Kbd></Row>
      <Row label="ghost"><Kbd variant="ghost">K</Kbd></Row>
    </div>
}`,...d.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: 16
  }}>
      {(['solid', 'outline', 'ghost'] as const).map(variant => <Row key={variant} label={variant}>
          <Kbd size="sm" variant={variant}>K</Kbd>
          <Kbd size="md" variant={variant}>K</Kbd>
          <Kbd size="lg" variant={variant}>K</Kbd>
        </Row>)}
    </div>
}`,...t.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: 12
  }}>
      <Row label="palette"><KbdGroup keys={['mod', 'shift', 'p']} /></Row>
      <Row label="save"><KbdGroup accelerator="CmdOrCtrl+S" /></Row>
      <Row label="undo"><KbdGroup keys={['mod', 'z']} /></Row>
      <Row label="redo"><KbdGroup keys={['mod', 'shift', 'z']} /></Row>
      <Row label="escape"><KbdGroup keys={['escape']} /></Row>
      <Row label="arrows">
        <KbdGroup keys={['up']} />
        <KbdGroup keys={['down']} />
        <KbdGroup keys={['left']} />
        <KbdGroup keys={['right']} />
      </Row>
      <Row label="enter / tab / space">
        <KbdGroup keys={['enter']} />
        <KbdGroup keys={['tab']} />
        <KbdGroup keys={['space']} />
      </Row>
    </div>
}`,...n.parameters?.docs?.source}}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: 12
  }}>
      <Row label="gap"><KbdGroup keys={['mod', 'shift', 'p']} separator="gap" /></Row>
      <Row label="plus"><KbdGroup keys={['mod', 'shift', 'p']} separator="plus" /></Row>
    </div>
}`,...p.parameters?.docs?.source}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: 12
  }}>
      <Row label="sm"><KbdGroup keys={['mod', 'shift', 'p']} size="sm" /></Row>
      <Row label="md"><KbdGroup keys={['mod', 'shift', 'p']} size="md" /></Row>
      <Row label="lg"><KbdGroup keys={['mod', 'shift', 'p']} size="lg" /></Row>
    </div>
}`,...c.parameters?.docs?.source}}};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: 12
  }}>
      <Row label="solid"><KbdGroup keys={['mod', 'shift', 'p']} variant="solid" /></Row>
      <Row label="outline"><KbdGroup keys={['mod', 'shift', 'p']} variant="outline" /></Row>
      <Row label="ghost"><KbdGroup keys={['mod', 'shift', 'p']} variant="ghost" /></Row>
    </div>
}`,...m.parameters?.docs?.source}}};const w=["Default","Sizes","Variants","Matrix","Groups","GroupSeparators","GroupSizes","GroupVariants"];export{a as Default,p as GroupSeparators,c as GroupSizes,m as GroupVariants,n as Groups,t as Matrix,i as Sizes,d as Variants,w as __namedExportsOrder,v as default};
