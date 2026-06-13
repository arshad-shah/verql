import{B as r}from"./iframe-CdY22T7n.js";import{C as c}from"./Code-3CWmbko6.js";import"./preload-helper-PPVm8Dsz.js";import"./cn-DDt1maD9.js";const{expect:t}=__STORYBOOK_MODULE_TEST__,d={title:"Primitives/Typography/Code",component:c,argTypes:{block:{control:"boolean"}}},o={args:{block:!1,children:'console.log("hello")'},play:async({canvas:e})=>{const s=e.getByText('console.log("hello")');await t(s).toBeInTheDocument(),await t(s.tagName).toBe("CODE")}},n={args:{block:!0,children:"function greet(name: string) {\n  return `Hello, ${name}!`\n}"},play:async({canvas:e})=>{await t(e.getByText(/function greet/)).toBeInTheDocument()}},a={render:()=>r.jsxs("p",{style:{color:"var(--color-text-primary)",fontSize:14,lineHeight:1.6},children:["Call ",r.jsx(c,{children:"document.getElementById()"})," to select an element, or use ",r.jsx(c,{children:"querySelector()"})," for CSS selectors."]}),play:async({canvas:e})=>{await t(e.getByText("document.getElementById()")).toBeInTheDocument(),await t(e.getByText("querySelector()")).toBeInTheDocument()}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    block: false,
    children: 'console.log("hello")'
  },
  play: async ({
    canvas
  }) => {
    const code = canvas.getByText('console.log("hello")');
    await expect(code).toBeInTheDocument();
    await expect(code.tagName).toBe('CODE');
  }
}`,...o.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  args: {
    block: true,
    children: \`function greet(name: string) {\\n  return \\\`Hello, \\\${name}!\\\`\\n}\`
  },
  play: async ({
    canvas
  }) => {
    await expect(canvas.getByText(/function greet/)).toBeInTheDocument();
  }
}`,...n.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  render: () => <p style={{
    color: 'var(--color-text-primary)',
    fontSize: 14,
    lineHeight: 1.6
  }}>
      Call <Code>document.getElementById()</Code> to select an element, or use <Code>querySelector()</Code> for CSS selectors.
    </p>,
  play: async ({
    canvas
  }) => {
    await expect(canvas.getByText('document.getElementById()')).toBeInTheDocument();
    await expect(canvas.getByText('querySelector()')).toBeInTheDocument();
  }
}`,...a.parameters?.docs?.source}}};const u=["Default","Block","InContext"];export{n as Block,o as Default,a as InContext,u as __namedExportsOrder,d as default};
