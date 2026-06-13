import{B as e}from"./iframe-CdY22T7n.js";import{N as r}from"./NumberInput-CxGbH90u.js";import"./preload-helper-PPVm8Dsz.js";import"./index-CqE97RaD.js";import"./cn-DDt1maD9.js";const{fn:m,expect:c,userEvent:u}=__STORYBOOK_MODULE_TEST__,g={title:"Primitives/Forms/NumberInput",component:r,argTypes:{size:{control:"select",options:["xs","sm","md","lg","xl"]},error:{control:"boolean"},disabled:{control:"boolean"},min:{control:"number"},max:{control:"number"},step:{control:"number"},precision:{control:"number"}},args:{onChange:m()}},n={args:{defaultValue:42,min:0,max:100,step:1,size:"md","aria-label":"Value"},play:async({canvas:a,args:o})=>{const i=a.getByRole("button",{name:"Increment"});await u.click(i),await c(o.onChange).toHaveBeenCalledWith(43)}},s={render:()=>e.jsx("div",{className:"flex flex-col gap-3 w-48",children:["xs","sm","md","lg","xl"].map(a=>e.jsx(r,{size:a,defaultValue:10,min:0,max:99,"aria-label":`Size ${a}`},a))})},t={render:()=>e.jsxs("div",{className:"flex flex-col gap-3 w-48",children:[e.jsx(r,{defaultValue:50,min:0,max:100,"aria-label":"Default"}),e.jsx(r,{defaultValue:50,min:0,max:100,error:!0,"aria-label":"Error"}),e.jsx(r,{defaultValue:50,min:0,max:100,disabled:!0,"aria-label":"Disabled"})]})},l={args:{defaultValue:3.14,step:.01,precision:2,size:"md","aria-label":"Precision value"}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  args: {
    defaultValue: 42,
    min: 0,
    max: 100,
    step: 1,
    size: 'md',
    'aria-label': 'Value'
  },
  play: async ({
    canvas,
    args
  }) => {
    const incrementButton = canvas.getByRole('button', {
      name: 'Increment'
    });
    await userEvent.click(incrementButton);
    await expect(args.onChange).toHaveBeenCalledWith(43);
  }
}`,...n.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex flex-col gap-3 w-48">
      {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map(size => <NumberInput key={size} size={size} defaultValue={10} min={0} max={99} aria-label={\`Size \${size}\`} />)}
    </div>
}`,...s.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex flex-col gap-3 w-48">
      <NumberInput defaultValue={50} min={0} max={100} aria-label="Default" />
      <NumberInput defaultValue={50} min={0} max={100} error aria-label="Error" />
      <NumberInput defaultValue={50} min={0} max={100} disabled aria-label="Disabled" />
    </div>
}`,...t.parameters?.docs?.source}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    defaultValue: 3.14,
    step: 0.01,
    precision: 2,
    size: 'md',
    'aria-label': 'Precision value'
  }
}`,...l.parameters?.docs?.source}}};const V=["Default","Variants","States","WithPrecision"];export{n as Default,t as States,s as Variants,l as WithPrecision,V as __namedExportsOrder,g as default};
