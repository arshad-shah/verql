import{J as c,B as e}from"./iframe-CdY22T7n.js";import{M as r}from"./Modal-EvcNrSt5.js";import{B as l}from"./Button-DVlKTRa-.js";import"./preload-helper-PPVm8Dsz.js";import"./index-CqE97RaD.js";import"./cn-DDt1maD9.js";const{fn:d,expect:p,userEvent:u}=__STORYBOOK_MODULE_TEST__,g={title:"Primitives/Surfaces/Modal",component:r,parameters:{layout:"centered"}},a={args:{open:!1,onClose:d()},render:t=>{const[n,o]=c.useState(!1),s=()=>{o(!1),t.onClose()};return e.jsxs(e.Fragment,{children:[e.jsx(l,{onClick:()=>o(!0),children:"Open Modal"}),e.jsx(r,{open:n,onClose:s,children:e.jsxs("div",{style:{padding:24,display:"flex",flexDirection:"column",gap:16},children:[e.jsx("div",{style:{fontSize:16,fontWeight:600,color:"var(--color-text-primary)"},children:"Confirm action"}),e.jsx("div",{style:{fontSize:13,color:"var(--color-text-secondary)"},children:"Are you sure you want to proceed? This action cannot be undone."}),e.jsxs("div",{style:{display:"flex",gap:8,justifyContent:"flex-end"},children:[e.jsx(l,{variant:"ghost",onClick:s,children:"Cancel"}),e.jsx(l,{variant:"error",onClick:s,children:"Delete"})]})]})})]})},play:async({canvas:t,args:n})=>{const o=u.setup();await o.click(t.getByText("Open Modal"));const s=t.getByText("Cancel");await o.click(s),await p(n.onClose).toHaveBeenCalled()}},i={args:{open:!1,onClose:d()},render:()=>{const[t,n]=c.useState(null);return e.jsxs("div",{style:{display:"flex",gap:8},children:[["sm","md","lg"].map(o=>e.jsxs(l,{variant:"outline",onClick:()=>n(o),children:["Open ",o]},o)),e.jsx(r,{open:t!==null,onClose:()=>n(null),size:t??"md",children:e.jsxs("div",{style:{padding:24,display:"flex",flexDirection:"column",gap:16},children:[e.jsxs("div",{style:{fontSize:16,fontWeight:600,color:"var(--color-text-primary)"},children:['size="',t,'"']}),e.jsxs("div",{style:{fontSize:13,color:"var(--color-text-secondary)"},children:['This modal uses the "',t,'" size variant.']}),e.jsx("div",{style:{display:"flex",gap:8,justifyContent:"flex-end"},children:e.jsx(l,{variant:"ghost",onClick:()=>n(null),children:"Close"})})]})})]})}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    open: false,
    onClose: fn()
  },
  render: args => {
    const [open, setOpen] = useState(false);
    const handleClose = () => {
      setOpen(false);
      args.onClose();
    };
    return <>
        <Button onClick={() => setOpen(true)}>Open Modal</Button>
        <Modal open={open} onClose={handleClose}>
          <div style={{
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}>
            <div style={{
            fontSize: 16,
            fontWeight: 600,
            color: 'var(--color-text-primary)'
          }}>Confirm action</div>
            <div style={{
            fontSize: 13,
            color: 'var(--color-text-secondary)'
          }}>
              Are you sure you want to proceed? This action cannot be undone.
            </div>
            <div style={{
            display: 'flex',
            gap: 8,
            justifyContent: 'flex-end'
          }}>
              <Button variant="ghost" onClick={handleClose}>Cancel</Button>
              <Button variant="error" onClick={handleClose}>Delete</Button>
            </div>
          </div>
        </Modal>
      </>;
  },
  play: async ({
    canvas,
    args
  }) => {
    const user = userEvent.setup();
    await user.click(canvas.getByText('Open Modal'));
    const cancelButton = canvas.getByText('Cancel');
    await user.click(cancelButton);
    await expect(args.onClose).toHaveBeenCalled();
  }
}`,...a.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
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
        <Modal open={size !== null} onClose={() => setSize(null)} size={size ?? 'md'}>
          <div style={{
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}>
            <div style={{
            fontSize: 16,
            fontWeight: 600,
            color: 'var(--color-text-primary)'
          }}>size="{size}"</div>
            <div style={{
            fontSize: 13,
            color: 'var(--color-text-secondary)'
          }}>
              This modal uses the "{size}" size variant.
            </div>
            <div style={{
            display: 'flex',
            gap: 8,
            justifyContent: 'flex-end'
          }}>
              <Button variant="ghost" onClick={() => setSize(null)}>Close</Button>
            </div>
          </div>
        </Modal>
      </div>;
  }
}`,...i.parameters?.docs?.source}}};const h=["Default","Sizes"];export{a as Default,i as Sizes,h as __namedExportsOrder,g as default};
