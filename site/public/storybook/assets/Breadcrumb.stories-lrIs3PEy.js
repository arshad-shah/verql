import{B as s}from"./iframe-CdY22T7n.js";import{B as i}from"./Breadcrumb-Gq6pv0jV.js";import"./preload-helper-PPVm8Dsz.js";import"./index-CqE97RaD.js";import"./cn-DDt1maD9.js";const{fn:n,expect:c,userEvent:l}=__STORYBOOK_MODULE_TEST__,B={title:"Primitives/Navigation/Breadcrumb",component:i},r=n(),m=n(),b=n(),o={args:{items:[{label:"Connections",onClick:r},{label:"my-postgres",onClick:m},{label:"public",onClick:b},{label:"users"}]},play:async({canvas:e})=>{const p=e.getByRole("button",{name:"Connections"});await l.click(p),await c(r).toHaveBeenCalledTimes(1);const u=e.getByRole("button",{name:"my-postgres"});await l.click(u),await c(m).toHaveBeenCalledTimes(1)}},t={args:{items:[{label:"Connections",onClick:n()},{label:"my-db"}]}},a={render:()=>{const e=[{label:"Connections",onClick:n()},{label:"my-postgres",onClick:n()},{label:"public"}];return s.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:16},children:[s.jsx(i,{items:e,size:"sm"}),s.jsx(i,{items:e,size:"md"}),s.jsx(i,{items:e,size:"lg"})]})}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    items: [{
      label: 'Connections',
      onClick: onClickConnections
    }, {
      label: 'my-postgres',
      onClick: onClickMyPostgres
    }, {
      label: 'public',
      onClick: onClickPublic
    }, {
      label: 'users'
    }]
  },
  play: async ({
    canvas
  }) => {
    const connectionsBtn = canvas.getByRole('button', {
      name: 'Connections'
    });
    await userEvent.click(connectionsBtn);
    await expect(onClickConnections).toHaveBeenCalledTimes(1);
    const postgresBtn = canvas.getByRole('button', {
      name: 'my-postgres'
    });
    await userEvent.click(postgresBtn);
    await expect(onClickMyPostgres).toHaveBeenCalledTimes(1);
  }
}`,...o.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    items: [{
      label: 'Connections',
      onClick: fn()
    }, {
      label: 'my-db'
    }]
  }
}`,...t.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  render: () => {
    const items = [{
      label: 'Connections',
      onClick: fn()
    }, {
      label: 'my-postgres',
      onClick: fn()
    }, {
      label: 'public'
    }];
    return <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }}>
        <Breadcrumb items={items} size="sm" />
        <Breadcrumb items={items} size="md" />
        <Breadcrumb items={items} size="lg" />
      </div>;
  }
}`,...a.parameters?.docs?.source}}};const x=["Default","Short","Sizes"];export{o as Default,t as Short,a as Sizes,x as __namedExportsOrder,B as default};
