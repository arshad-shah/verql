import{B as e}from"./iframe-CdY22T7n.js";import{I as r}from"./Button-DVlKTRa-.js";import"./preload-helper-PPVm8Dsz.js";import"./index-CqE97RaD.js";import"./cn-DDt1maD9.js";const{fn:c,expect:i,userEvent:d}=__STORYBOOK_MODULE_TEST__,v={title:"Primitives/Forms/IconButton",component:r,argTypes:{variant:{control:"select",options:["solid","outline","ghost","tab-action"]},size:{control:"select",options:["xs","sm","md","lg","xl","tab-action"]},disabled:{control:"boolean"}}},s={args:{variant:"ghost",size:"md",label:"Settings",children:"⚙",onClick:c()},play:async({args:t,canvas:a})=>{const l=a.getByRole("button",{name:/settings/i});await d.click(l),await i(t.onClick).toHaveBeenCalledOnce()}},n={render:()=>e.jsx("div",{className:"flex flex-col gap-6",children:["solid","outline","ghost"].map(t=>e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("span",{className:"w-16 text-xs text-text-muted",children:t}),["xs","sm","md","lg","xl"].map(a=>e.jsx(r,{variant:t,size:a,label:`${t} ${a}`,children:"\\u2715"},a))]},t))})},o={render:()=>e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx(r,{label:"Default",children:"\\u2605"}),e.jsx(r,{label:"Disabled",disabled:!0,children:"\\u2605"})]})};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'ghost',
    size: 'md',
    label: 'Settings',
    children: '\\u2699',
    onClick: fn()
  },
  play: async ({
    args,
    canvas
  }) => {
    const button = canvas.getByRole('button', {
      name: /settings/i
    });
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledOnce();
  }
}`,...s.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex flex-col gap-6">
      {(['solid', 'outline', 'ghost'] as const).map(variant => <div key={variant} className="flex items-center gap-3">
          <span className="w-16 text-xs text-text-muted">{variant}</span>
          {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map(size => <IconButton key={size} variant={variant} size={size} label={\`\${variant} \${size}\`}>
              \\u2715
            </IconButton>)}
        </div>)}
    </div>
}`,...n.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex items-center gap-3">
      <IconButton label="Default">\\u2605</IconButton>
      <IconButton label="Disabled" disabled>\\u2605</IconButton>
    </div>
}`,...o.parameters?.docs?.source}}};const b=["Default","Variants","States"];export{s as Default,o as States,n as Variants,b as __namedExportsOrder,v as default};
