import{J as a,B as o}from"./iframe-CdY22T7n.js";import{r as l}from"./index-kMnmcFYy.js";import"./preload-helper-PPVm8Dsz.js";import"./index-Cf8GF5kW.js";function i({children:e,container:t}){const[c,s]=a.useState(!1);return a.useEffect(()=>{s(!0)},[]),c?l.createPortal(e,t??document.body):null}const{expect:d}=__STORYBOOK_MODULE_TEST__,b={title:"Primitives/Utilities/Portal",component:i},r={args:{children:o.jsx("div",{style:{position:"fixed",bottom:24,right:24,padding:"12px 20px",background:"var(--color-bg-elevated)",border:"1px solid var(--color-border)",borderRadius:8,fontSize:13,color:"var(--color-text-primary)",boxShadow:"0 4px 12px rgba(0,0,0,0.3)",zIndex:9999},children:"Portal content rendered into document.body"})},play:async({canvas:e})=>{const t=document.querySelector("body");await d(t).not.toBeNull(),await d(t.textContent).toContain("Portal content rendered into document.body")}},n={render:()=>{const e=document.createElement("div");return e.id="portal-target",e.style.cssText="position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:9999;",document.body.appendChild(e),o.jsxs("div",{children:[o.jsx("p",{style:{fontSize:13,color:"var(--color-text-secondary)",marginBottom:8},children:"The badge below is rendered into a custom container element (not document.body)."}),o.jsx(i,{container:e,children:o.jsx("div",{style:{padding:"8px 16px",background:"var(--color-bg-elevated)",color:"var(--color-text-primary)",border:"1px solid var(--color-border)",borderRadius:6,fontSize:12,fontWeight:600},children:"Custom container portal"})})]})}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    children: <div style={{
      position: 'fixed',
      bottom: 24,
      right: 24,
      padding: '12px 20px',
      background: 'var(--color-bg-elevated)',
      border: '1px solid var(--color-border)',
      borderRadius: 8,
      fontSize: 13,
      color: 'var(--color-text-primary)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      zIndex: 9999
    }}>
        Portal content rendered into document.body
      </div>
  },
  play: async ({
    canvas
  }) => {
    // Portal renders outside the canvas element into document.body,
    // so we query document directly
    const portalContent = document.querySelector('body');
    await expect(portalContent).not.toBeNull();
    await expect(portalContent!.textContent).toContain('Portal content rendered into document.body');
  }
}`,...r.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.id = 'portal-target';
    wrapper.style.cssText = 'position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:9999;';
    document.body.appendChild(wrapper);
    return <div>
        <p style={{
        fontSize: 13,
        color: 'var(--color-text-secondary)',
        marginBottom: 8
      }}>
          The badge below is rendered into a custom container element (not document.body).
        </p>
        <Portal container={wrapper}>
          <div style={{
          padding: '8px 16px',
          background: 'var(--color-bg-elevated)',
          color: 'var(--color-text-primary)',
          border: '1px solid var(--color-border)',
          borderRadius: 6,
          fontSize: 12,
          fontWeight: 600
        }}>
            Custom container portal
          </div>
        </Portal>
      </div>;
  }
}`,...n.parameters?.docs?.source}}};const y=["Default","WithCustomContainer"];export{r as Default,n as WithCustomContainer,y as __namedExportsOrder,b as default};
