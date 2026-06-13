import{B as n}from"./iframe-CdY22T7n.js";import{P as t}from"./Panel-CrM5lnRj.js";import"./preload-helper-PPVm8Dsz.js";import"./cn-DDt1maD9.js";const d={title:"Primitives/Surfaces/Panel",component:t},e={args:{children:n.jsx("div",{style:{padding:16,color:"var(--color-text-primary)",fontSize:13},children:"Panel content — used as a borderless surface container"}),style:{width:280}}},r={render:()=>n.jsx(t,{style:{width:200,height:300,display:"flex",flexDirection:"column"},children:["Tables","Views","Functions","Triggers"].map(o=>n.jsx("div",{style:{padding:"8px 12px",fontSize:13,color:"var(--color-text-secondary)",borderBottom:"1px solid var(--color-border-subtle)",cursor:"pointer"},children:o},o))})};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  args: {
    children: <div style={{
      padding: 16,
      color: 'var(--color-text-primary)',
      fontSize: 13
    }}>
        Panel content — used as a borderless surface container
      </div>,
    style: {
      width: 280
    }
  }
}`,...e.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: () => <Panel style={{
    width: 200,
    height: 300,
    display: 'flex',
    flexDirection: 'column'
  }}>
      {['Tables', 'Views', 'Functions', 'Triggers'].map(item => <div key={item} style={{
      padding: '8px 12px',
      fontSize: 13,
      color: 'var(--color-text-secondary)',
      borderBottom: '1px solid var(--color-border-subtle)',
      cursor: 'pointer'
    }}>
          {item}
        </div>)}
    </Panel>
}`,...r.parameters?.docs?.source}}};const c=["Default","Sidebar"];export{e as Default,r as Sidebar,c as __namedExportsOrder,d as default};
