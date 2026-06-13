import{B as e}from"./iframe-CdY22T7n.js";import{T as r}from"./Textarea-CzIEnTGU.js";import"./preload-helper-PPVm8Dsz.js";import"./index-CqE97RaD.js";import"./cn-DDt1maD9.js";const{fn:d,expect:i,userEvent:c}=__STORYBOOK_MODULE_TEST__,g={title:"Primitives/Forms/Textarea",component:r,argTypes:{size:{control:"select",options:["xs","sm","md","lg","xl"]},error:{control:"boolean"},disabled:{control:"boolean"},placeholder:{control:"text"},rows:{control:"number"}}},s={args:{size:"md",placeholder:"Enter your message…",rows:4,style:{width:320},onChange:d()},play:async({args:a,canvas:o})=>{const n=o.getByRole("textbox");await c.type(n,"hello"),await i(a.onChange).toHaveBeenCalled()}},t={render:()=>e.jsx("div",{className:"flex flex-col gap-2",style:{width:320},children:["xs","sm","md","lg","xl"].map(a=>e.jsx(r,{size:a,rows:3,placeholder:`size="${a}"`},a))})},l={render:()=>e.jsxs("div",{className:"flex flex-col gap-2",style:{width:320},children:[e.jsx(r,{size:"md",rows:3,placeholder:"Default","aria-label":"Default"}),e.jsx(r,{size:"md",rows:3,error:!0,defaultValue:"Error state","aria-label":"Error"}),e.jsx(r,{size:"md",rows:3,disabled:!0,defaultValue:"Disabled","aria-label":"Disabled"})]})};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    size: 'md',
    placeholder: 'Enter your message\\u2026',
    rows: 4,
    style: {
      width: 320
    },
    onChange: fn()
  },
  play: async ({
    args,
    canvas
  }) => {
    const textarea = canvas.getByRole('textbox');
    await userEvent.type(textarea, 'hello');
    await expect(args.onChange).toHaveBeenCalled();
  }
}`,...s.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex flex-col gap-2" style={{
    width: 320
  }}>
      {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map(size => <Textarea key={size} size={size} rows={3} placeholder={\`size="\${size}"\`} />)}
    </div>
}`,...t.parameters?.docs?.source}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex flex-col gap-2" style={{
    width: 320
  }}>
      <Textarea size="md" rows={3} placeholder="Default" aria-label="Default" />
      <Textarea size="md" rows={3} error defaultValue="Error state" aria-label="Error" />
      <Textarea size="md" rows={3} disabled defaultValue="Disabled" aria-label="Disabled" />
    </div>
}`,...l.parameters?.docs?.source}}};const h=["Default","Variants","States"];export{s as Default,l as States,t as Variants,h as __namedExportsOrder,g as default};
