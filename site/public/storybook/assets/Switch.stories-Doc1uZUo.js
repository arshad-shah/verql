import{B as a}from"./iframe-CdY22T7n.js";import{S as t}from"./Switch-BBKi_QXD.js";import"./preload-helper-PPVm8Dsz.js";import"./index-CqE97RaD.js";import"./cn-DDt1maD9.js";const{fn:i,expect:o,userEvent:m}=__STORYBOOK_MODULE_TEST__,u={title:"Primitives/Forms/Switch",component:t,argTypes:{disabled:{control:"boolean"},defaultChecked:{control:"boolean"}}},r={args:{label:"Enable feature",onChange:i()},play:async({args:e,canvas:d})=>{const c=d.getByRole("switch");await m.click(c),await o(e.onChange).toHaveBeenCalledOnce()}},l={render:()=>a.jsx("div",{className:"flex flex-col gap-3",children:[{label:"Off",defaultChecked:!1},{label:"On",defaultChecked:!0},{label:"Disabled off",disabled:!0},{label:"Disabled on",defaultChecked:!0,disabled:!0}].map(({label:e,...d})=>a.jsxs("div",{className:"flex items-center gap-2 text-sm text-text-primary",children:[a.jsx(t,{label:e,...d}),a.jsx("span",{children:e})]},e))})},n={render:()=>a.jsx("div",{className:"flex items-center gap-6",children:["sm","md","lg"].map(e=>a.jsxs("div",{className:"flex items-center gap-2 text-sm text-text-primary",children:[a.jsx(t,{label:`${e} off`,size:e}),a.jsx(t,{label:`${e} on`,size:e,defaultChecked:!0}),a.jsx("span",{className:"text-text-secondary",children:e})]},e))})},s={render:()=>a.jsx("div",{className:"flex flex-col gap-4",children:["nightshift","dark","light","midnight","dracula","nord","solarized","catppuccin","lab","inkpaper"].map(e=>a.jsxs("div",{"data-theme":e,className:"flex items-center gap-4 rounded-lg border border-border-default bg-bg-primary p-3",children:[a.jsx("span",{className:"w-24 text-xs text-text-secondary",children:e}),a.jsx(t,{label:`${e} off`}),a.jsx(t,{label:`${e} on`,defaultChecked:!0}),a.jsx(t,{label:`${e} disabled`,defaultChecked:!0,disabled:!0})]},e))})};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    label: 'Enable feature',
    onChange: fn()
  },
  play: async ({
    args,
    canvas
  }) => {
    const switchEl = canvas.getByRole('switch');
    await userEvent.click(switchEl);
    await expect(args.onChange).toHaveBeenCalledOnce();
  }
}`,...r.parameters?.docs?.source}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex flex-col gap-3">
      {[{
      label: 'Off',
      defaultChecked: false
    }, {
      label: 'On',
      defaultChecked: true
    }, {
      label: 'Disabled off',
      disabled: true
    }, {
      label: 'Disabled on',
      defaultChecked: true,
      disabled: true
    }].map(({
      label,
      ...props
    }) =>
    // The Switch renders its own <label>, so pair it with text in a plain row.
    <div key={label} className="flex items-center gap-2 text-sm text-text-primary">
          <Switch label={label} {...props} />
          <span>{label}</span>
        </div>)}
    </div>
}`,...l.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex items-center gap-6">
      {(['sm', 'md', 'lg'] as const).map(size => <div key={size} className="flex items-center gap-2 text-sm text-text-primary">
          <Switch label={\`\${size} off\`} size={size} />
          <Switch label={\`\${size} on\`} size={size} defaultChecked />
          <span className="text-text-secondary">{size}</span>
        </div>)}
    </div>
}`,...n.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex flex-col gap-4">
      {['nightshift', 'dark', 'light', 'midnight', 'dracula', 'nord', 'solarized', 'catppuccin', 'lab', 'inkpaper'].map(theme => <div key={theme} data-theme={theme} className="flex items-center gap-4 rounded-lg border border-border-default bg-bg-primary p-3">
            <span className="w-24 text-xs text-text-secondary">{theme}</span>
            <Switch label={\`\${theme} off\`} />
            <Switch label={\`\${theme} on\`} defaultChecked />
            <Switch label={\`\${theme} disabled\`} defaultChecked disabled />
          </div>)}
    </div>
}`,...s.parameters?.docs?.source},description:{story:"Verifies the toggle reads cleanly on every bundled theme.",...s.parameters?.docs?.description}}};const g=["Default","States","Sizes","Themes"];export{r as Default,n as Sizes,l as States,s as Themes,g as __namedExportsOrder,u as default};
