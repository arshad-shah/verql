import{B as e,J as p}from"./iframe-CdY22T7n.js";import{T as a}from"./TreeItem-Dy-Qf4il.js";import{K as m,L as x}from"./link-pR3DmJnL.js";import{H as u}from"./hash-B34uKq7z.js";import{T as r}from"./table-2-BDbQiJoD.js";import{E as b}from"./eye-JPLtWa-Z.js";import"./preload-helper-PPVm8Dsz.js";import"./index-CqE97RaD.js";import"./cn-DDt1maD9.js";import"./chevron-down-D2vYOdxz.js";import"./createLucideIcon-CIh8D4qA.js";import"./chevron-right-BAbzGsgL.js";const{fn:g,expect:l,userEvent:n}=__STORYBOOK_MODULE_TEST__,R={title:"Primitives/Data Display/TreeItem",component:a};g();const s={render:function(){const[t,c]=p.useState(!0);return e.jsxs("div",{role:"tree","aria-label":"Database schema",style:{width:260,border:"1px solid var(--color-border-default)",borderRadius:8,padding:"4px 0",overflow:"hidden"},children:[e.jsxs(a,{label:"users",icon:e.jsx(r,{size:12,className:"text-accent"}),depth:0,expanded:t,onToggle:()=>c(!t),meta:"1.2k",children:[e.jsx(a,{label:"id",icon:e.jsx(m,{size:11,className:"text-warning"}),depth:1,meta:"integer"}),e.jsx(a,{label:"email",icon:e.jsx(u,{size:11,className:"text-text-muted"}),depth:1,meta:"varchar(255)"}),e.jsx(a,{label:"org_id",icon:e.jsx(x,{size:11,className:"text-info"}),depth:1,meta:"uuid"})]}),e.jsx(a,{label:"organizations",icon:e.jsx(r,{size:12,className:"text-accent"}),depth:0,expanded:!1,onToggle:()=>{},meta:"48"}),e.jsx(a,{label:"active_users",icon:e.jsx(b,{size:12,className:"text-info"}),depth:0,expanded:!1,onToggle:()=>{}})]})},play:async({canvas:i})=>{const t=i.getByRole("treeitem",{name:/^users/});await l(t).toHaveAttribute("aria-expanded","true"),await n.click(t),await l(t).toHaveAttribute("aria-expanded","false"),await n.click(t),await l(t).toHaveAttribute("aria-expanded","true")}},d={render:()=>e.jsxs("div",{role:"tree","aria-label":"Tables",style:{width:260,border:"1px solid var(--color-border-default)",borderRadius:8,padding:"4px 0",overflow:"hidden"},children:[e.jsx(a,{label:"users",icon:e.jsx(r,{size:12,className:"text-accent"}),depth:0,selected:!0,onToggle:()=>{}}),e.jsx(a,{label:"organizations",icon:e.jsx(r,{size:12,className:"text-accent"}),depth:0,onToggle:()=>{}}),e.jsx(a,{label:"sessions",icon:e.jsx(r,{size:12,className:"text-accent"}),depth:0,onToggle:()=>{}})]})},o={render:()=>e.jsx("div",{role:"tree","aria-label":"Nested items",style:{width:300,border:"1px solid var(--color-border-default)",borderRadius:8,padding:"4px 0",overflow:"hidden"},children:e.jsx(a,{label:"Level 0",depth:0,expanded:!0,onToggle:()=>{},children:e.jsx(a,{label:"Level 1",depth:1,expanded:!0,onToggle:()=>{},children:e.jsx(a,{label:"Level 2",depth:2,expanded:!0,onToggle:()=>{},children:e.jsx(a,{label:"Leaf at depth 3",depth:3})})})})})};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render: function Render() {
    const [expanded, setExpanded] = useState(true);
    return <div role="tree" aria-label="Database schema" style={{
      width: 260,
      border: '1px solid var(--color-border-default)',
      borderRadius: 8,
      padding: '4px 0',
      overflow: 'hidden'
    }}>
        <TreeItem label="users" icon={<Table2 size={12} className="text-accent" />} depth={0} expanded={expanded} onToggle={() => setExpanded(!expanded)} meta="1.2k">
          <TreeItem label="id" icon={<Key size={11} className="text-warning" />} depth={1} meta="integer" />
          <TreeItem label="email" icon={<Hash size={11} className="text-text-muted" />} depth={1} meta="varchar(255)" />
          <TreeItem label="org_id" icon={<Link size={11} className="text-info" />} depth={1} meta="uuid" />
        </TreeItem>
        <TreeItem label="organizations" icon={<Table2 size={12} className="text-accent" />} depth={0} expanded={false} onToggle={() => {}} meta="48" />
        <TreeItem label="active_users" icon={<Eye size={12} className="text-info" />} depth={0} expanded={false} onToggle={() => {}} />
      </div>;
  },
  play: async ({
    canvas
  }) => {
    const usersItem = canvas.getByRole('treeitem', {
      name: /^users/
    });
    await expect(usersItem).toHaveAttribute('aria-expanded', 'true');
    await userEvent.click(usersItem);
    await expect(usersItem).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(usersItem);
    await expect(usersItem).toHaveAttribute('aria-expanded', 'true');
  }
}`,...s.parameters?.docs?.source}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  render: () => <div role="tree" aria-label="Tables" style={{
    width: 260,
    border: '1px solid var(--color-border-default)',
    borderRadius: 8,
    padding: '4px 0',
    overflow: 'hidden'
  }}>
      <TreeItem label="users" icon={<Table2 size={12} className="text-accent" />} depth={0} selected onToggle={() => {}} />
      <TreeItem label="organizations" icon={<Table2 size={12} className="text-accent" />} depth={0} onToggle={() => {}} />
      <TreeItem label="sessions" icon={<Table2 size={12} className="text-accent" />} depth={0} onToggle={() => {}} />
    </div>
}`,...d.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: () => <div role="tree" aria-label="Nested items" style={{
    width: 300,
    border: '1px solid var(--color-border-default)',
    borderRadius: 8,
    padding: '4px 0',
    overflow: 'hidden'
  }}>
      <TreeItem label="Level 0" depth={0} expanded onToggle={() => {}}>
        <TreeItem label="Level 1" depth={1} expanded onToggle={() => {}}>
          <TreeItem label="Level 2" depth={2} expanded onToggle={() => {}}>
            <TreeItem label="Leaf at depth 3" depth={3} />
          </TreeItem>
        </TreeItem>
      </TreeItem>
    </div>
}`,...o.parameters?.docs?.source}}};const _=["Default","Selected","DeepNesting"];export{o as DeepNesting,s as Default,d as Selected,_ as __namedExportsOrder,R as default};
