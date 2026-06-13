import{B as t}from"./iframe-CdY22T7n.js";import{D as s}from"./DropdownMenu-DPcpRel2.js";import{B as i}from"./Button-DVlKTRa-.js";import{C as r}from"./chevron-down-D2vYOdxz.js";import"./preload-helper-PPVm8Dsz.js";import"./floating-ui.react-BTPmBFa-.js";import"./index-kMnmcFYy.js";import"./index-Cf8GF5kW.js";import"./index-CqE97RaD.js";import"./cn-DDt1maD9.js";import"./createLucideIcon-CIh8D4qA.js";const{fn:e,expect:p,userEvent:u,screen:b}=__STORYBOOK_MODULE_TEST__,R={title:"Primitives/Surfaces/DropdownMenu",component:s},d=e(),S=e(),D=e(),v=e(),n={render:()=>t.jsx(s,{trigger:t.jsxs(i,{variant:"outline",children:["Actions ",t.jsx(r,{size:12,className:"inline"})]}),items:[{label:"Edit table",onSelect:d},{label:"Duplicate",onSelect:S},{label:"Export as CSV",onSelect:D},{label:"Delete",onSelect:v,disabled:!1}]}),play:async({canvas:a})=>{const c=u.setup();await c.click(a.getByRole("button",{name:/actions/i}));const m=await b.findByText("Edit table");await c.click(m),await p(d).toHaveBeenCalled()}},x=e(),g=e(),E=e(),o={render:()=>t.jsx("div",{style:{display:"flex",gap:16},children:["sm","md","lg"].map(a=>t.jsx(s,{size:a,trigger:t.jsxs(i,{variant:"outline",children:['size="',a,'" ',t.jsx(r,{size:12,className:"inline"})]}),items:[{label:"Edit table",onSelect:e()},{label:"Duplicate",onSelect:e()},{label:"Export as CSV",onSelect:e()},{label:"Delete",onSelect:e()}]},a))})},l={render:()=>t.jsx(s,{trigger:t.jsxs(i,{variant:"outline",children:["Options ",t.jsx(r,{size:12,className:"inline"})]}),items:[{label:"Rename",onSelect:x},{label:"Move (unavailable)",onSelect:g,disabled:!0},{label:"Delete",onSelect:E}]})};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  render: () => <DropdownMenu trigger={<Button variant="outline">Actions <ChevronDown size={12} className="inline" /></Button>} items={[{
    label: 'Edit table',
    onSelect: onEditTable
  }, {
    label: 'Duplicate',
    onSelect: onDuplicate
  }, {
    label: 'Export as CSV',
    onSelect: onExport
  }, {
    label: 'Delete',
    onSelect: onDelete,
    disabled: false
  }]} />,
  play: async ({
    canvas
  }) => {
    const user = userEvent.setup();
    await user.click(canvas.getByRole('button', {
      name: /actions/i
    }));
    // The menu renders in a FloatingPortal (document.body), so query via screen
    // rather than the story canvas.
    const editItem = await screen.findByText('Edit table');
    await user.click(editItem);
    await expect(onEditTable).toHaveBeenCalled();
  }
}`,...n.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    gap: 16
  }}>
      {(['sm', 'md', 'lg'] as const).map(size => <DropdownMenu key={size} size={size} trigger={<Button variant="outline">size="{size}" <ChevronDown size={12} className="inline" /></Button>} items={[{
      label: 'Edit table',
      onSelect: fn()
    }, {
      label: 'Duplicate',
      onSelect: fn()
    }, {
      label: 'Export as CSV',
      onSelect: fn()
    }, {
      label: 'Delete',
      onSelect: fn()
    }]} />)}
    </div>
}`,...o.parameters?.docs?.source}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  render: () => <DropdownMenu trigger={<Button variant="outline">Options <ChevronDown size={12} className="inline" /></Button>} items={[{
    label: 'Rename',
    onSelect: onRename
  }, {
    label: 'Move (unavailable)',
    onSelect: onMove,
    disabled: true
  }, {
    label: 'Delete',
    onSelect: onDeleteOption
  }]} />
}`,...l.parameters?.docs?.source}}};const _=["Default","Sizes","States"];export{n as Default,o as Sizes,l as States,_ as __namedExportsOrder,R as default};
