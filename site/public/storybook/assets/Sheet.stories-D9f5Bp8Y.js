import{J as c,B as e}from"./iframe-CdY22T7n.js";import{S as d}from"./Sheet-Bui5TeLS.js";import{B as r}from"./Button-DVlKTRa-.js";import"./preload-helper-PPVm8Dsz.js";import"./index-CqE97RaD.js";import"./cn-DDt1maD9.js";const{expect:p,userEvent:m,fn:h}=__STORYBOOK_MODULE_TEST__,x={title:"Primitives/Surfaces/Sheet",component:d},i={args:{open:!1,onClose:h()},render:()=>{const[t,s]=c.useState(!1),[o,a]=c.useState("right");return e.jsxs("div",{style:{display:"flex",gap:8},children:[["right","left","bottom"].map(l=>e.jsxs(r,{variant:"outline",onClick:()=>{a(l),s(!0)},children:["Open ",l]},l)),e.jsx(d,{open:t,onClose:()=>s(!1),side:o,children:e.jsxs("div",{style:{padding:24,color:"var(--color-text-primary)"},children:[e.jsxs("div",{style:{fontSize:15,fontWeight:600,marginBottom:8},children:["Sheet — ",o]}),e.jsxs("div",{style:{fontSize:13,color:"var(--color-text-secondary)",marginBottom:16},children:["Slide-in panel from the ",o," edge."]}),e.jsx(r,{variant:"ghost",onClick:()=>s(!1),children:"Close"})]})})]})},play:async({canvas:t})=>{const s=t.getByRole("button",{name:"Open right"});await m.click(s);const o=t.getByText("Sheet — right");await p(o).toBeVisible();const a=t.getByRole("button",{name:"Close"});await m.click(a),await p(o).not.toBeVisible()}},n={args:{open:!1,onClose:h()},render:()=>{const[t,s]=c.useState(null);return e.jsxs("div",{style:{display:"flex",gap:8},children:[["sm","md","lg"].map(o=>e.jsxs(r,{variant:"outline",onClick:()=>s(o),children:["Open ",o]},o)),e.jsx(d,{open:t!==null,onClose:()=>s(null),side:"right",size:t??"md",children:e.jsxs("div",{style:{padding:24,color:"var(--color-text-primary)"},children:[e.jsxs("div",{style:{fontSize:15,fontWeight:600,marginBottom:8},children:['size="',t,'"']}),e.jsxs("div",{style:{fontSize:13,color:"var(--color-text-secondary)",marginBottom:16},children:['This sheet uses the "',t,'" width variant.']}),e.jsx(r,{variant:"ghost",onClick:()=>s(null),children:"Close"})]})})]})}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    open: false,
    onClose: fn()
  },
  render: () => {
    const [open, setOpen] = useState(false);
    const [side, setSide] = useState<'right' | 'left' | 'bottom'>('right');
    return <div style={{
      display: 'flex',
      gap: 8
    }}>
        {(['right', 'left', 'bottom'] as const).map(s => <Button key={s} variant="outline" onClick={() => {
        setSide(s);
        setOpen(true);
      }}>
            Open {s}
          </Button>)}
        <Sheet open={open} onClose={() => setOpen(false)} side={side}>
          <div style={{
          padding: 24,
          color: 'var(--color-text-primary)'
        }}>
            <div style={{
            fontSize: 15,
            fontWeight: 600,
            marginBottom: 8
          }}>Sheet — {side}</div>
            <div style={{
            fontSize: 13,
            color: 'var(--color-text-secondary)',
            marginBottom: 16
          }}>
              Slide-in panel from the {side} edge.
            </div>
            <Button variant="ghost" onClick={() => setOpen(false)}>Close</Button>
          </div>
        </Sheet>
      </div>;
  },
  play: async ({
    canvas
  }) => {
    const openRightButton = canvas.getByRole('button', {
      name: 'Open right'
    });
    await userEvent.click(openRightButton);
    const sheetHeading = canvas.getByText('Sheet — right');
    await expect(sheetHeading).toBeVisible();
    const closeButton = canvas.getByRole('button', {
      name: 'Close'
    });
    await userEvent.click(closeButton);
    await expect(sheetHeading).not.toBeVisible();
  }
}`,...i.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  args: {
    open: false,
    onClose: fn()
  },
  render: () => {
    const [size, setSize] = useState<'sm' | 'md' | 'lg' | null>(null);
    return <div style={{
      display: 'flex',
      gap: 8
    }}>
        {(['sm', 'md', 'lg'] as const).map(s => <Button key={s} variant="outline" onClick={() => setSize(s)}>
            Open {s}
          </Button>)}
        <Sheet open={size !== null} onClose={() => setSize(null)} side="right" size={size ?? 'md'}>
          <div style={{
          padding: 24,
          color: 'var(--color-text-primary)'
        }}>
            <div style={{
            fontSize: 15,
            fontWeight: 600,
            marginBottom: 8
          }}>size="{size}"</div>
            <div style={{
            fontSize: 13,
            color: 'var(--color-text-secondary)',
            marginBottom: 16
          }}>
              This sheet uses the "{size}" width variant.
            </div>
            <Button variant="ghost" onClick={() => setSize(null)}>Close</Button>
          </div>
        </Sheet>
      </div>;
  }
}`,...n.parameters?.docs?.source}}};const B=["Default","Sizes"];export{i as Default,n as Sizes,B as __namedExportsOrder,x as default};
