import{B as r}from"./iframe-CdY22T7n.js";import{S as a}from"./ScrollArea-DsVAjX50.js";import"./preload-helper-PPVm8Dsz.js";import"./cn-DDt1maD9.js";const p={title:"Primitives/Layout/ScrollArea",component:a,argTypes:{direction:{control:"select",options:["vertical","horizontal","both"]}}},o={args:{direction:"vertical",style:{height:150,width:300,border:"1px solid var(--color-border-default)",borderRadius:6}},render:t=>r.jsx(a,{...t,"aria-label":"Scrollable rows",children:Array.from({length:20},(l,i)=>r.jsxs("div",{style:{padding:"6px 12px",fontSize:12,color:"var(--color-text-primary)",borderBottom:"1px solid var(--color-border-subtle)"},children:["Row ",i+1," — scrollable content"]},i))})},e={render:()=>r.jsx(a,{direction:"horizontal","aria-label":"Scrollable items",style:{width:300,border:"1px solid var(--color-border-default)",borderRadius:6},children:r.jsx("div",{style:{display:"flex",gap:8,padding:12,width:"max-content"},children:Array.from({length:15},(t,l)=>r.jsxs("div",{style:{flexShrink:0,padding:"6px 12px",background:"var(--color-bg-tertiary)",borderRadius:4,fontSize:12,color:"var(--color-text-primary)"},children:["Item ",l+1]},l))})})};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    direction: 'vertical',
    style: {
      height: 150,
      width: 300,
      border: '1px solid var(--color-border-default)',
      borderRadius: 6
    }
  },
  render: args => <ScrollArea {...args} aria-label="Scrollable rows">
      {Array.from({
      length: 20
    }, (_, i) => <div key={i} style={{
      padding: '6px 12px',
      fontSize: 12,
      color: 'var(--color-text-primary)',
      borderBottom: '1px solid var(--color-border-subtle)'
    }}>
          Row {i + 1} — scrollable content
        </div>)}
    </ScrollArea>
}`,...o.parameters?.docs?.source}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  render: () => <ScrollArea direction="horizontal" aria-label="Scrollable items" style={{
    width: 300,
    border: '1px solid var(--color-border-default)',
    borderRadius: 6
  }}>
      <div style={{
      display: 'flex',
      gap: 8,
      padding: 12,
      width: 'max-content'
    }}>
        {Array.from({
        length: 15
      }, (_, i) => <div key={i} style={{
        flexShrink: 0,
        padding: '6px 12px',
        background: 'var(--color-bg-tertiary)',
        borderRadius: 4,
        fontSize: 12,
        color: 'var(--color-text-primary)'
      }}>
            Item {i + 1}
          </div>)}
      </div>
    </ScrollArea>
}`,...e.parameters?.docs?.source}}};const b=["Default","HorizontalScroll"];export{o as Default,e as HorizontalScroll,b as __namedExportsOrder,p as default};
