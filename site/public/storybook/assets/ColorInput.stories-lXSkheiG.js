import{J as d,B as t}from"./iframe-CdY22T7n.js";import{C as i}from"./ColorInput-jrVGPdr-.js";import"./preload-helper-PPVm8Dsz.js";import"./floating-ui.react-BTPmBFa-.js";import"./index-kMnmcFYy.js";import"./index-Cf8GF5kW.js";import"./index-CqE97RaD.js";import"./cn-DDt1maD9.js";import"./ColorPicker-CTQREHAa.js";const{fn:u,expect:a,userEvent:m}=__STORYBOOK_MODULE_TEST__,C={title:"Primitives/Forms/ColorInput",component:i,argTypes:{size:{control:"select",options:["xs","sm","md","lg","xl"]},disabled:{control:"boolean"},showPicker:{control:"boolean"}}},p=u(),o={render:function(){const[n,l]=d.useState("#7c6ff7");return t.jsx("div",{className:"w-48",children:t.jsx(i,{value:n,onChange:f=>{l(f),p(f)}})})},play:async({canvas:e})=>{const n=e.getByRole("textbox");await a(n).toHaveValue("#7c6ff7");const l=e.getByLabelText("Pick color");await m.click(l),await a(e.getByRole("button",{name:"hex"})).toBeInTheDocument(),await a(e.getByRole("button",{name:"rgb"})).toBeInTheDocument(),await a(e.getByRole("button",{name:"hsl"})).toBeInTheDocument()}},s={args:{defaultValue:"#7c6ff7",presets:["#ff5555","#50fa7b","#f1fa8c","#bd93f9","#ff79c6","#8be9fd","#7c6ff7","#61afef"]},decorators:[e=>t.jsx("div",{className:"w-48",children:t.jsx(e,{})})]},r={render:()=>t.jsx("div",{className:"flex flex-col gap-3 w-48",children:["xs","sm","md","lg","xl"].map(e=>t.jsx(i,{defaultValue:"#7c6ff7",size:e},e))})},c={args:{defaultValue:"#7c6ff7",disabled:!0},decorators:[e=>t.jsx("div",{className:"w-48",children:t.jsx(e,{})})]};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: function Render() {
    const [color, setColor] = useState('#7c6ff7');
    return <div className="w-48">
        <ColorInput value={color} onChange={next => {
        setColor(next);
        onChangeMock(next);
      }} />
      </div>;
  },
  play: async ({
    canvas
  }) => {
    // Verify initial value
    const input = canvas.getByRole('textbox');
    await expect(input).toHaveValue('#7c6ff7');
    // Open picker
    const swatch = canvas.getByLabelText('Pick color');
    await userEvent.click(swatch);
    // Verify picker panel appeared — format buttons visible
    await expect(canvas.getByRole('button', {
      name: 'hex'
    })).toBeInTheDocument();
    await expect(canvas.getByRole('button', {
      name: 'rgb'
    })).toBeInTheDocument();
    await expect(canvas.getByRole('button', {
      name: 'hsl'
    })).toBeInTheDocument();
  }
}`,...o.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    defaultValue: '#7c6ff7',
    presets: ['#ff5555', '#50fa7b', '#f1fa8c', '#bd93f9', '#ff79c6', '#8be9fd', '#7c6ff7', '#61afef']
  },
  decorators: [Story => <div className="w-48"><Story /></div>]
}`,...s.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex flex-col gap-3 w-48">
      {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map(size => <ColorInput key={size} defaultValue="#7c6ff7" size={size} />)}
    </div>
}`,...r.parameters?.docs?.source}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    defaultValue: '#7c6ff7',
    disabled: true
  },
  decorators: [Story => <div className="w-48"><Story /></div>]
}`,...c.parameters?.docs?.source}}};const R=["Default","WithPresets","Sizes","Disabled"];export{o as Default,c as Disabled,r as Sizes,s as WithPresets,R as __namedExportsOrder,C as default};
