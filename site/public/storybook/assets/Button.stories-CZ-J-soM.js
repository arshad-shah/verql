import{B as e}from"./iframe-CdY22T7n.js";import{B as o}from"./Button-DVlKTRa-.js";import"./preload-helper-PPVm8Dsz.js";import"./index-CqE97RaD.js";import"./cn-DDt1maD9.js";const{fn:l,expect:c,userEvent:d}=__STORYBOOK_MODULE_TEST__,v={title:"Primitives/Forms/Button",component:o,argTypes:{variant:{control:"select",options:["solid","outline","ghost","error"]},size:{control:"select",options:["xs","sm","md","lg","xl"]},disabled:{control:"boolean"}}},a={args:{children:"Button",variant:"solid",size:"md",onClick:l()},play:async({args:t,canvas:s})=>{const i=s.getByRole("button",{name:/button/i});await d.click(i),await c(t.onClick).toHaveBeenCalledOnce()}},n={render:()=>e.jsx("div",{className:"flex flex-col gap-6",children:["solid","outline","ghost","error"].map(t=>e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("span",{className:"w-16 text-xs text-text-muted",children:t}),["xs","sm","md","lg","xl"].map(s=>e.jsx(o,{variant:t,size:s,children:s},s))]},t))})},r={render:()=>e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx(o,{children:"Default"}),e.jsx(o,{disabled:!0,children:"Disabled"})]})};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    children: 'Button',
    variant: 'solid',
    size: 'md',
    onClick: fn()
  },
  play: async ({
    args,
    canvas
  }) => {
    const button = canvas.getByRole('button', {
      name: /button/i
    });
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledOnce();
  }
}`,...a.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex flex-col gap-6">
      {(['solid', 'outline', 'ghost', 'error'] as const).map(variant => <div key={variant} className="flex items-center gap-3">
          <span className="w-16 text-xs text-text-muted">{variant}</span>
          {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map(size => <Button key={size} variant={variant} size={size}>
              {size}
            </Button>)}
        </div>)}
    </div>
}`,...n.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex items-center gap-3">
      <Button>Default</Button>
      <Button disabled>Disabled</Button>
    </div>
}`,...r.parameters?.docs?.source}}};const f=["Default","Variants","States"];export{a as Default,r as States,n as Variants,f as __namedExportsOrder,v as default};
