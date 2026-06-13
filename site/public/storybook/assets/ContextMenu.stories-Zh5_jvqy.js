import{B as t}from"./iframe-CdY22T7n.js";import{C as s}from"./ContextMenu-BOut3BPG.js";import"./preload-helper-PPVm8Dsz.js";import"./index-CqE97RaD.js";import"./cn-DDt1maD9.js";const{expect:a,fn:e,userEvent:d}=__STORYBOOK_MODULE_TEST__,R={title:"Primitives/Surfaces/ContextMenu",component:s},m=e(),u=e(),y=e(),h=e(),l={render:()=>t.jsx(s,{items:[{label:"Open in new tab",onSelect:m},{label:"Copy path",onSelect:u},{label:"Rename",onSelect:y},{label:"Delete",onSelect:h}],children:t.jsx("div",{style:{width:280,height:120,border:"2px dashed var(--color-border-default)",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:"var(--color-text-secondary)",userSelect:"none"},children:"Right-click here to open context menu"})}),play:async({canvas:n})=>{const c=n.getByText("Right-click here to open context menu");await d.pointer({keys:"[MouseRight]",target:c});const o=n.getByRole("menuitem",{name:"Open in new tab"});await a(o).toBeVisible(),await d.click(o),await a(m).toHaveBeenCalledTimes(1)}},i={render:()=>t.jsx("div",{style:{display:"flex",gap:24},children:["sm","md","lg"].map(n=>t.jsx(s,{size:n,items:[{label:"Open in new tab",onSelect:e()},{label:"Copy path",onSelect:e()},{label:"Rename",onSelect:e()},{label:"Delete",onSelect:e()}],children:t.jsxs("div",{style:{width:200,height:100,border:"2px dashed var(--color-border-default)",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:"var(--color-text-secondary)",userSelect:"none"},children:['Right-click — size="',n,'"']})},n))})},r={render:()=>t.jsx(s,{items:[{label:"Open in new tab",onSelect:e()},{label:"Copy path",onSelect:e()},{label:"Rename",onSelect:e(),disabled:!0},{label:"Delete",onSelect:e(),disabled:!0}],children:t.jsx("div",{style:{width:280,height:120,border:"2px dashed var(--color-border-default)",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:"var(--color-text-secondary)",userSelect:"none"},children:"Right-click to see disabled items"})}),play:async({canvas:n})=>{const c=n.getByText("Right-click to see disabled items");await d.pointer({keys:"[MouseRight]",target:c});const o=n.getByRole("menuitem",{name:"Rename"});await a(o).toBeDisabled();const p=n.getByRole("menuitem",{name:"Delete"});await a(p).toBeDisabled();const b=n.getByRole("menuitem",{name:"Open in new tab"});await a(b).not.toBeDisabled()}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  render: () => <ContextMenu items={[{
    label: 'Open in new tab',
    onSelect: onOpenInNewTab
  }, {
    label: 'Copy path',
    onSelect: onCopyPath
  }, {
    label: 'Rename',
    onSelect: onRename
  }, {
    label: 'Delete',
    onSelect: onDelete
  }]}>
      <div style={{
      width: 280,
      height: 120,
      border: '2px dashed var(--color-border-default)',
      borderRadius: 8,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 13,
      color: 'var(--color-text-secondary)',
      userSelect: 'none'
    }}>
        Right-click here to open context menu
      </div>
    </ContextMenu>,
  play: async ({
    canvas
  }) => {
    const target = canvas.getByText('Right-click here to open context menu');
    await userEvent.pointer({
      keys: '[MouseRight]',
      target
    });
    const openInNewTab = canvas.getByRole('menuitem', {
      name: 'Open in new tab'
    });
    await expect(openInNewTab).toBeVisible();
    await userEvent.click(openInNewTab);
    await expect(onOpenInNewTab).toHaveBeenCalledTimes(1);
  }
}`,...l.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    gap: 24
  }}>
      {(['sm', 'md', 'lg'] as const).map(size => <ContextMenu key={size} size={size} items={[{
      label: 'Open in new tab',
      onSelect: fn()
    }, {
      label: 'Copy path',
      onSelect: fn()
    }, {
      label: 'Rename',
      onSelect: fn()
    }, {
      label: 'Delete',
      onSelect: fn()
    }]}>
          <div style={{
        width: 200,
        height: 100,
        border: '2px dashed var(--color-border-default)',
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 13,
        color: 'var(--color-text-secondary)',
        userSelect: 'none'
      }}>
            Right-click — size="{size}"
          </div>
        </ContextMenu>)}
    </div>
}`,...i.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: () => <ContextMenu items={[{
    label: 'Open in new tab',
    onSelect: fn()
  }, {
    label: 'Copy path',
    onSelect: fn()
  }, {
    label: 'Rename',
    onSelect: fn(),
    disabled: true
  }, {
    label: 'Delete',
    onSelect: fn(),
    disabled: true
  }]}>
      <div style={{
      width: 280,
      height: 120,
      border: '2px dashed var(--color-border-default)',
      borderRadius: 8,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 13,
      color: 'var(--color-text-secondary)',
      userSelect: 'none'
    }}>
        Right-click to see disabled items
      </div>
    </ContextMenu>,
  play: async ({
    canvas
  }) => {
    const target = canvas.getByText('Right-click to see disabled items');
    await userEvent.pointer({
      keys: '[MouseRight]',
      target
    });
    const renameItem = canvas.getByRole('menuitem', {
      name: 'Rename'
    });
    await expect(renameItem).toBeDisabled();
    const deleteItem = canvas.getByRole('menuitem', {
      name: 'Delete'
    });
    await expect(deleteItem).toBeDisabled();
    const openInNewTab = canvas.getByRole('menuitem', {
      name: 'Open in new tab'
    });
    await expect(openInNewTab).not.toBeDisabled();
  }
}`,...r.parameters?.docs?.source}}};const v=["Default","Sizes","WithDisabledItems"];export{l as Default,i as Sizes,r as WithDisabledItems,v as __namedExportsOrder,R as default};
