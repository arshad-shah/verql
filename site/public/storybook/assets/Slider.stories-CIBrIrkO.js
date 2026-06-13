import{B as a}from"./iframe-CdY22T7n.js";import{S as t}from"./Slider-DFgVipQ_.js";import"./preload-helper-PPVm8Dsz.js";import"./index-CqE97RaD.js";import"./cn-DDt1maD9.js";const{fn:o,expect:i}=__STORYBOOK_MODULE_TEST__,x={title:"Primitives/Forms/Slider",component:t,argTypes:{min:{control:"number"},max:{control:"number"},step:{control:"number"},disabled:{control:"boolean"}}},l={args:{min:0,max:100,defaultValue:40,"aria-label":"Volume",style:{width:240},onChange:o()},play:async({canvas:e})=>{const n=e.getByRole("slider");await i(n).toHaveValue("40"),await i(n).toBeEnabled()}},s={render:()=>a.jsx("div",{className:"flex flex-col gap-4",style:{width:240},children:["sm","md","lg"].map(e=>a.jsx(t,{size:e,min:0,max:100,defaultValue:50,"aria-label":`size ${e}`},e))})},r={render:()=>a.jsxs("div",{className:"flex flex-col gap-4",style:{width:240},children:[a.jsx(t,{min:0,max:100,defaultValue:40,"aria-label":"Active slider"}),a.jsx(t,{min:0,max:100,defaultValue:60,disabled:!0,"aria-label":"Disabled slider"})]})};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    min: 0,
    max: 100,
    defaultValue: 40,
    'aria-label': 'Volume',
    style: {
      width: 240
    },
    onChange: fn()
  },
  play: async ({
    canvas
  }) => {
    const slider = canvas.getByRole('slider');
    await expect(slider).toHaveValue('40');
    await expect(slider).toBeEnabled();
  }
}`,...l.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex flex-col gap-4" style={{
    width: 240
  }}>
      {(['sm', 'md', 'lg'] as const).map(size => <Slider key={size} size={size} min={0} max={100} defaultValue={50} aria-label={\`size \${size}\`} />)}
    </div>
}`,...s.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex flex-col gap-4" style={{
    width: 240
  }}>
      <Slider min={0} max={100} defaultValue={40} aria-label="Active slider" />
      <Slider min={0} max={100} defaultValue={60} disabled aria-label="Disabled slider" />
    </div>
}`,...r.parameters?.docs?.source}}};const f=["Default","Sizes","States"];export{l as Default,s as Sizes,r as States,f as __namedExportsOrder,x as default};
