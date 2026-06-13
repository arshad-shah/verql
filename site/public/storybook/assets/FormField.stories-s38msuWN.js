import{B as t}from"./iframe-CdY22T7n.js";import{F as s}from"./FormField-CgphHAJ9.js";import{I as l}from"./Input-DjpTQLBk.js";import"./preload-helper-PPVm8Dsz.js";import"./Label-gu33wJKO.js";import"./index-CqE97RaD.js";import"./cn-DDt1maD9.js";const{expect:a,userEvent:c}=__STORYBOOK_MODULE_TEST__,b={title:"Primitives/Forms/FormField",component:s,argTypes:{label:{control:"text"},error:{control:"text"},hint:{control:"text"}}},o={args:{label:"Database host",hint:"Enter the hostname or IP address",children:t.jsx(l,{placeholder:"localhost"})},decorators:[e=>t.jsx("div",{style:{width:280},children:t.jsx(e,{})})],play:async({canvas:e})=>{const n=e.getByRole("textbox");await c.type(n,"db.example.com"),await a(n).toHaveValue("db.example.com");const i=e.getByText("Database host");await a(i).toBeInTheDocument(),await a(e.getByText("Enter the hostname or IP address")).toBeInTheDocument()}},r={render:()=>t.jsxs("div",{className:"flex flex-col gap-6",style:{width:280},children:[t.jsx(s,{label:"Port",error:"Port must be between 1 and 65535",children:t.jsx(l,{placeholder:"5432",error:!0})}),t.jsx(s,{label:"Notes",hint:"This field is optional",children:t.jsx(l,{placeholder:"Optional field"})})]}),play:async({canvas:e})=>{await a(e.getByText("Port must be between 1 and 65535")).toBeInTheDocument(),await a(e.getByText("This field is optional")).toBeInTheDocument()}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    label: 'Database host',
    hint: 'Enter the hostname or IP address',
    children: <Input placeholder="localhost" />
  },
  decorators: [Story => <div style={{
    width: 280
  }}><Story /></div>],
  play: async ({
    canvas
  }) => {
    const input = canvas.getByRole('textbox');
    await userEvent.type(input, 'db.example.com');
    await expect(input).toHaveValue('db.example.com');
    // Verify the label is associated with the input
    const label = canvas.getByText('Database host');
    await expect(label).toBeInTheDocument();
    // Verify hint is shown
    await expect(canvas.getByText('Enter the hostname or IP address')).toBeInTheDocument();
  }
}`,...o.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex flex-col gap-6" style={{
    width: 280
  }}>
      <FormField label="Port" error="Port must be between 1 and 65535">
        <Input placeholder="5432" error />
      </FormField>
      <FormField label="Notes" hint="This field is optional">
        <Input placeholder="Optional field" />
      </FormField>
    </div>,
  play: async ({
    canvas
  }) => {
    // Verify error message is shown
    await expect(canvas.getByText('Port must be between 1 and 65535')).toBeInTheDocument();
    // Verify hint is shown
    await expect(canvas.getByText('This field is optional')).toBeInTheDocument();
  }
}`,...r.parameters?.docs?.source}}};const w=["Default","States"];export{o as Default,r as States,w as __namedExportsOrder,b as default};
