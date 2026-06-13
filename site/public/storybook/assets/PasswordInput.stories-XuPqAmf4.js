import{B as e}from"./iframe-CdY22T7n.js";import{P as s}from"./PasswordInput-yqvteJ6H.js";import"./preload-helper-PPVm8Dsz.js";import"./index-CqE97RaD.js";import"./cn-DDt1maD9.js";const{fn:i,expect:n,userEvent:l}=__STORYBOOK_MODULE_TEST__,x={title:"Primitives/Forms/PasswordInput",component:s,argTypes:{size:{control:"select",options:["xs","sm","md","lg","xl"]},error:{control:"boolean"},disabled:{control:"boolean"},showStrength:{control:"boolean"}},args:{onChange:i()}},t={args:{placeholder:"Enter password",size:"md"},play:async({canvas:o,args:c})=>{const d=o.getByPlaceholderText("Enter password");await l.type(d,"secret"),await n(c.onChange).toHaveBeenCalled();const p=o.getByRole("button",{name:"Show password"});await l.click(p),await n(o.getByRole("button",{name:"Hide password"})).toBeInTheDocument()}},r={args:{defaultValue:"MyP@ss123",showStrength:!0,size:"md"}},a={render:()=>e.jsxs("div",{className:"flex flex-col gap-3 w-64",children:[e.jsx(s,{placeholder:"Default"}),e.jsx(s,{placeholder:"Error",error:!0}),e.jsx(s,{placeholder:"Disabled",disabled:!0})]})};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    placeholder: 'Enter password',
    size: 'md'
  },
  play: async ({
    canvas,
    args
  }) => {
    const input = canvas.getByPlaceholderText('Enter password');
    await userEvent.type(input, 'secret');
    await expect(args.onChange).toHaveBeenCalled();
    const toggleButton = canvas.getByRole('button', {
      name: 'Show password'
    });
    await userEvent.click(toggleButton);
    await expect(canvas.getByRole('button', {
      name: 'Hide password'
    })).toBeInTheDocument();
  }
}`,...t.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    defaultValue: 'MyP@ss123',
    showStrength: true,
    size: 'md'
  }
}`,...r.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex flex-col gap-3 w-64">
      <PasswordInput placeholder="Default" />
      <PasswordInput placeholder="Error" error />
      <PasswordInput placeholder="Disabled" disabled />
    </div>
}`,...a.parameters?.docs?.source}}};const y=["Default","WithStrengthMeter","States"];export{t as Default,a as States,r as WithStrengthMeter,y as __namedExportsOrder,x as default};
