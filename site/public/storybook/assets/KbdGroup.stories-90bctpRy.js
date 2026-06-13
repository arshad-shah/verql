import{B as e}from"./iframe-CdY22T7n.js";import{a as s}from"./KbdGroup-CVThv8mv.js";import"./preload-helper-PPVm8Dsz.js";import"./index-CqE97RaD.js";import"./cn-DDt1maD9.js";import"./createLucideIcon-CIh8D4qA.js";import"./arrow-down-sHqQ2fUb.js";import"./arrow-up-DGQOQQzZ.js";const b={title:"Primitives/Typography/KbdGroup",component:s,argTypes:{size:{control:"inline-radio",options:["sm","md","lg"]},variant:{control:"inline-radio",options:["solid","outline","ghost"]},separator:{control:"inline-radio",options:["gap","plus"]},accelerator:{control:"text"}}},a=({label:r,children:d})=>e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:16,minWidth:320},children:[e.jsx("span",{style:{width:96,fontSize:12,color:"var(--color-text-tertiary)"},children:r}),d]}),t={args:{keys:["mod","K"],size:"md",variant:"solid",separator:"gap"}},l={name:"From accelerator string",args:{accelerator:"CmdOrCtrl+Shift+P"}},i={render:()=>e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:12},children:[e.jsx(a,{label:"gap",children:e.jsx(s,{keys:["mod","shift","P"],separator:"gap"})}),e.jsx(a,{label:"plus",children:e.jsx(s,{keys:["mod","shift","P"],separator:"plus"})})]})},n={render:()=>e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:12},children:["sm","md","lg"].map(r=>e.jsx(a,{label:r,children:e.jsx(s,{keys:["mod","enter"],size:r})},r))})},c={render:()=>e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:12},children:["solid","outline","ghost"].map(r=>e.jsx(a,{label:r,children:e.jsx(s,{keys:["ctrl","alt","delete"],variant:r})},r))})},o={render:()=>e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:12},children:[e.jsx(a,{label:"arrows",children:e.jsx(s,{keys:["up","down","left","right"]})}),e.jsx(a,{label:"whitespace",children:e.jsx(s,{keys:["tab","space","enter"]})}),e.jsx(a,{label:"editing",children:e.jsx(s,{keys:["escape","backspace"]})}),e.jsx(a,{label:"modifiers",children:e.jsx(s,{keys:["cmd","ctrl","shift","alt"]})})]})};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    keys: ['mod', 'K'],
    size: 'md',
    variant: 'solid',
    separator: 'gap'
  }
}`,...t.parameters?.docs?.source}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  name: 'From accelerator string',
  args: {
    accelerator: 'CmdOrCtrl+Shift+P'
  }
}`,...l.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: 12
  }}>
      <Row label="gap">
        <KbdGroup keys={['mod', 'shift', 'P']} separator="gap" />
      </Row>
      <Row label="plus">
        <KbdGroup keys={['mod', 'shift', 'P']} separator="plus" />
      </Row>
    </div>
}`,...i.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: 12
  }}>
      {(['sm', 'md', 'lg'] as const).map(size => <Row key={size} label={size}>
          <KbdGroup keys={['mod', 'enter']} size={size} />
        </Row>)}
    </div>
}`,...n.parameters?.docs?.source}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: 12
  }}>
      {(['solid', 'outline', 'ghost'] as const).map(variant => <Row key={variant} label={variant}>
          <KbdGroup keys={['ctrl', 'alt', 'delete']} variant={variant} />
        </Row>)}
    </div>
}`,...c.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: 12
  }}>
      <Row label="arrows"><KbdGroup keys={['up', 'down', 'left', 'right']} /></Row>
      <Row label="whitespace"><KbdGroup keys={['tab', 'space', 'enter']} /></Row>
      <Row label="editing"><KbdGroup keys={['escape', 'backspace']} /></Row>
      <Row label="modifiers"><KbdGroup keys={['cmd', 'ctrl', 'shift', 'alt']} /></Row>
    </div>
}`,...o.parameters?.docs?.source},description:{story:"Special tokens render as glyphs (arrows, tab, space, escape, modifiers).",...o.parameters?.docs?.description}}};const w=["Default","FromAccelerator","Separators","Sizes","Variants","SpecialKeys"];export{t as Default,l as FromAccelerator,i as Separators,n as Sizes,o as SpecialKeys,c as Variants,w as __namedExportsOrder,b as default};
