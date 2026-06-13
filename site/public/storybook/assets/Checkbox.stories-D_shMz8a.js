import{B as a}from"./iframe-CdY22T7n.js";import{C as c}from"./Checkbox-DDEoxGC3.js";import"./preload-helper-PPVm8Dsz.js";import"./index-CqE97RaD.js";import"./cn-DDt1maD9.js";const{fn:n,expect:d,userEvent:i}=__STORYBOOK_MODULE_TEST__,h={title:"Primitives/Forms/Checkbox",component:c,argTypes:{disabled:{control:"boolean"},defaultChecked:{control:"boolean"}}},s={args:{"aria-label":"Toggle option",onChange:n()},play:async({args:e,canvas:l})=>{const o=l.getByRole("checkbox");await i.click(o),await d(e.onChange).toHaveBeenCalledOnce()}},t={render:()=>a.jsx("div",{className:"flex items-center gap-4",children:["sm","md","lg"].map(e=>a.jsxs("label",{className:"flex items-center gap-2 text-sm text-text-primary cursor-pointer",children:[a.jsx(c,{size:e,defaultChecked:!0,"aria-label":`size ${e}`}),e]},e))})},r={render:()=>a.jsx("div",{className:"flex flex-col gap-3",children:[{label:"Unchecked",defaultChecked:!1},{label:"Checked",defaultChecked:!0},{label:"Disabled",disabled:!0},{label:"Disabled + checked",defaultChecked:!0,disabled:!0}].map(({label:e,...l})=>a.jsxs("label",{className:"flex items-center gap-2 text-sm text-text-primary cursor-pointer",children:[a.jsx(c,{...l}),e]},e))})};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    'aria-label': 'Toggle option',
    onChange: fn()
  },
  play: async ({
    args,
    canvas
  }) => {
    const checkbox = canvas.getByRole('checkbox');
    await userEvent.click(checkbox);
    await expect(args.onChange).toHaveBeenCalledOnce();
  }
}`,...s.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex items-center gap-4">
      {(['sm', 'md', 'lg'] as const).map(size => <label key={size} className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
          <Checkbox size={size} defaultChecked aria-label={\`size \${size}\`} />
          {size}
        </label>)}
    </div>
}`,...t.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex flex-col gap-3">
      {[{
      label: 'Unchecked',
      defaultChecked: false
    }, {
      label: 'Checked',
      defaultChecked: true
    }, {
      label: 'Disabled',
      disabled: true
    }, {
      label: 'Disabled + checked',
      defaultChecked: true,
      disabled: true
    }].map(({
      label,
      ...props
    }) => <label key={label} className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
          <Checkbox {...props} />
          {label}
        </label>)}
    </div>
}`,...r.parameters?.docs?.source}}};const f=["Default","Sizes","States"];export{s as Default,t as Sizes,r as States,f as __namedExportsOrder,h as default};
