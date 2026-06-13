import{B as e}from"./iframe-CdY22T7n.js";import{A as i}from"./AspectRatio-PTPAY6Hu.js";import"./preload-helper-PPVm8Dsz.js";import"./cn-DDt1maD9.js";const l={title:"Primitives/Layout/AspectRatio",component:i,argTypes:{ratio:{control:"select",options:["square","video","4/3"]}}},r={args:{ratio:"video",style:{width:320,background:"var(--color-bg-tertiary)",borderRadius:8},children:e.jsx("div",{style:{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",fontSize:12,color:"var(--color-text-secondary)"},children:"16 / 9 video"})}},o={render:()=>e.jsx("div",{style:{display:"flex",gap:16,alignItems:"flex-start"},children:["square","video","4/3"].map(t=>e.jsxs("div",{style:{width:160},children:[e.jsxs("div",{style:{fontSize:11,color:"var(--color-text-secondary)",marginBottom:4},children:['ratio="',t,'"']}),e.jsx(i,{ratio:t,style:{background:"var(--color-bg-tertiary)",borderRadius:6},children:e.jsx("div",{style:{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",fontSize:11,color:"var(--color-text-muted)"},children:t})})]},t))})};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    ratio: 'video',
    style: {
      width: 320,
      background: 'var(--color-bg-tertiary)',
      borderRadius: 8
    },
    children: <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      fontSize: 12,
      color: 'var(--color-text-secondary)'
    }}>
        16 / 9 video
      </div>
  }
}`,...r.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    gap: 16,
    alignItems: 'flex-start'
  }}>
      {(['square', 'video', '4/3'] as const).map(ratio => <div key={ratio} style={{
      width: 160
    }}>
          <div style={{
        fontSize: 11,
        color: 'var(--color-text-secondary)',
        marginBottom: 4
      }}>ratio="{ratio}"</div>
          <AspectRatio ratio={ratio} style={{
        background: 'var(--color-bg-tertiary)',
        borderRadius: 6
      }}>
            <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          fontSize: 11,
          color: 'var(--color-text-muted)'
        }}>
              {ratio}
            </div>
          </AspectRatio>
        </div>)}
    </div>
}`,...o.parameters?.docs?.source}}};const c=["Default","Variants"];export{r as Default,o as Variants,c as __namedExportsOrder,l as default};
