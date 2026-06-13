import{B as e,J as c}from"./iframe-CdY22T7n.js";import{S as t}from"./SchemaGroup-BWeQcecI.js";import{u as i}from"./schema-DS6dFCac.js";import{T as l}from"./table-2-BDbQiJoD.js";import"./preload-helper-PPVm8Dsz.js";import"./useGroupExpanded-CzZgNY8Q.js";import"./GroupHeader-DAKp_UHa.js";import"./chevron-down-D2vYOdxz.js";import"./createLucideIcon-CIh8D4qA.js";import"./chevron-right-BAbzGsgL.js";import"./ipc-CvYYIIIu.js";import"./react-CM93qTYy.js";function d(r){c.useEffect(()=>{i.setState({filterText:r??""})},[r])}function a({label:r}){return e.jsx("div",{className:"text-xs py-0.5",style:{paddingLeft:48,color:"var(--color-text-secondary)"},children:r})}const E={title:"Components/Explorer/SchemaGroup",decorators:[r=>e.jsx("div",{style:{width:300,padding:"4px 0",background:"var(--color-bg-secondary)",border:"1px solid var(--color-border-default)",borderRadius:8},children:e.jsx(r,{})})]},s={render:()=>(d(""),e.jsxs(t,{storageKey:"sb:tables",label:"Tables",count:3,icon:e.jsx(l,{size:12,style:{color:"var(--color-accent)"}}),headerPaddingLeft:24,defaultExpanded:!0,children:[e.jsx(a,{label:"users"}),e.jsx(a,{label:"organizations"}),e.jsx(a,{label:"sessions"})]}))},o={render:()=>(d("user"),e.jsxs(t,{storageKey:"sb:tables-collapsed",label:"Tables",count:2,icon:e.jsx(l,{size:12,style:{color:"var(--color-accent)"}}),headerPaddingLeft:24,children:[e.jsx(a,{label:"users"}),e.jsx(a,{label:"user_sessions"})]}))};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render: () => {
    useFilter('');
    return <SchemaGroup storageKey="sb:tables" label="Tables" count={3} icon={<Table2 size={12} style={{
      color: 'var(--color-accent)'
    }} />} headerPaddingLeft={24} defaultExpanded>
        <Row label="users" />
        <Row label="organizations" />
        <Row label="sessions" />
      </SchemaGroup>;
  }
}`,...s.parameters?.docs?.source},description:{story:"A `SchemaGroup` wrapping child rows, expanded by default.",...s.parameters?.docs?.description}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: () => {
    useFilter('user');
    return <SchemaGroup storageKey="sb:tables-collapsed" label="Tables" count={2} icon={<Table2 size={12} style={{
      color: 'var(--color-accent)'
    }} />} headerPaddingLeft={24}>
        <Row label="users" />
        <Row label="user_sessions" />
      </SchemaGroup>;
  }
}`,...o.parameters?.docs?.source},description:{story:"With an active filter, the group force-expands regardless of its stored state.",...o.parameters?.docs?.description}}};const T=["TableGroupExpanded","FilteredAutoExpanded"];export{o as FilteredAutoExpanded,s as TableGroupExpanded,T as __namedExportsOrder,E as default};
