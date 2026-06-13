import{J as c,B as r}from"./iframe-CdY22T7n.js";import{R as s}from"./ResizeHandle-BA8IuddH.js";import"./preload-helper-PPVm8Dsz.js";import"./cn-DDt1maD9.js";const{fn:d,expect:h,userEvent:i}=__STORYBOOK_MODULE_TEST__,v={title:"Primitives/Utilities/ResizeHandle",component:s,argTypes:{direction:{control:"select",options:["horizontal","vertical"]}},args:{onResize:d(),onDoubleClick:d()}},o={args:{direction:"horizontal"},render:()=>{const[t,e]=c.useState(200);return r.jsxs("div",{style:{display:"flex",height:200,width:480,border:"1px solid var(--color-border-default)",borderRadius:8,overflow:"hidden"},children:[r.jsxs("div",{style:{width:t,flexShrink:0,background:"var(--color-bg-secondary)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"var(--color-text-secondary)"},children:[t,"px"]}),r.jsx(s,{direction:"horizontal",onResize:n=>e(l=>Math.max(80,Math.min(360,l+n))),onDoubleClick:()=>e(200)}),r.jsx("div",{style:{flex:1,background:"var(--color-bg-tertiary)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"var(--color-text-secondary)"},children:"Drag handle or double-click to reset"})]})},play:async({canvas:t})=>{const e=t.getByRole("separator");await h(e).toBeInTheDocument(),e.focus(),await i.keyboard("{ArrowRight}"),await i.keyboard("{ArrowLeft}")}},a={args:{direction:"vertical"},render:()=>{const[t,e]=c.useState(100);return r.jsxs("div",{style:{display:"flex",flexDirection:"column",height:300,width:360,border:"1px solid var(--color-border-default)",borderRadius:8,overflow:"hidden"},children:[r.jsxs("div",{style:{height:t,flexShrink:0,background:"var(--color-bg-secondary)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"var(--color-text-secondary)"},children:[t,"px"]}),r.jsx(s,{direction:"vertical",onResize:n=>e(l=>Math.max(40,Math.min(240,l+n))),onDoubleClick:()=>e(100)}),r.jsx("div",{style:{flex:1,background:"var(--color-bg-tertiary)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"var(--color-text-secondary)"},children:"Drag handle or double-click to reset"})]})},play:async({canvas:t})=>{const e=t.getByRole("separator");await h(e).toBeInTheDocument(),e.focus(),await i.keyboard("{ArrowDown}"),await i.keyboard("{ArrowUp}")}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    direction: 'horizontal' as const
  },
  render: () => {
    const [leftWidth, setLeftWidth] = useState(200);
    return <div style={{
      display: 'flex',
      height: 200,
      width: 480,
      border: '1px solid var(--color-border-default)',
      borderRadius: 8,
      overflow: 'hidden'
    }}>
        <div style={{
        width: leftWidth,
        flexShrink: 0,
        background: 'var(--color-bg-secondary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12,
        color: 'var(--color-text-secondary)'
      }}>
          {leftWidth}px
        </div>
        <ResizeHandle direction="horizontal" onResize={delta => setLeftWidth(w => Math.max(80, Math.min(360, w + delta)))} onDoubleClick={() => setLeftWidth(200)} />
        <div style={{
        flex: 1,
        background: 'var(--color-bg-tertiary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12,
        color: 'var(--color-text-secondary)'
      }}>
          Drag handle or double-click to reset
        </div>
      </div>;
  },
  play: async ({
    canvas
  }) => {
    const handle = canvas.getByRole('separator');
    await expect(handle).toBeInTheDocument();
    // Keyboard resize: ArrowRight moves the handle
    handle.focus();
    await userEvent.keyboard('{ArrowRight}');
    await userEvent.keyboard('{ArrowLeft}');
  }
}`,...o.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    direction: 'vertical' as const
  },
  render: () => {
    const [topHeight, setTopHeight] = useState(100);
    return <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: 300,
      width: 360,
      border: '1px solid var(--color-border-default)',
      borderRadius: 8,
      overflow: 'hidden'
    }}>
        <div style={{
        height: topHeight,
        flexShrink: 0,
        background: 'var(--color-bg-secondary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12,
        color: 'var(--color-text-secondary)'
      }}>
          {topHeight}px
        </div>
        <ResizeHandle direction="vertical" onResize={delta => setTopHeight(h => Math.max(40, Math.min(240, h + delta)))} onDoubleClick={() => setTopHeight(100)} />
        <div style={{
        flex: 1,
        background: 'var(--color-bg-tertiary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12,
        color: 'var(--color-text-secondary)'
      }}>
          Drag handle or double-click to reset
        </div>
      </div>;
  },
  play: async ({
    canvas
  }) => {
    const handle = canvas.getByRole('separator');
    await expect(handle).toBeInTheDocument();
    handle.focus();
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{ArrowUp}');
  }
}`,...a.parameters?.docs?.source}}};const x=["Default","Vertical"];export{o as Default,a as Vertical,x as __namedExportsOrder,v as default};
