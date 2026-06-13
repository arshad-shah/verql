import{B as a}from"./iframe-CdY22T7n.js";import{R as d}from"./Radio-B7PLoi94.js";import"./preload-helper-PPVm8Dsz.js";import"./index-CqE97RaD.js";import"./cn-DDt1maD9.js";const{fn:n,expect:c,userEvent:m}=__STORYBOOK_MODULE_TEST__,g={title:"Primitives/Forms/Radio",component:d,argTypes:{disabled:{control:"boolean"}}},t={args:{"aria-label":"Select option",name:"default",value:"option",onChange:n()},play:async({args:e,canvas:s})=>{const i=s.getByRole("radio");await m.click(i),await c(e.onChange).toHaveBeenCalledOnce()}},l={render:()=>a.jsx("div",{className:"flex flex-col gap-3",children:[{label:"Unselected",name:"states",value:"a"},{label:"Selected",name:"states",value:"b",defaultChecked:!0},{label:"Disabled",name:"states-disabled",value:"c",disabled:!0},{label:"Disabled + selected",name:"states-disabled-sel",value:"d",defaultChecked:!0,disabled:!0}].map(({label:e,...s})=>a.jsxs("label",{className:"flex items-center gap-2 text-sm text-text-primary cursor-pointer",children:[a.jsx(d,{...s}),e]},e))})},r={render:()=>a.jsx("div",{className:"flex items-center gap-4",children:["sm","md","lg"].map(e=>a.jsxs("label",{className:"flex items-center gap-2 text-sm text-text-primary cursor-pointer",children:[a.jsx(d,{size:e,name:"sizes",value:e,defaultChecked:e==="md","aria-label":`size ${e}`}),e]},e))})},o={render:()=>a.jsx("div",{className:"flex flex-col gap-3",children:["PostgreSQL","MySQL","SQLite","MongoDB"].map((e,s)=>a.jsxs("label",{className:"flex items-center gap-2 text-sm text-text-primary cursor-pointer",children:[a.jsx(d,{name:"db",value:e.toLowerCase(),defaultChecked:s===0}),e]},e))})};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    'aria-label': 'Select option',
    name: 'default',
    value: 'option',
    onChange: fn()
  },
  play: async ({
    args,
    canvas
  }) => {
    const radio = canvas.getByRole('radio');
    await userEvent.click(radio);
    await expect(args.onChange).toHaveBeenCalledOnce();
  }
}`,...t.parameters?.docs?.source}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex flex-col gap-3">
      {[{
      label: 'Unselected',
      name: 'states',
      value: 'a'
    }, {
      label: 'Selected',
      name: 'states',
      value: 'b',
      defaultChecked: true
    }, {
      label: 'Disabled',
      name: 'states-disabled',
      value: 'c',
      disabled: true
    }, {
      label: 'Disabled + selected',
      name: 'states-disabled-sel',
      value: 'd',
      defaultChecked: true,
      disabled: true
    }].map(({
      label,
      ...props
    }) => <label key={label} className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
          <Radio {...props} />
          {label}
        </label>)}
    </div>
}`,...l.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex items-center gap-4">
      {(['sm', 'md', 'lg'] as const).map(size => <label key={size} className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
          <Radio size={size} name="sizes" value={size} defaultChecked={size === 'md'} aria-label={\`size \${size}\`} />
          {size}
        </label>)}
    </div>
}`,...r.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex flex-col gap-3">
      {['PostgreSQL', 'MySQL', 'SQLite', 'MongoDB'].map((db, i) => <label key={db} className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
          <Radio name="db" value={db.toLowerCase()} defaultChecked={i === 0} />
          {db}
        </label>)}
    </div>
}`,...o.parameters?.docs?.source}}};const v=["Default","States","Sizes","RadioGroup"];export{t as Default,o as RadioGroup,r as Sizes,l as States,v as __namedExportsOrder,g as default};
