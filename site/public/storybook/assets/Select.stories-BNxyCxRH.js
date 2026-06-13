import{J as x,B as a}from"./iframe-CdY22T7n.js";import{S as d}from"./Select-CAB-yi5k.js";import"./preload-helper-PPVm8Dsz.js";import"./floating-ui.react-BTPmBFa-.js";import"./index-kMnmcFYy.js";import"./index-Cf8GF5kW.js";import"./index-CqE97RaD.js";import"./cn-DDt1maD9.js";import"./chevron-down-D2vYOdxz.js";import"./createLucideIcon-CIh8D4qA.js";import"./check-BxkDBxqF.js";const{fn:w,expect:r,userEvent:s,within:i}=__STORYBOOK_MODULE_TEST__,c=[{value:"postgresql",label:"PostgreSQL"},{value:"mysql",label:"MySQL"},{value:"sqlite",label:"SQLite"},{value:"mongodb",label:"MongoDB"}],C=[{label:"Relational",options:[{value:"postgresql",label:"PostgreSQL"},{value:"mysql",label:"MySQL"},{value:"sqlite",label:"SQLite"}]},{label:"NoSQL",options:[{value:"mongodb",label:"MongoDB"},{value:"redis",label:"Redis"}]}],j={title:"Primitives/Forms/Select",component:d,argTypes:{size:{control:"select",options:["xs","sm","md","lg","xl"]},disabled:{control:"boolean"}}},p={args:{size:"md",value:"",options:c,placeholder:"Choose a database…",onChange:w(),"aria-label":"Database type"},decorators:[e=>a.jsx("div",{style:{width:320},children:a.jsx(e,{})})],play:async({args:e,canvasElement:n})=>{const o=i(n).getByRole("combobox");await s.click(o);const l=await i(document.body).findByText("PostgreSQL");await s.click(l),await r(e.onChange).toHaveBeenCalledWith("postgresql")}},g={render:function(){const[n,t]=x.useState("mysql");return a.jsx("div",{style:{width:320},children:a.jsx(d,{options:c,value:n,onChange:t,"aria-label":"Database type"})})},play:async({canvasElement:e})=>{const t=i(e).getByRole("combobox");await r(t).toHaveTextContent("MySQL"),await s.click(t);const o=await i(document.body).findByText("SQLite");await s.click(o),await r(t).toHaveTextContent("SQLite")}},u={render:()=>a.jsx("div",{className:"flex flex-col gap-2",style:{width:320},children:["xs","sm","md","lg","xl"].map(e=>a.jsx(d,{size:e,options:c,value:"postgresql",onChange:()=>{},"aria-label":`Database type ${e}`},e))})},b={render:()=>a.jsxs("div",{className:"flex flex-col gap-2",style:{width:320},children:[a.jsx(d,{size:"md",options:c,value:"",placeholder:"Placeholder state",onChange:()=>{},"aria-label":"Placeholder select"}),a.jsx(d,{size:"md",options:c,value:"postgresql",onChange:()=>{},"aria-label":"Selected select"}),a.jsx(d,{size:"md",options:c,value:"postgresql",disabled:!0,onChange:()=>{},"aria-label":"Disabled select"})]})},m={args:{size:"md",options:[{value:"postgresql",label:"PostgreSQL"},{value:"mysql",label:"MySQL"},{value:"sqlite",label:"SQLite",disabled:!0},{value:"mongodb",label:"MongoDB"}],value:"",placeholder:"Choose a database…",onChange:w(),"aria-label":"Database type with disabled options"},decorators:[e=>a.jsx("div",{style:{width:320},children:a.jsx(e,{})})],play:async({canvasElement:e})=>{const t=i(e).getByRole("combobox");await s.click(t);const o=await i(document.body).findByText("SQLite");await r(o.closest('[role="option"]')).toHaveAttribute("aria-disabled","true")}},v={args:{size:"md",value:"",options:C,placeholder:"Choose a database…",onChange:w(),"aria-label":"Grouped database type"},decorators:[e=>a.jsx("div",{style:{width:320},children:a.jsx(e,{})})],play:async({args:e,canvasElement:n})=>{const o=i(n).getByRole("combobox");await s.click(o);const l=i(document.body);await r(l.getByText("Relational")).toBeInTheDocument(),await r(l.getByText("NoSQL")).toBeInTheDocument(),await s.click(l.getByText("Redis")),await r(e.onChange).toHaveBeenCalledWith("redis")}},y={args:{size:"md",value:"",options:c,onChange:w(),"aria-label":"Keyboard navigation test"},decorators:[e=>a.jsx("div",{style:{width:320},children:a.jsx(e,{})})],play:async({args:e,canvasElement:n})=>{const o=i(n).getByRole("combobox");await s.click(o),await s.keyboard("{ArrowDown}"),await s.keyboard("{ArrowDown}"),await s.keyboard("{Enter}"),await r(e.onChange).toHaveBeenCalledWith("sqlite")}},h={render:function(){const[n,t]=x.useState(""),o={postgresql:"#336791",mysql:"#4479A1",sqlite:"#003B57",mongodb:"#47A248"};return a.jsx("div",{style:{width:320},children:a.jsx(d,{size:"md",value:n,onChange:t,options:c,placeholder:"Choose a database\\u2026","aria-label":"Custom render database type",renderOption:(l,{selected:S})=>a.jsxs(a.Fragment,{children:[a.jsx("span",{className:"shrink-0 rounded-full",style:{width:8,height:8,backgroundColor:o[l.value]??"#888"}}),a.jsx("span",{className:"truncate flex-1",children:l.label}),S&&a.jsx("span",{className:"text-text-accent text-xs",children:"✓"})]}),renderValue:l=>l?a.jsxs("span",{className:"flex items-center gap-2 truncate",children:[a.jsx("span",{className:"shrink-0 rounded-full",style:{width:8,height:8,backgroundColor:o[l.value]??"#888"}}),l.label]}):void 0})})},play:async({canvasElement:e})=>{const t=i(e).getByRole("combobox");await s.click(t);const o=await i(document.body).findByText("PostgreSQL");await s.click(o),await r(t).toHaveTextContent("PostgreSQL")}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    size: 'md',
    value: '',
    options: dbOptions,
    placeholder: 'Choose a database\\u2026',
    onChange: fn(),
    'aria-label': 'Database type'
  },
  decorators: [Story => <div style={{
    width: 320
  }}>
        <Story />
      </div>],
  play: async ({
    args,
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox');
    await userEvent.click(trigger);
    const option = await within(document.body).findByText('PostgreSQL');
    await userEvent.click(option);
    await expect(args.onChange).toHaveBeenCalledWith('postgresql');
  }
}`,...p.parameters?.docs?.source}}};g.parameters={...g.parameters,docs:{...g.parameters?.docs,source:{originalSource:`{
  render: function Render() {
    const [value, setValue] = useState('mysql');
    return <div style={{
      width: 320
    }}>
        <Select options={dbOptions} value={value} onChange={setValue} aria-label="Database type" />
      </div>;
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox');
    await expect(trigger).toHaveTextContent('MySQL');
    await userEvent.click(trigger);
    const option = await within(document.body).findByText('SQLite');
    await userEvent.click(option);
    await expect(trigger).toHaveTextContent('SQLite');
  }
}`,...g.parameters?.docs?.source}}};u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex flex-col gap-2" style={{
    width: 320
  }}>
      {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map(size => <Select key={size} size={size} options={dbOptions} value="postgresql" onChange={() => {}} aria-label={\`Database type \${size}\`} />)}
    </div>
}`,...u.parameters?.docs?.source}}};b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex flex-col gap-2" style={{
    width: 320
  }}>
      <Select size="md" options={dbOptions} value="" placeholder="Placeholder state" onChange={() => {}} aria-label="Placeholder select" />
      <Select size="md" options={dbOptions} value="postgresql" onChange={() => {}} aria-label="Selected select" />
      <Select size="md" options={dbOptions} value="postgresql" disabled onChange={() => {}} aria-label="Disabled select" />
    </div>
}`,...b.parameters?.docs?.source}}};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  args: {
    size: 'md',
    options: [{
      value: 'postgresql',
      label: 'PostgreSQL'
    }, {
      value: 'mysql',
      label: 'MySQL'
    }, {
      value: 'sqlite',
      label: 'SQLite',
      disabled: true
    }, {
      value: 'mongodb',
      label: 'MongoDB'
    }],
    value: '',
    placeholder: 'Choose a database\\u2026',
    onChange: fn(),
    'aria-label': 'Database type with disabled options'
  },
  decorators: [Story => <div style={{
    width: 320
  }}>
        <Story />
      </div>],
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox');
    await userEvent.click(trigger);
    const disabledOption = await within(document.body).findByText('SQLite');
    await expect(disabledOption.closest('[role="option"]')).toHaveAttribute('aria-disabled', 'true');
  }
}`,...m.parameters?.docs?.source}}};v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  args: {
    size: 'md',
    value: '',
    options: groupedOptions,
    placeholder: 'Choose a database\\u2026',
    onChange: fn(),
    'aria-label': 'Grouped database type'
  },
  decorators: [Story => <div style={{
    width: 320
  }}>
        <Story />
      </div>],
  play: async ({
    args,
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox');
    await userEvent.click(trigger);
    const body = within(document.body);
    await expect(body.getByText('Relational')).toBeInTheDocument();
    await expect(body.getByText('NoSQL')).toBeInTheDocument();
    await userEvent.click(body.getByText('Redis'));
    await expect(args.onChange).toHaveBeenCalledWith('redis');
  }
}`,...v.parameters?.docs?.source}}};y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  args: {
    size: 'md',
    value: '',
    options: dbOptions,
    onChange: fn(),
    'aria-label': 'Keyboard navigation test'
  },
  decorators: [Story => <div style={{
    width: 320
  }}>
        <Story />
      </div>],
  play: async ({
    args,
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox');

    // Open dropdown with click
    await userEvent.click(trigger);

    // Navigate down twice (starts at first option) and select with Enter
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{Enter}');
    await expect(args.onChange).toHaveBeenCalledWith('sqlite');
  }
}`,...y.parameters?.docs?.source}}};h.parameters={...h.parameters,docs:{...h.parameters?.docs,source:{originalSource:`{
  render: function Render() {
    const [value, setValue] = useState('');
    const colorMap: Record<string, string> = {
      postgresql: '#336791',
      mysql: '#4479A1',
      sqlite: '#003B57',
      mongodb: '#47A248'
    };
    return <div style={{
      width: 320
    }}>
        <Select size="md" value={value} onChange={setValue} options={dbOptions} placeholder="Choose a database\\u2026" aria-label="Custom render database type" renderOption={(opt, {
        selected
      }) => <>
              <span className="shrink-0 rounded-full" style={{
          width: 8,
          height: 8,
          backgroundColor: colorMap[opt.value] ?? '#888'
        }} />
              <span className="truncate flex-1">{opt.label}</span>
              {selected && <span className="text-text-accent text-xs">&#10003;</span>}
            </>} renderValue={opt => opt ? <span className="flex items-center gap-2 truncate">
                <span className="shrink-0 rounded-full" style={{
          width: 8,
          height: 8,
          backgroundColor: colorMap[opt.value] ?? '#888'
        }} />
                {opt.label}
              </span> : undefined} />
      </div>;
  },
  play: async ({
    canvasElement
  }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('combobox');
    await userEvent.click(trigger);
    const option = await within(document.body).findByText('PostgreSQL');
    await userEvent.click(option);
    await expect(trigger).toHaveTextContent('PostgreSQL');
  }
}`,...h.parameters?.docs?.source}}};const z=["Default","WithValue","Sizes","States","DisabledOptions","Grouped","KeyboardNavigation","CustomRenderOption"];export{h as CustomRenderOption,p as Default,m as DisabledOptions,v as Grouped,y as KeyboardNavigation,u as Sizes,b as States,g as WithValue,z as __namedExportsOrder,j as default};
