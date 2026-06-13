import{B as e}from"./iframe-CdY22T7n.js";import{I as s}from"./Input-DjpTQLBk.js";import"./preload-helper-PPVm8Dsz.js";import"./index-CqE97RaD.js";import"./cn-DDt1maD9.js";const{fn:i,expect:d,userEvent:c}=__STORYBOOK_MODULE_TEST__,g={title:"Primitives/Forms/Input",component:s,argTypes:{size:{control:"select",options:["xs","sm","md","lg","xl"]},error:{control:"boolean"},disabled:{control:"boolean"},placeholder:{control:"text"}}},r={args:{size:"md",placeholder:"Enter value…",style:{width:280},onChange:i()},play:async({args:a,canvas:o})=>{const n=o.getByRole("textbox");await c.type(n,"hello"),await d(a.onChange).toHaveBeenCalled()}},t={render:()=>e.jsx("div",{className:"flex flex-col gap-2",style:{width:280},children:["xs","sm","md","lg","xl"].map(a=>e.jsx(s,{size:a,placeholder:`size="${a}"`},a))})},l={render:()=>e.jsxs("div",{className:"flex flex-col gap-2",style:{width:280},children:[e.jsx(s,{size:"md",placeholder:"Default","aria-label":"Default"}),e.jsx(s,{size:"md",error:!0,defaultValue:"Error state","aria-label":"Error"}),e.jsx(s,{size:"md",disabled:!0,defaultValue:"Disabled","aria-label":"Disabled"})]})};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    size: 'md',
    placeholder: 'Enter value\\u2026',
    style: {
      width: 280
    },
    onChange: fn()
  },
  play: async ({
    args,
    canvas
  }) => {
    const input = canvas.getByRole('textbox');
    await userEvent.type(input, 'hello');
    await expect(args.onChange).toHaveBeenCalled();
  }
}`,...r.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex flex-col gap-2" style={{
    width: 280
  }}>
      {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map(size => <Input key={size} size={size} placeholder={\`size="\${size}"\`} />)}
    </div>
}`,...t.parameters?.docs?.source}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex flex-col gap-2" style={{
    width: 280
  }}>
      <Input size="md" placeholder="Default" aria-label="Default" />
      <Input size="md" error defaultValue="Error state" aria-label="Error" />
      <Input size="md" disabled defaultValue="Disabled" aria-label="Disabled" />
    </div>
}`,...l.parameters?.docs?.source}}};const h=["Default","Variants","States"];export{r as Default,l as States,t as Variants,h as __namedExportsOrder,g as default};
