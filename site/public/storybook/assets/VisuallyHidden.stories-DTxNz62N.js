import{B as e}from"./iframe-CdY22T7n.js";import{V as i}from"./VisuallyHidden-ZCvqR7kA.js";import{X as s}from"./x-CFCsdqrP.js";import{C as d}from"./check-BxkDBxqF.js";import{A as c}from"./arrow-up-DGQOQQzZ.js";import{A as p}from"./arrow-down-sHqQ2fUb.js";import{S as u}from"./search-s_RWiGmL.js";import"./preload-helper-PPVm8Dsz.js";import"./createLucideIcon-CIh8D4qA.js";const{expect:a,userEvent:y}=__STORYBOOK_MODULE_TEST__,z={title:"Primitives/Utilities/VisuallyHidden",component:i},r={render:()=>e.jsxs("button",{type:"button",style:{display:"flex",alignItems:"center",justifyContent:"center",width:40,height:40,background:"var(--color-bg-secondary)",border:"1px solid var(--color-border)",borderRadius:8,cursor:"pointer",color:"var(--color-text-primary)",fontSize:18},children:[e.jsx("span",{"aria-hidden":"true",children:e.jsx(s,{size:16})}),e.jsx(i,{children:"Close dialog"})]}),play:async({canvas:o})=>{const n=o.getByText("Close dialog");await a(n).toBeInTheDocument();const l=o.getByRole("button",{name:/close dialog/i});await a(l).toBeInTheDocument(),await y.click(l)}},t={render:()=>e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:20},children:[e.jsxs("div",{children:[e.jsx("p",{style:{fontSize:11,color:"var(--color-text-muted)",marginBottom:8},children:"Icon-only button with accessible label"}),e.jsx("div",{style:{display:"flex",gap:8},children:[{icon:e.jsx(s,{size:14}),label:"Close"},{icon:e.jsx(d,{size:14}),label:"Confirm"},{icon:e.jsx(c,{size:14}),label:"Move up"},{icon:e.jsx(p,{size:14}),label:"Move down"}].map(o=>e.jsxs("button",{type:"button",style:{display:"flex",alignItems:"center",justifyContent:"center",width:36,height:36,background:"var(--color-bg-secondary)",border:"1px solid var(--color-border)",borderRadius:6,cursor:"pointer",color:"var(--color-text-primary)"},children:[e.jsx("span",{"aria-hidden":"true",children:o.icon}),e.jsx(i,{children:o.label})]},o.label))})]}),e.jsxs("div",{children:[e.jsx("p",{style:{fontSize:11,color:"var(--color-text-muted)",marginBottom:8},children:"VisuallyHidden inside a label for a custom input"}),e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:8},children:[e.jsxs("label",{htmlFor:"search-demo",style:{fontSize:13,color:"var(--color-text-secondary)",display:"flex",alignItems:"center"},children:[e.jsx(i,{children:"Search"}),e.jsx("span",{"aria-hidden":"true",style:{marginRight:4},children:e.jsx(u,{size:14})})]}),e.jsx("input",{id:"search-demo",type:"text",placeholder:"Search...",style:{padding:"6px 10px",background:"var(--color-bg-secondary)",border:"1px solid var(--color-border)",borderRadius:6,color:"var(--color-text-primary)",fontSize:13,outline:"none"}})]})]})]})};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: () => <button type="button" style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    background: 'var(--color-bg-secondary)',
    border: '1px solid var(--color-border)',
    borderRadius: 8,
    cursor: 'pointer',
    color: 'var(--color-text-primary)',
    fontSize: 18
  }}>
      {/* Icon-only button — label is hidden visually but accessible */}
      <span aria-hidden="true"><X size={16} /></span>
      <VisuallyHidden>Close dialog</VisuallyHidden>
    </button>,
  play: async ({
    canvas
  }) => {
    // sr-only text is in the DOM and findable by testing-library
    const hiddenText = canvas.getByText('Close dialog');
    await expect(hiddenText).toBeInTheDocument();

    // The button itself is accessible via its hidden label
    const button = canvas.getByRole('button', {
      name: /close dialog/i
    });
    await expect(button).toBeInTheDocument();

    // Verify clicking works
    await userEvent.click(button);
  }
}`,...r.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: 20
  }}>
      <div>
        <p style={{
        fontSize: 11,
        color: 'var(--color-text-muted)',
        marginBottom: 8
      }}>
          Icon-only button with accessible label
        </p>
        <div style={{
        display: 'flex',
        gap: 8
      }}>
          {([{
          icon: <X size={14} />,
          label: 'Close'
        }, {
          icon: <Check size={14} />,
          label: 'Confirm'
        }, {
          icon: <ArrowUp size={14} />,
          label: 'Move up'
        }, {
          icon: <ArrowDown size={14} />,
          label: 'Move down'
        }] as const).map(item => <button key={item.label} type="button" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 36,
          height: 36,
          background: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: 6,
          cursor: 'pointer',
          color: 'var(--color-text-primary)'
        }}>
              <span aria-hidden="true">{item.icon}</span>
              <VisuallyHidden>{item.label}</VisuallyHidden>
            </button>)}
        </div>
      </div>

      <div>
        <p style={{
        fontSize: 11,
        color: 'var(--color-text-muted)',
        marginBottom: 8
      }}>
          VisuallyHidden inside a label for a custom input
        </p>
        <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }}>
          <label htmlFor="search-demo" style={{
          fontSize: 13,
          color: 'var(--color-text-secondary)',
          display: 'flex',
          alignItems: 'center'
        }}>
            <VisuallyHidden>Search</VisuallyHidden>
            <span aria-hidden="true" style={{
            marginRight: 4
          }}><Search size={14} /></span>
          </label>
          <input id="search-demo" type="text" placeholder="Search..." style={{
          padding: '6px 10px',
          background: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          borderRadius: 6,
          color: 'var(--color-text-primary)',
          fontSize: 13,
          outline: 'none'
        }} />
        </div>
      </div>
    </div>
}`,...t.parameters?.docs?.source}}};const w=["Default","States"];export{r as Default,t as States,w as __namedExportsOrder,z as default};
