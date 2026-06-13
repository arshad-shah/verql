import{B as e}from"./iframe-CdY22T7n.js";import{E as c}from"./EmptyState-lPmgnzUi.js";import{B as l}from"./Button-DVlKTRa-.js";import{D as d}from"./database-C1sk09jk.js";import"./preload-helper-PPVm8Dsz.js";import"./index-CqE97RaD.js";import"./cn-DDt1maD9.js";import"./createLucideIcon-CIh8D4qA.js";const{fn:p,expect:o,userEvent:u}=__STORYBOOK_MODULE_TEST__,i=p(),h={title:"Primitives/Data Display/EmptyState",component:c,decorators:[t=>e.jsx("div",{style:{width:480},children:e.jsx(t,{})})],argTypes:{title:{control:"text"},description:{control:"text"}}},a={args:{title:"No tables found",description:"Create your first table to get started.",icon:e.jsx(d,{size:32,className:"text-text-muted"}),action:e.jsx(l,{size:"sm",onClick:i,children:"Create table"})},play:async({canvas:t})=>{await o(t.getByText("No tables found")).toBeInTheDocument(),await o(t.getByText("Create your first table to get started.")).toBeInTheDocument();const m=t.getByRole("button",{name:"Create table"});await u.click(m),await o(i).toHaveBeenCalledOnce()}},n={args:{title:"No results"},play:async({canvas:t})=>{await o(t.getByText("No results")).toBeInTheDocument()}},s={render:()=>e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:16},children:["sm","md","lg"].map(t=>e.jsx("div",{style:{border:"1px solid var(--color-border-default)",borderRadius:8},children:e.jsx(c,{size:t,title:`Size: ${t}`,description:"Vertical density follows the size prop.",icon:e.jsx(d,{size:32,className:"text-text-muted"})})},t))})},r={args:{title:"No connections",description:"Connect to a database to explore your data.",action:e.jsx(l,{children:"Add connection"})},play:async({canvas:t})=>{await o(t.getByText("No connections")).toBeInTheDocument(),await o(t.getByRole("button",{name:"Add connection"})).toBeInTheDocument()}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    title: 'No tables found',
    description: 'Create your first table to get started.',
    icon: <Database size={32} className="text-text-muted" />,
    action: <Button size="sm" onClick={onAction}>Create table</Button>
  },
  play: async ({
    canvas
  }) => {
    await expect(canvas.getByText('No tables found')).toBeInTheDocument();
    await expect(canvas.getByText('Create your first table to get started.')).toBeInTheDocument();
    const button = canvas.getByRole('button', {
      name: 'Create table'
    });
    await userEvent.click(button);
    await expect(onAction).toHaveBeenCalledOnce();
  }
}`,...a.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  args: {
    title: 'No results'
  },
  play: async ({
    canvas
  }) => {
    await expect(canvas.getByText('No results')).toBeInTheDocument();
  }
}`,...n.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: 16
  }}>
      {(['sm', 'md', 'lg'] as const).map(size => <div key={size} style={{
      border: '1px solid var(--color-border-default)',
      borderRadius: 8
    }}>
          <EmptyState size={size} title={\`Size: \${size}\`} description="Vertical density follows the size prop." icon={<Database size={32} className="text-text-muted" />} />
        </div>)}
    </div>
}`,...s.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    title: 'No connections',
    description: 'Connect to a database to explore your data.',
    action: <Button>Add connection</Button>
  },
  play: async ({
    canvas
  }) => {
    await expect(canvas.getByText('No connections')).toBeInTheDocument();
    await expect(canvas.getByRole('button', {
      name: 'Add connection'
    })).toBeInTheDocument();
  }
}`,...r.parameters?.docs?.source}}};const v=["Default","States","Sizes","WithAction"];export{a as Default,s as Sizes,n as States,r as WithAction,v as __namedExportsOrder,h as default};
