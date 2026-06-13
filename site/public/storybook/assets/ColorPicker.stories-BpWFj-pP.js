import{J as l,B as t}from"./iframe-CdY22T7n.js";import{C as n}from"./ColorPicker-CTQREHAa.js";import"./preload-helper-PPVm8Dsz.js";import"./cn-DDt1maD9.js";const{fn:m,expect:f,userEvent:d}=__STORYBOOK_MODULE_TEST__,p=m(),x={title:"Primitives/Forms/ColorPicker",component:n,decorators:[e=>t.jsx("div",{style:{padding:24,background:"var(--color-bg-primary)"},children:t.jsx(e,{})})]},s={render:function(){const[o,r]=l.useState("#7c6ff7");return t.jsx(n,{value:o,onChange:i=>{r(i),p(i)}})},play:async({canvas:e})=>{const o=e.getByRole("button",{name:"rgb"});await d.click(o),await f(e.getByText("R")).toBeInTheDocument(),await f(e.getByText("G")).toBeInTheDocument(),await f(e.getByText("B")).toBeInTheDocument()}},a={render:function(){const[o,r]=l.useState("#ff5555");return t.jsx(n,{value:o,onChange:r,presets:["#ff5555","#50fa7b","#f1fa8c","#bd93f9","#ff79c6","#8be9fd"]})}},c={render:function(){const[o,r]=l.useState("#0080ff");return t.jsx(n,{value:o,onChange:r,showPresets:!1})}},u={render:function(){const[o,r]=l.useState("#7c6ff7");return t.jsx(n,{value:o,onChange:r,format:"hsl"})}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render: function Render() {
    const [color, setColor] = useState('#7c6ff7');
    return <ColorPicker value={color} onChange={c => {
      setColor(c);
      onChangeMock(c);
    }} />;
  },
  play: async ({
    canvas
  }) => {
    // Click the RGB format button
    const rgbBtn = canvas.getByRole('button', {
      name: 'rgb'
    });
    await userEvent.click(rgbBtn);
    // Verify RGB inputs appear
    await expect(canvas.getByText('R')).toBeInTheDocument();
    await expect(canvas.getByText('G')).toBeInTheDocument();
    await expect(canvas.getByText('B')).toBeInTheDocument();
  }
}`,...s.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  render: function Render() {
    const [color, setColor] = useState('#ff5555');
    return <ColorPicker value={color} onChange={setColor} presets={['#ff5555', '#50fa7b', '#f1fa8c', '#bd93f9', '#ff79c6', '#8be9fd']} />;
  }
}`,...a.parameters?.docs?.source}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  render: function Render() {
    const [color, setColor] = useState('#0080ff');
    return <ColorPicker value={color} onChange={setColor} showPresets={false} />;
  }
}`,...c.parameters?.docs?.source}}};u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  render: function Render() {
    const [color, setColor] = useState('#7c6ff7');
    return <ColorPicker value={color} onChange={setColor} format="hsl" />;
  }
}`,...u.parameters?.docs?.source}}};const b=["Default","WithPresets","NoPresets","HSLFormat"];export{s as Default,u as HSLFormat,c as NoPresets,a as WithPresets,b as __namedExportsOrder,x as default};
