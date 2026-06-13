import{J as s,B as e}from"./iframe-CdY22T7n.js";import{T as n}from"./Tabs-DFrZiyUC.js";import"./preload-helper-PPVm8Dsz.js";import"./index-CqE97RaD.js";import"./cn-DDt1maD9.js";const{fn:p,expect:b,userEvent:m}=__STORYBOOK_MODULE_TEST__,w={title:"Primitives/Navigation/Tabs",component:n,args:{onTabChange:p()}},d=[{id:"data",label:"Data"},{id:"schema",label:"Schema"},{id:"indexes",label:"Indexes"},{id:"constraints",label:"Constraints"}],g=[{id:"overview",label:"Overview"},{id:"settings",label:"Settings"}],u=[{id:"data",label:"Data"},{id:"schema",label:"Schema"},{id:"indexes",label:"Indexes"},{id:"constraints",label:"Constraints"},{id:"triggers",label:"Triggers"},{id:"policies",label:"Policies"},{id:"stats",label:"Statistics"}],o={render:function(){const[t,a]=s.useState("data");return e.jsxs("div",{style:{width:480},children:[e.jsx(n,{tabs:d,activeTab:t,onTabChange:a}),e.jsxs("div",{style:{padding:"12px 4px",fontSize:13,color:"var(--color-text-secondary)"},children:["Active tab: ",e.jsx("strong",{style:{color:"var(--color-text-primary)"},children:t})]})]})},play:async({canvas:i})=>{const t=i.getByRole("tab",{name:"Schema"});await m.click(t),await b(t).toHaveAttribute("aria-selected","true");const a=i.getByRole("tab",{name:"Indexes"});await m.click(a),await b(a).toHaveAttribute("aria-selected","true")}},r={render:function(){const[t,a]=s.useState("data"),[l,v]=s.useState("data"),[T,x]=s.useState("data");return e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:32,width:560},children:[e.jsxs("div",{children:[e.jsx("p",{style:{fontSize:12,marginBottom:8,color:"var(--color-text-secondary)"},children:"Small"}),e.jsx(n,{tabs:d,activeTab:t,onTabChange:a,size:"sm"})]}),e.jsxs("div",{children:[e.jsx("p",{style:{fontSize:12,marginBottom:8,color:"var(--color-text-secondary)"},children:"Medium (default)"}),e.jsx(n,{tabs:d,activeTab:l,onTabChange:v,size:"md"})]}),e.jsxs("div",{children:[e.jsx("p",{style:{fontSize:12,marginBottom:8,color:"var(--color-text-secondary)"},children:"Large"}),e.jsx(n,{tabs:d,activeTab:T,onTabChange:x,size:"lg"})]})]})}},c={render:function(){const[t,a]=s.useState("overview"),[l,v]=s.useState("data");return e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:32,width:560},children:[e.jsxs("div",{children:[e.jsx("p",{style:{fontSize:12,marginBottom:8,color:"var(--color-text-secondary)"},children:"Minimal (two tabs)"}),e.jsx(n,{tabs:g,activeTab:t,onTabChange:a})]}),e.jsxs("div",{children:[e.jsx("p",{style:{fontSize:12,marginBottom:8,color:"var(--color-text-secondary)"},children:"Many tabs (7) — overflow behavior"}),e.jsx(n,{tabs:u,activeTab:l,onTabChange:v})]})]})}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: function Render() {
    const [active, setActive] = useState('data');
    return <div style={{
      width: 480
    }}>
        <Tabs tabs={TABS} activeTab={active} onTabChange={setActive} />
        <div style={{
        padding: '12px 4px',
        fontSize: 13,
        color: 'var(--color-text-secondary)'
      }}>
          Active tab: <strong style={{
          color: 'var(--color-text-primary)'
        }}>{active}</strong>
        </div>
      </div>;
  },
  play: async ({
    canvas
  }) => {
    const schemaTab = canvas.getByRole('tab', {
      name: 'Schema'
    });
    await userEvent.click(schemaTab);
    await expect(schemaTab).toHaveAttribute('aria-selected', 'true');
    const indexesTab = canvas.getByRole('tab', {
      name: 'Indexes'
    });
    await userEvent.click(indexesTab);
    await expect(indexesTab).toHaveAttribute('aria-selected', 'true');
  }
}`,...o.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: function Render() {
    const [activeSm, setActiveSm] = useState('data');
    const [activeMd, setActiveMd] = useState('data');
    const [activeLg, setActiveLg] = useState('data');
    return <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 32,
      width: 560
    }}>
        <div>
          <p style={{
          fontSize: 12,
          marginBottom: 8,
          color: 'var(--color-text-secondary)'
        }}>Small</p>
          <Tabs tabs={TABS} activeTab={activeSm} onTabChange={setActiveSm} size="sm" />
        </div>
        <div>
          <p style={{
          fontSize: 12,
          marginBottom: 8,
          color: 'var(--color-text-secondary)'
        }}>Medium (default)</p>
          <Tabs tabs={TABS} activeTab={activeMd} onTabChange={setActiveMd} size="md" />
        </div>
        <div>
          <p style={{
          fontSize: 12,
          marginBottom: 8,
          color: 'var(--color-text-secondary)'
        }}>Large</p>
          <Tabs tabs={TABS} activeTab={activeLg} onTabChange={setActiveLg} size="lg" />
        </div>
      </div>;
  }
}`,...r.parameters?.docs?.source}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  render: function Render() {
    const [activeTwoTab, setActiveTwoTab] = useState('overview');
    const [activeManyTab, setActiveManyTab] = useState('data');
    return <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 32,
      width: 560
    }}>
        <div>
          <p style={{
          fontSize: 12,
          marginBottom: 8,
          color: 'var(--color-text-secondary)'
        }}>Minimal (two tabs)</p>
          <Tabs tabs={TWO_TABS} activeTab={activeTwoTab} onTabChange={setActiveTwoTab} />
        </div>

        <div>
          <p style={{
          fontSize: 12,
          marginBottom: 8,
          color: 'var(--color-text-secondary)'
        }}>Many tabs (7) — overflow behavior</p>
          <Tabs tabs={MANY_TABS} activeTab={activeManyTab} onTabChange={setActiveManyTab} />
        </div>
      </div>;
  }
}`,...c.parameters?.docs?.source}}};const B=["Default","Sizes","States"];export{o as Default,r as Sizes,c as States,B as __namedExportsOrder,w as default};
