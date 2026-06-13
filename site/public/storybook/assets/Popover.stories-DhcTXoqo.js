import{B as t}from"./iframe-CdY22T7n.js";import{P as r}from"./Popover-ekmZQG1b.js";import{B as a}from"./Button-DVlKTRa-.js";import"./preload-helper-PPVm8Dsz.js";import"./cn-DDt1maD9.js";import"./index-CqE97RaD.js";const{expect:s,userEvent:c}=__STORYBOOK_MODULE_TEST__,g={title:"Primitives/Surfaces/Popover",component:r},e={args:{trigger:null,content:null},render:()=>t.jsx(r,{trigger:t.jsx(a,{variant:"outline",children:"Open Popover"}),content:t.jsxs("div",{style:{padding:12,minWidth:200,color:"var(--color-text-primary)"},children:[t.jsx("div",{style:{fontSize:13,fontWeight:600,marginBottom:8},children:"Popover title"}),t.jsx("div",{style:{fontSize:12,color:"var(--color-text-secondary)"},children:"Popover body content. Click outside or press Escape to close."})]})}),play:async({canvas:o})=>{const n=o.getByRole("button",{name:"Open Popover"});await c.click(n);const i=o.getByText("Popover title");await s(i).toBeInTheDocument()}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  args: {
    trigger: null as any,
    content: null as any
  },
  render: () => <Popover trigger={<Button variant="outline">Open Popover</Button>} content={<div style={{
    padding: 12,
    minWidth: 200,
    color: 'var(--color-text-primary)'
  }}>
          <div style={{
      fontSize: 13,
      fontWeight: 600,
      marginBottom: 8
    }}>Popover title</div>
          <div style={{
      fontSize: 12,
      color: 'var(--color-text-secondary)'
    }}>
            Popover body content. Click outside or press Escape to close.
          </div>
        </div>} />,
  play: async ({
    canvas
  }) => {
    const triggerButton = canvas.getByRole('button', {
      name: 'Open Popover'
    });
    await userEvent.click(triggerButton);

    // The native Popover API uses CSS :popover-open state; content is always in the DOM
    const title = canvas.getByText('Popover title');
    await expect(title).toBeInTheDocument();
  }
}`,...e.parameters?.docs?.source}}};const y=["Default"];export{e as Default,y as __namedExportsOrder,g as default};
