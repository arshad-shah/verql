import{J as d,B as e}from"./iframe-CdY22T7n.js";import{S as a}from"./SearchInput-CAJDyJI7.js";import"./preload-helper-PPVm8Dsz.js";import"./index-CqE97RaD.js";import"./cn-DDt1maD9.js";const{fn:u,expect:p,userEvent:i}=__STORYBOOK_MODULE_TEST__,f={title:"Primitives/Forms/SearchInput",component:a,argTypes:{size:{control:"select",options:["xs","sm","md","lg","xl"]},loading:{control:"boolean"},disabled:{control:"boolean"},shortcut:{control:"text"}}},c=u(),h=u(),t={render:function(){const[r,n]=d.useState("");return e.jsx("div",{className:"w-72",children:e.jsx(a,{value:r,onChange:l=>{n(l.target.value),c(l)},onClear:()=>{n(""),h()},placeholder:"Search tables...",shortcut:"⌘K"})})},play:async({canvas:s})=>{const r=s.getByRole("textbox");await i.type(r,"users"),await p(c).toHaveBeenCalled()}},o={render:()=>e.jsxs("div",{className:"flex flex-col gap-3 w-72",children:[e.jsx(a,{placeholder:"Default",shortcut:"⌘K"}),e.jsx(a,{placeholder:"Loading...",loading:!0}),e.jsx(a,{placeholder:"Disabled",disabled:!0})]})};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  render: function Render() {
    const [value, setValue] = useState('');
    return <div className="w-72">
        <SearchInput value={value} onChange={e => {
        setValue(e.target.value);
        onChangeMock(e);
      }} onClear={() => {
        setValue('');
        onClearMock();
      }} placeholder="Search tables..." shortcut="⌘K" />
      </div>;
  },
  play: async ({
    canvas
  }) => {
    const input = canvas.getByRole('textbox');
    await userEvent.type(input, 'users');
    await expect(onChangeMock).toHaveBeenCalled();
  }
}`,...t.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex flex-col gap-3 w-72">
      <SearchInput placeholder="Default" shortcut="⌘K" />
      <SearchInput placeholder="Loading..." loading />
      <SearchInput placeholder="Disabled" disabled />
    </div>
}`,...o.parameters?.docs?.source}}};const b=["Default","States"];export{t as Default,o as States,b as __namedExportsOrder,f as default};
