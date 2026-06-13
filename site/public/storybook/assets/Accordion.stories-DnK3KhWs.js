import{B as e}from"./iframe-CdY22T7n.js";import{A as o}from"./Accordion-BJdES6PL.js";import{B as d}from"./Badge-Dn_M9v_L.js";import{P as i}from"./plus-CAnyLFIc.js";import"./preload-helper-PPVm8Dsz.js";import"./index-CqE97RaD.js";import"./cn-DDt1maD9.js";import"./chevron-down-D2vYOdxz.js";import"./createLucideIcon-CIh8D4qA.js";import"./chevron-right-BAbzGsgL.js";const u={title:"Primitives/Surfaces/Accordion",component:o},r={render:()=>e.jsx("div",{style:{width:280,border:"1px solid var(--color-border-default)",borderRadius:8,overflow:"hidden"},children:e.jsxs(o,{children:[e.jsxs(o.Item,{defaultOpen:!0,children:[e.jsxs(o.Trigger,{children:[e.jsx("span",{style:{flex:1,textTransform:"uppercase",letterSpacing:"0.05em",color:"var(--color-text-muted)"},children:"Connections"}),e.jsx(d,{size:"sm",children:"3"}),e.jsx(o.Actions,{children:e.jsx("button",{"aria-label":"Add connection",style:{background:"none",border:"none",color:"var(--color-text-muted)",cursor:"pointer",padding:2},children:e.jsx(i,{size:12})})})]}),e.jsx(o.Content,{children:e.jsx("div",{style:{padding:"4px 8px",fontSize:12,color:"var(--color-text-secondary)"},children:"Connection items would go here"})})]}),e.jsxs(o.Item,{children:[e.jsxs(o.Trigger,{children:[e.jsx("span",{style:{flex:1,textTransform:"uppercase",letterSpacing:"0.05em",color:"var(--color-text-muted)"},children:"Tables"}),e.jsx(d,{size:"sm",children:"12"})]}),e.jsx(o.Content,{children:e.jsx("div",{style:{padding:"4px 8px",fontSize:12,color:"var(--color-text-secondary)"},children:"Table items would go here"})})]}),e.jsxs(o.Item,{children:[e.jsxs(o.Trigger,{children:[e.jsx("span",{style:{flex:1,textTransform:"uppercase",letterSpacing:"0.05em",color:"var(--color-text-muted)"},children:"Views"}),e.jsx(d,{size:"sm",children:"2"})]}),e.jsx(o.Content,{children:e.jsx("div",{style:{padding:"4px 8px",fontSize:12,color:"var(--color-text-secondary)"},children:"View items would go here"})})]})]})})},t={render:()=>e.jsxs("div",{style:{display:"flex",gap:32},children:[e.jsxs("div",{style:{width:240},children:[e.jsx("p",{style:{fontSize:12,marginBottom:8,color:"var(--color-text-secondary)"},children:"Size: sm (default)"}),e.jsx("div",{style:{border:"1px solid var(--color-border-default)",borderRadius:8,overflow:"hidden"},children:e.jsx(o,{size:"sm",children:e.jsxs(o.Item,{defaultOpen:!0,children:[e.jsx(o.Trigger,{children:"Small Section"}),e.jsx(o.Content,{children:e.jsx("div",{style:{padding:"4px 8px",fontSize:12,color:"var(--color-text-secondary)"},children:"Content"})})]})})})]}),e.jsxs("div",{style:{width:280},children:[e.jsx("p",{style:{fontSize:12,marginBottom:8,color:"var(--color-text-secondary)"},children:"Size: md"}),e.jsx("div",{style:{border:"1px solid var(--color-border-default)",borderRadius:8,overflow:"hidden"},children:e.jsx(o,{size:"md",children:e.jsxs(o.Item,{defaultOpen:!0,children:[e.jsx(o.Trigger,{children:"Medium Section"}),e.jsx(o.Content,{children:e.jsx("div",{style:{padding:"8px 12px",fontSize:13,color:"var(--color-text-secondary)"},children:"Content"})})]})})})]})]})};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    width: 280,
    border: '1px solid var(--color-border-default)',
    borderRadius: 8,
    overflow: 'hidden'
  }}>
      <Accordion>
        <Accordion.Item defaultOpen>
          <Accordion.Trigger>
            <span style={{
            flex: 1,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--color-text-muted)'
          }}>Connections</span>
            <Badge size="sm">3</Badge>
            <Accordion.Actions>
              <button aria-label="Add connection" style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              padding: 2
            }}>
                <Plus size={12} />
              </button>
            </Accordion.Actions>
          </Accordion.Trigger>
          <Accordion.Content>
            <div style={{
            padding: '4px 8px',
            fontSize: 12,
            color: 'var(--color-text-secondary)'
          }}>
              Connection items would go here
            </div>
          </Accordion.Content>
        </Accordion.Item>
        <Accordion.Item>
          <Accordion.Trigger>
            <span style={{
            flex: 1,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--color-text-muted)'
          }}>Tables</span>
            <Badge size="sm">12</Badge>
          </Accordion.Trigger>
          <Accordion.Content>
            <div style={{
            padding: '4px 8px',
            fontSize: 12,
            color: 'var(--color-text-secondary)'
          }}>
              Table items would go here
            </div>
          </Accordion.Content>
        </Accordion.Item>
        <Accordion.Item>
          <Accordion.Trigger>
            <span style={{
            flex: 1,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--color-text-muted)'
          }}>Views</span>
            <Badge size="sm">2</Badge>
          </Accordion.Trigger>
          <Accordion.Content>
            <div style={{
            padding: '4px 8px',
            fontSize: 12,
            color: 'var(--color-text-secondary)'
          }}>
              View items would go here
            </div>
          </Accordion.Content>
        </Accordion.Item>
      </Accordion>
    </div>
}`,...r.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    gap: 32
  }}>
      <div style={{
      width: 240
    }}>
        <p style={{
        fontSize: 12,
        marginBottom: 8,
        color: 'var(--color-text-secondary)'
      }}>Size: sm (default)</p>
        <div style={{
        border: '1px solid var(--color-border-default)',
        borderRadius: 8,
        overflow: 'hidden'
      }}>
          <Accordion size="sm">
            <Accordion.Item defaultOpen>
              <Accordion.Trigger>Small Section</Accordion.Trigger>
              <Accordion.Content>
                <div style={{
                padding: '4px 8px',
                fontSize: 12,
                color: 'var(--color-text-secondary)'
              }}>Content</div>
              </Accordion.Content>
            </Accordion.Item>
          </Accordion>
        </div>
      </div>
      <div style={{
      width: 280
    }}>
        <p style={{
        fontSize: 12,
        marginBottom: 8,
        color: 'var(--color-text-secondary)'
      }}>Size: md</p>
        <div style={{
        border: '1px solid var(--color-border-default)',
        borderRadius: 8,
        overflow: 'hidden'
      }}>
          <Accordion size="md">
            <Accordion.Item defaultOpen>
              <Accordion.Trigger>Medium Section</Accordion.Trigger>
              <Accordion.Content>
                <div style={{
                padding: '8px 12px',
                fontSize: 13,
                color: 'var(--color-text-secondary)'
              }}>Content</div>
              </Accordion.Content>
            </Accordion.Item>
          </Accordion>
        </div>
      </div>
    </div>
}`,...t.parameters?.docs?.source}}};const h=["Default","Sizes"];export{r as Default,t as Sizes,h as __namedExportsOrder,u as default};
