import{B as a}from"./iframe-CdY22T7n.js";import{L as l}from"./Label-gu33wJKO.js";import"./preload-helper-PPVm8Dsz.js";import"./index-CqE97RaD.js";import"./cn-DDt1maD9.js";const{expect:t}=__STORYBOOK_MODULE_TEST__,x={title:"Primitives/Forms/Label",component:l},s={args:{children:"Database host"},play:async({canvas:e})=>{const o=e.getByText("Database host");await t(o).toBeInTheDocument(),await t(o.tagName.toLowerCase()).toBe("label")}},r={render:()=>a.jsx("div",{style:{display:"flex",flexDirection:"column",gap:12},children:["sm","md","lg"].map(e=>a.jsx(l,{size:e,children:`Label size="${e}"`},e))}),play:async({canvas:e})=>{await t(e.getByText('Label size="md"')).toBeInTheDocument()}},i={render:()=>a.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:16},children:[a.jsx("div",{children:a.jsx(l,{children:"Default label"})}),a.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:4},children:[a.jsx(l,{htmlFor:"host-input",children:"Database host"}),a.jsx("input",{id:"host-input",type:"text",placeholder:"localhost",style:{padding:"4px 8px",borderRadius:4,border:"1px solid var(--color-border-default)",background:"var(--color-bg-primary)",color:"var(--color-text-primary)",fontSize:13}})]}),a.jsx("div",{children:a.jsx(l,{className:"text-xs uppercase tracking-widest opacity-60",children:"Section header label"})})]}),play:async({canvas:e})=>{const o=e.getByText("Default label");await t(o).toBeInTheDocument();const c=e.getByText("Database host");await t(c).toHaveAttribute("for","host-input");const n=e.getByText("Section header label");await t(n).toBeInTheDocument()}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    children: 'Database host'
  },
  play: async ({
    canvas
  }) => {
    const label = canvas.getByText('Database host');
    await expect(label).toBeInTheDocument();
    await expect(label.tagName.toLowerCase()).toBe('label');
  }
}`,...s.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: 12
  }}>
      {(['sm', 'md', 'lg'] as const).map(size => <Label key={size} size={size}>
          {\`Label size="\${size}"\`}
        </Label>)}
    </div>,
  play: async ({
    canvas
  }) => {
    await expect(canvas.getByText('Label size="md"')).toBeInTheDocument();
  }
}`,...r.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: 16
  }}>
      {/* Default label */}
      <div>
        <Label>Default label</Label>
      </div>

      {/* Label linked to an input via htmlFor */}
      <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 4
    }}>
        <Label htmlFor="host-input">Database host</Label>
        <input id="host-input" type="text" placeholder="localhost" style={{
        padding: '4px 8px',
        borderRadius: 4,
        border: '1px solid var(--color-border-default)',
        background: 'var(--color-bg-primary)',
        color: 'var(--color-text-primary)',
        fontSize: 13
      }} />
      </div>

      {/* Label with custom className override */}
      <div>
        <Label className="text-xs uppercase tracking-widest opacity-60">
          Section header label
        </Label>
      </div>
    </div>,
  play: async ({
    canvas
  }) => {
    const defaultLabel = canvas.getByText('Default label');
    await expect(defaultLabel).toBeInTheDocument();
    const linkedLabel = canvas.getByText('Database host');
    await expect(linkedLabel).toHaveAttribute('for', 'host-input');
    const customLabel = canvas.getByText('Section header label');
    await expect(customLabel).toBeInTheDocument();
  }
}`,...i.parameters?.docs?.source}}};const h=["Default","Sizes","States"];export{s as Default,r as Sizes,i as States,h as __namedExportsOrder,x as default};
