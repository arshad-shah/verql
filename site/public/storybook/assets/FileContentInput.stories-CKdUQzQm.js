import{B as a}from"./iframe-CdY22T7n.js";import{F as n}from"./FileContentInput-JQwPf_a6.js";import"./preload-helper-PPVm8Dsz.js";import"./index-CqE97RaD.js";import"./cn-DDt1maD9.js";import"./DropdownMenu-DPcpRel2.js";import"./floating-ui.react-BTPmBFa-.js";import"./index-kMnmcFYy.js";import"./index-Cf8GF5kW.js";import"./Textarea-CzIEnTGU.js";import"./ipc-CvYYIIIu.js";import"./createLucideIcon-CIh8D4qA.js";import"./chevron-down-D2vYOdxz.js";import"./upload-CNDn8ix9.js";import"./shield-DDsFW79G.js";import"./x-CFCsdqrP.js";const{fn:p,expect:t,userEvent:d}=__STORYBOOK_MODULE_TEST__,N={title:"Primitives/Forms/FileContentInput",component:n,decorators:[e=>a.jsx("div",{className:"w-80",children:a.jsx(e,{})})],argTypes:{size:{control:"select",options:["xs","sm","md","lg","xl"]},disabled:{control:"boolean"},defaultMode:{control:"select",options:["browse","paste"]}},args:{onChange:p()}},o={args:{size:"md",placeholder:"Paste your private key here..."},play:async({canvas:e})=>{await t(e.getByText("No file selected")).toBeInTheDocument(),await t(e.getByRole("button",{name:"Browse"})).toBeInTheDocument(),await t(e.getByRole("button",{name:"Input mode"})).toBeInTheDocument()}},s={args:{value:`-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5v
bmUAAAAEbm9uZQAAAAAAAAABAAAA
MwAAAAtzc2gtZWQyNTUxOQAAACDr
-----END OPENSSH PRIVATE KEY-----`,size:"md"},play:async({canvas:e})=>{await t(e.getByText("loaded")).toBeInTheDocument(),await t(e.getByText("Pasted content")).toBeInTheDocument(),await t(e.getByRole("button",{name:"Clear"})).toBeInTheDocument()}},r={args:{defaultMode:"paste",placeholder:"Paste your private key here...",size:"md"},play:async({args:e,canvas:m})=>{const l=m.getByRole("textbox");await t(l).toBeInTheDocument(),await d.type(l,"test content"),await t(e.onChange).toHaveBeenCalled()}},c={args:{disabled:!0,size:"md"},play:async({canvas:e})=>{await t(e.getByText("No file selected")).toBeInTheDocument()}},i={render:()=>a.jsxs("div",{className:"flex flex-col gap-3 w-80",children:[a.jsx(n,{size:"xs"}),a.jsx(n,{size:"sm"}),a.jsx(n,{size:"md"}),a.jsx(n,{size:"lg"}),a.jsx(n,{size:"xl"})]})};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    size: 'md',
    placeholder: 'Paste your private key here...'
  },
  play: async ({
    canvas
  }) => {
    await expect(canvas.getByText('No file selected')).toBeInTheDocument();
    await expect(canvas.getByRole('button', {
      name: 'Browse'
    })).toBeInTheDocument();
    await expect(canvas.getByRole('button', {
      name: 'Input mode'
    })).toBeInTheDocument();
  }
}`,...o.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    value: '-----BEGIN OPENSSH PRIVATE KEY-----\\nb3BlbnNzaC1rZXktdjEAAAAABG5v\\nbmUAAAAEbm9uZQAAAAAAAAABAAAA\\nMwAAAAtzc2gtZWQyNTUxOQAAACDr\\n-----END OPENSSH PRIVATE KEY-----',
    size: 'md'
  },
  play: async ({
    canvas
  }) => {
    await expect(canvas.getByText('loaded')).toBeInTheDocument();
    await expect(canvas.getByText('Pasted content')).toBeInTheDocument();
    await expect(canvas.getByRole('button', {
      name: 'Clear'
    })).toBeInTheDocument();
  }
}`,...s.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    defaultMode: 'paste',
    placeholder: 'Paste your private key here...',
    size: 'md'
  },
  play: async ({
    args,
    canvas
  }) => {
    // The paste mode header shows "Paste content" label
    const textarea = canvas.getByRole('textbox');
    await expect(textarea).toBeInTheDocument();
    await userEvent.type(textarea, 'test content');
    await expect(args.onChange).toHaveBeenCalled();
  }
}`,...r.parameters?.docs?.source}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    disabled: true,
    size: 'md'
  },
  play: async ({
    canvas
  }) => {
    await expect(canvas.getByText('No file selected')).toBeInTheDocument();
  }
}`,...c.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex flex-col gap-3 w-80">
      <FileContentInput size="xs" />
      <FileContentInput size="sm" />
      <FileContentInput size="md" />
      <FileContentInput size="lg" />
      <FileContentInput size="xl" />
    </div>
}`,...i.parameters?.docs?.source}}};const P=["Default","WithContent","PasteMode","Disabled","Sizes"];export{o as Default,c as Disabled,r as PasteMode,i as Sizes,s as WithContent,P as __namedExportsOrder,N as default};
