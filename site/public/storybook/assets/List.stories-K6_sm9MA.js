import{B as e}from"./iframe-CdY22T7n.js";import{L as s}from"./List-DZhZIDuR.js";import{T as l}from"./table-2-BDbQiJoD.js";import"./preload-helper-PPVm8Dsz.js";import"./index-CqE97RaD.js";import"./cn-DDt1maD9.js";import"./createLucideIcon-CIh8D4qA.js";const x={title:"Primitives/Data Display/List",component:s},o={render:()=>e.jsx("div",{style:{width:240,border:"1px solid var(--color-border-default)",borderRadius:8,overflow:"hidden"},children:e.jsx(s,{children:["Tables","Views","Indexes","Functions","Triggers","Sequences"].map(r=>e.jsx(s.Item,{style:{cursor:"pointer",borderBottom:"1px solid var(--color-border-subtle)"},children:r},r))})})},t={render:()=>e.jsx("div",{style:{display:"flex",gap:24},children:["sm","md","lg"].map(r=>e.jsx("div",{style:{width:200,border:"1px solid var(--color-border-default)",borderRadius:8,overflow:"hidden"},children:e.jsx(s,{children:["Tables","Views","Indexes"].map(i=>e.jsx(s.Item,{size:r,style:{borderBottom:"1px solid var(--color-border-subtle)"},children:i},i))})},r))})},d={render:()=>e.jsx("div",{style:{width:240,border:"1px solid var(--color-border-default)",borderRadius:8,overflow:"hidden"},children:e.jsx(s,{children:[{label:"users"},{label:"orders"},{label:"products"},{label:"categories"}].map(({label:r})=>e.jsxs(s.Item,{style:{display:"flex",alignItems:"center",gap:8,cursor:"pointer",borderBottom:"1px solid var(--color-border-subtle)"},children:[e.jsx(l,{size:14,className:"text-accent"}),r]},r))})})};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    width: 240,
    border: '1px solid var(--color-border-default)',
    borderRadius: 8,
    overflow: 'hidden'
  }}>
      <List>
        {['Tables', 'Views', 'Indexes', 'Functions', 'Triggers', 'Sequences'].map(item => <List.Item key={item} style={{
        cursor: 'pointer',
        borderBottom: '1px solid var(--color-border-subtle)'
      }}>
            {item}
          </List.Item>)}
      </List>
    </div>
}`,...o.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    gap: 24
  }}>
      {(['sm', 'md', 'lg'] as const).map(size => <div key={size} style={{
      width: 200,
      border: '1px solid var(--color-border-default)',
      borderRadius: 8,
      overflow: 'hidden'
    }}>
          <List>
            {['Tables', 'Views', 'Indexes'].map(item => <List.Item key={item} size={size} style={{
          borderBottom: '1px solid var(--color-border-subtle)'
        }}>
                {item}
              </List.Item>)}
          </List>
        </div>)}
    </div>
}`,...t.parameters?.docs?.source}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    width: 240,
    border: '1px solid var(--color-border-default)',
    borderRadius: 8,
    overflow: 'hidden'
  }}>
      <List>
        {[{
        label: 'users'
      }, {
        label: 'orders'
      }, {
        label: 'products'
      }, {
        label: 'categories'
      }].map(({
        label
      }) => <List.Item key={label} style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        cursor: 'pointer',
        borderBottom: '1px solid var(--color-border-subtle)'
      }}>
            <Table2 size={14} className="text-accent" />
            {label}
          </List.Item>)}
      </List>
    </div>
}`,...d.parameters?.docs?.source}}};const v=["Default","Sizes","WithIcons"];export{o as Default,t as Sizes,d as WithIcons,v as __namedExportsOrder,x as default};
