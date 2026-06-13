import{B as n}from"./iframe-CdY22T7n.js";import{T as i}from"./Toast-DFHqdqIU.js";import"./preload-helper-PPVm8Dsz.js";import"./index-CqE97RaD.js";import"./cn-DDt1maD9.js";import"./Flex-CE2f2iq4.js";import"./Text-u8VLJp0e.js";import"./Button-DVlKTRa-.js";import"./info-xDV3YaJU.js";import"./createLucideIcon-CIh8D4qA.js";import"./triangle-alert-BmHsaBbn.js";import"./circle-check-CBnAbgkE.js";import"./x-CFCsdqrP.js";const{fn:r,expect:o,userEvent:c}=__STORYBOOK_MODULE_TEST__,T={title:"Primitives/Feedback/Toast",component:i,argTypes:{variant:{control:"select",options:["default","success","error","warning","info"]},message:{control:"text"}}},s={args:{variant:"default",message:"Action completed successfully.",onDismiss:r()},decorators:[e=>n.jsx("div",{style:{width:320},children:n.jsx(e,{})})],play:async({canvas:e,args:t})=>{await c.setup().click(e.getByRole("button",{name:"Dismiss"})),await o(t.onDismiss).toHaveBeenCalled()}},a={render:()=>n.jsx("div",{style:{display:"flex",flexDirection:"column",gap:8,width:320},children:[{variant:"default",message:"Default notification message"},{variant:"success",message:"Query executed successfully"},{variant:"error",message:"Connection failed — check credentials"},{variant:"warning",message:"SSL certificate expires in 7 days"},{variant:"info",message:"New version available"}].map(({variant:e,message:t})=>n.jsx(i,{variant:e,message:t,onDismiss:r()},e))})};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    variant: 'default',
    message: 'Action completed successfully.',
    onDismiss: fn()
  },
  decorators: [Story => <div style={{
    width: 320
  }}><Story /></div>],
  play: async ({
    canvas,
    args
  }) => {
    const user = userEvent.setup();
    await user.click(canvas.getByRole('button', {
      name: 'Dismiss'
    }));
    await expect(args.onDismiss).toHaveBeenCalled();
  }
}`,...s.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    width: 320
  }}>
      {([{
      variant: 'default',
      message: 'Default notification message'
    }, {
      variant: 'success',
      message: 'Query executed successfully'
    }, {
      variant: 'error',
      message: 'Connection failed — check credentials'
    }, {
      variant: 'warning',
      message: 'SSL certificate expires in 7 days'
    }, {
      variant: 'info',
      message: 'New version available'
    }] as const).map(({
      variant,
      message
    }) => <Toast key={variant} variant={variant} message={message} onDismiss={fn()} />)}
    </div>
}`,...a.parameters?.docs?.source}}};const _=["Default","Variants"];export{s as Default,a as Variants,_ as __namedExportsOrder,T as default};
