import{J as l,B as e}from"./iframe-CdY22T7n.js";import{P as a}from"./Pagination-k2D09rK0.js";import"./preload-helper-PPVm8Dsz.js";import"./index-CqE97RaD.js";import"./cn-DDt1maD9.js";import"./chevron-left-XPJ7hgLI.js";import"./createLucideIcon-CIh8D4qA.js";import"./chevron-right-BAbzGsgL.js";const{fn:n,expect:c,userEvent:p}=__STORYBOOK_MODULE_TEST__,d=n(),S={title:"Primitives/Navigation/Pagination",component:a,argTypes:{page:{control:"number"},totalPages:{control:"number"}},args:{onPageChange:d}},o={render:()=>{const[t,r]=l.useState(1);return e.jsxs("div",{style:{display:"flex",flexDirection:"column",alignItems:"center",gap:12},children:[e.jsx(a,{page:t,totalPages:10,onPageChange:r}),e.jsxs("div",{style:{fontSize:12,color:"var(--color-text-secondary)"},children:["Showing page ",t," of 10"]})]})},play:async({canvas:t})=>{const r=t.getByRole("button",{name:"Next page"});await p.click(r);const g=t.getByRole("button",{name:"Previous page"});await c(g).not.toBeDisabled()}},i={render:()=>e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:16},children:[e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:11,color:"var(--color-text-secondary)",marginBottom:6},children:"First page"}),e.jsx(a,{page:1,totalPages:5,onPageChange:n(),"aria-label":"First page pagination"})]}),e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:11,color:"var(--color-text-secondary)",marginBottom:6},children:"Last page"}),e.jsx(a,{page:5,totalPages:5,onPageChange:n(),"aria-label":"Last page pagination"})]})]})},s={render:()=>e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:16},children:[e.jsx(a,{page:2,totalPages:5,onPageChange:n(),size:"sm","aria-label":"Small pagination"}),e.jsx(a,{page:2,totalPages:5,onPageChange:n(),size:"md","aria-label":"Medium pagination"}),e.jsx(a,{page:2,totalPages:5,onPageChange:n(),size:"lg","aria-label":"Large pagination"})]})};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: () => {
    const [page, setPage] = useState(1);
    return <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 12
    }}>
        <Pagination page={page} totalPages={10} onPageChange={setPage} />
        <div style={{
        fontSize: 12,
        color: 'var(--color-text-secondary)'
      }}>
          Showing page {page} of 10
        </div>
      </div>;
  },
  play: async ({
    canvas
  }) => {
    const nextBtn = canvas.getByRole('button', {
      name: 'Next page'
    });
    await userEvent.click(nextBtn);
    // State-driven render: page advances to 2, next button still enabled
    const prevBtn = canvas.getByRole('button', {
      name: 'Previous page'
    });
    await expect(prevBtn).not.toBeDisabled();
  }
}`,...o.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: 16
  }}>
      <div>
        <div style={{
        fontSize: 11,
        color: 'var(--color-text-secondary)',
        marginBottom: 6
      }}>First page</div>
        <Pagination page={1} totalPages={5} onPageChange={fn()} aria-label="First page pagination" />
      </div>
      <div>
        <div style={{
        fontSize: 11,
        color: 'var(--color-text-secondary)',
        marginBottom: 6
      }}>Last page</div>
        <Pagination page={5} totalPages={5} onPageChange={fn()} aria-label="Last page pagination" />
      </div>
    </div>
}`,...i.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: 16
  }}>
      <Pagination page={2} totalPages={5} onPageChange={fn()} size="sm" aria-label="Small pagination" />
      <Pagination page={2} totalPages={5} onPageChange={fn()} size="md" aria-label="Medium pagination" />
      <Pagination page={2} totalPages={5} onPageChange={fn()} size="lg" aria-label="Large pagination" />
    </div>
}`,...s.parameters?.docs?.source}}};const b=["Default","States","Sizes"];export{o as Default,s as Sizes,i as States,b as __namedExportsOrder,S as default};
