import{B as e}from"./iframe-CdY22T7n.js";import{L as n}from"./Link-BtAoe6Yk.js";import"./preload-helper-PPVm8Dsz.js";import"./index-CqE97RaD.js";import"./cn-DDt1maD9.js";const{fn:l,expect:d,userEvent:m}=__STORYBOOK_MODULE_TEST__,h={title:"Primitives/Navigation/Link",component:n,argTypes:{href:{control:"text"},children:{control:"text"}},args:{onClick:l()}},r={args:{href:"#",children:"View documentation"},play:async({args:o,canvas:s})=>{const a=s.getByRole("link",{name:"View documentation"});a.addEventListener("click",c=>c.preventDefault(),{once:!0}),await m.click(a),await d(o.onClick).toHaveBeenCalledTimes(1)}},i={render:()=>e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:12},children:[e.jsx(n,{href:"#",size:"sm",children:"Small link"}),e.jsx(n,{href:"#",size:"md",children:"Medium link (default)"}),e.jsx(n,{href:"#",size:"lg",children:"Large link"})]})},t={render:()=>e.jsxs("p",{style:{fontSize:13,color:"var(--color-text-primary)",lineHeight:1.6},children:["Connect to your database by adding a"," ",e.jsx(n,{href:"#",children:"new connection"})," ","or importing from a"," ",e.jsx(n,{href:"#",children:"connection string"}),"."]})};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    href: '#',
    children: 'View documentation'
  },
  play: async ({
    args,
    canvas
  }) => {
    const link = canvas.getByRole('link', {
      name: 'View documentation'
    });
    link.addEventListener('click', e => e.preventDefault(), {
      once: true
    });
    await userEvent.click(link);
    await expect(args.onClick).toHaveBeenCalledTimes(1);
  }
}`,...r.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: 12
  }}>
      <Link href="#" size="sm">Small link</Link>
      <Link href="#" size="md">Medium link (default)</Link>
      <Link href="#" size="lg">Large link</Link>
    </div>
}`,...i.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  render: () => <p style={{
    fontSize: 13,
    color: 'var(--color-text-primary)',
    lineHeight: 1.6
  }}>
      Connect to your database by adding a{' '}
      <Link href="#">new connection</Link>
      {' '}or importing from a{' '}
      <Link href="#">connection string</Link>.
    </p>
}`,...t.parameters?.docs?.source}}};const x=["Default","Sizes","InContext"];export{r as Default,t as InContext,i as Sizes,x as __namedExportsOrder,h as default};
