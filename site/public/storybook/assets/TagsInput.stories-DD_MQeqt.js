import{J as u,B as e}from"./iframe-CdY22T7n.js";import{T as o}from"./TagsInput-DUVVsLjJ.js";import"./preload-helper-PPVm8Dsz.js";import"./index-CqE97RaD.js";import"./cn-DDt1maD9.js";import"./x-CFCsdqrP.js";import"./createLucideIcon-CIh8D4qA.js";const{fn:p,expect:i,userEvent:m}=__STORYBOOK_MODULE_TEST__,S={title:"Primitives/Forms/TagsInput",component:o,argTypes:{size:{control:"select",options:["xs","sm","md","lg","xl"]},maxTags:{control:"number"},disabled:{control:"boolean"}}},n=p(),s={render:function(){const[c,d]=u.useState(["users","orders"]);return e.jsx("div",{className:"w-80",children:e.jsx(o,{value:c,onChange:l=>{d(l),n(l)},placeholder:"Add table..."})})},play:async({canvas:a})=>{const c=a.getByRole("textbox");await m.type(c,"products{Enter}"),await i(n).toHaveBeenCalledWith(["users","orders","products"])}},t={args:{defaultValue:["tag1","tag2"],maxTags:3,placeholder:"Max 3 tags"},decorators:[a=>e.jsx("div",{className:"w-80",children:e.jsx(a,{})})]},r={render:()=>e.jsxs("div",{className:"flex flex-col gap-3 w-80",children:[e.jsx(o,{defaultValue:["active"],placeholder:"Default"}),e.jsx(o,{defaultValue:["locked"],disabled:!0})]})};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render: function Render() {
    const [tags, setTags] = useState(['users', 'orders']);
    return <div className="w-80">
        <TagsInput value={tags} onChange={next => {
        setTags(next);
        onChangeMock(next);
      }} placeholder="Add table..." />
      </div>;
  },
  play: async ({
    canvas
  }) => {
    const input = canvas.getByRole('textbox');
    await userEvent.type(input, 'products{Enter}');
    await expect(onChangeMock).toHaveBeenCalledWith(['users', 'orders', 'products']);
  }
}`,...s.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    defaultValue: ['tag1', 'tag2'],
    maxTags: 3,
    placeholder: 'Max 3 tags'
  },
  decorators: [Story => <div className="w-80"><Story /></div>]
}`,...t.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex flex-col gap-3 w-80">
      <TagsInput defaultValue={['active']} placeholder="Default" />
      <TagsInput defaultValue={['locked']} disabled />
    </div>
}`,...r.parameters?.docs?.source}}};const w=["Default","WithMaxTags","States"];export{s as Default,r as States,t as WithMaxTags,w as __namedExportsOrder,S as default};
