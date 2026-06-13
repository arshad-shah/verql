import{B as a}from"./iframe-CdY22T7n.js";import{T as r}from"./Tag-96dLrhkw.js";import"./preload-helper-PPVm8Dsz.js";import"./cn-DDt1maD9.js";import"./x-CFCsdqrP.js";import"./createLucideIcon-CIh8D4qA.js";const{fn:c,expect:p,userEvent:l}=__STORYBOOK_MODULE_TEST__,x={title:"Primitives/Data Display/Tag",component:r},e={args:{children:"postgresql"}},n=c(),t={render:()=>a.jsx("div",{style:{display:"flex",gap:6,flexWrap:"wrap"},children:["react","typescript","vite","tailwind"].map(s=>a.jsx(r,{onDismiss:n,children:s},s))}),play:async({canvas:s})=>{const i=l.setup(),o=s.getAllByRole("button",{name:"Remove"});await i.click(o[0]),await p(n).toHaveBeenCalled()}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  args: {
    children: 'postgresql'
  }
}`,...e.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap'
  }}>
      {['react', 'typescript', 'vite', 'tailwind'].map(tag => <Tag key={tag} onDismiss={onDismissTag}>
          {tag}
        </Tag>)}
    </div>,
  play: async ({
    canvas
  }) => {
    const user = userEvent.setup();
    const dismissButtons = canvas.getAllByRole('button', {
      name: 'Remove'
    });
    await user.click(dismissButtons[0]);
    await expect(onDismissTag).toHaveBeenCalled();
  }
}`,...t.parameters?.docs?.source}}};const D=["Default","WithDismiss"];export{e as Default,t as WithDismiss,D as __namedExportsOrder,x as default};
