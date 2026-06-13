import{B as e}from"./iframe-CdY22T7n.js";import{T as c,u as d}from"./ThemeProvider-DNYYmpnc.js";import"./preload-helper-PPVm8Dsz.js";import"./settings-Df4NhSNk.js";import"./ipc-CvYYIIIu.js";import"./react-CM93qTYy.js";const{expect:s,userEvent:l}=__STORYBOOK_MODULE_TEST__;function p(){const{theme:t,setTheme:o,themes:i}=d();return e.jsxs("div",{style:{padding:24,background:"var(--color-bg-primary)",border:"1px solid var(--color-border)",borderRadius:12,display:"flex",flexDirection:"column",gap:16,minWidth:340},children:[e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:8},children:[e.jsx("span",{style:{fontSize:13,color:"var(--color-text-secondary)"},children:"Current theme:"}),e.jsx("span",{"data-testid":"current-theme",style:{fontSize:13,fontWeight:700,color:"var(--color-text-primary)",textTransform:"capitalize"},children:t})]}),e.jsx("div",{style:{display:"flex",flexWrap:"wrap",gap:8},children:i.map(r=>e.jsx("button",{type:"button",onClick:()=>o(r),style:{padding:"6px 14px",borderRadius:6,border:t===r?"2px solid var(--color-accent)":"1px solid var(--color-border)",background:t===r?"var(--color-bg-elevated)":"var(--color-bg-secondary)",color:t===r?"var(--color-text-primary)":"var(--color-text-secondary)",fontSize:12,fontWeight:t===r?600:400,cursor:"pointer",textTransform:"capitalize"},children:r},r))}),e.jsxs("div",{style:{padding:"10px 14px",background:"var(--color-bg-secondary)",borderRadius:8,fontSize:12,color:"var(--color-text-secondary)"},children:["Theme tokens update automatically via the ",e.jsx("code",{children:"data-theme"})," attribute."]})]})}const y={title:"Primitives/Theme/ThemeProvider",component:c,decorators:[t=>e.jsx(c,{children:e.jsx(t,{})})]},n={render:()=>e.jsx(p,{}),play:async({canvas:t})=>{const o=t.getByTestId("current-theme");await s(o).toBeInTheDocument();const i=t.getByRole("button",{name:/^light$/i});await l.click(i),await s(o).toHaveTextContent("light");const r=t.getByRole("button",{name:/^midnight$/i});await l.click(r),await s(o).toHaveTextContent("midnight")}},a={render:()=>e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:12},children:[e.jsx("p",{style:{fontSize:12,color:"var(--color-text-secondary)",margin:0},children:"Each panel below is wrapped in its own ThemeProvider instance."}),["dark","light","midnight","dracula","nord","solarized","catppuccin"].map(t=>e.jsx(c,{children:e.jsxs("div",{"data-theme":t,style:{display:"flex",alignItems:"center",gap:12,padding:"10px 16px",background:"var(--color-bg-secondary)",border:"1px solid var(--color-border)",borderRadius:8},children:[e.jsx("span",{style:{fontSize:12,fontWeight:600,color:"var(--color-text-primary)",width:90,textTransform:"capitalize"},children:t}),e.jsx("div",{style:{width:16,height:16,borderRadius:"50%",background:"var(--color-accent)",border:"2px solid var(--color-border)"}}),e.jsx("span",{style:{fontSize:12,color:"var(--color-text-secondary)"},children:"accent · bg · text tokens"})]})},t))]})};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  render: () => <ThemeDemo />,
  play: async ({
    canvas
  }) => {
    // Initial theme label is visible
    const themeLabel = canvas.getByTestId('current-theme');
    await expect(themeLabel).toBeInTheDocument();

    // Click the "light" button and verify the displayed theme updates
    const lightButton = canvas.getByRole('button', {
      name: /^light$/i
    });
    await userEvent.click(lightButton);
    await expect(themeLabel).toHaveTextContent('light');

    // Switch to "midnight" and verify
    const midnightButton = canvas.getByRole('button', {
      name: /^midnight$/i
    });
    await userEvent.click(midnightButton);
    await expect(themeLabel).toHaveTextContent('midnight');
  }
}`,...n.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: 12
  }}>
      <p style={{
      fontSize: 12,
      color: 'var(--color-text-secondary)',
      margin: 0
    }}>
        Each panel below is wrapped in its own ThemeProvider instance.
      </p>
      {(['dark', 'light', 'midnight', 'dracula', 'nord', 'solarized', 'catppuccin'] as const).map(t => <ThemeProvider key={t}>
            <div data-theme={t} style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 16px',
        background: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
        borderRadius: 8
      }}>
              <span style={{
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--color-text-primary)',
          width: 90,
          textTransform: 'capitalize'
        }}>
                {t}
              </span>
              <div style={{
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: 'var(--color-accent)',
          border: '2px solid var(--color-border)'
        }} />
              <span style={{
          fontSize: 12,
          color: 'var(--color-text-secondary)'
        }}>
                accent · bg · text tokens
              </span>
            </div>
          </ThemeProvider>)}
    </div>
}`,...a.parameters?.docs?.source}}};const b=["Default","AllThemes"];export{a as AllThemes,n as Default,b as __namedExportsOrder,y as default};
