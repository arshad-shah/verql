import{B as e,J as d}from"./iframe-CdY22T7n.js";import{S as a,K as n,a as c}from"./SchemaObjectGroup-c4ckQp3T.js";import{u}from"./schema-DS6dFCac.js";import"./preload-helper-PPVm8Dsz.js";import"./createLucideIcon-CIh8D4qA.js";import"./HighlightedText-DraRHiop.js";import"./useGroupExpanded-CzZgNY8Q.js";import"./GroupHeader-DAKp_UHa.js";import"./chevron-down-D2vYOdxz.js";import"./chevron-right-BAbzGsgL.js";import"./ipc-CvYYIIIu.js";import"./react-CM93qTYy.js";function i(o){d.useEffect(()=>{u.setState({filterText:o??""})},[o])}const P={title:"Components/Explorer/SchemaObjectGroup",decorators:[o=>e.jsx("div",{style:{width:300,padding:"4px 0",background:"var(--color-bg-secondary)",border:"1px solid var(--color-border-default)",borderRadius:8},children:e.jsx(o,{})})]},l=[{key:"fn1",label:"user_count()",sub:"returns integer"},{key:"fn2",label:"send_invite(text, uuid)"},{key:"fn3",label:"refresh_mrr()",sub:"returns void"}],r={render:()=>(i(""),e.jsx(a,{storageKey:"sb:functions",label:"Functions",items:l,icon:e.jsx(c,{size:12,style:{color:"var(--color-info)"}}),headerPaddingLeft:24,itemPaddingLeft:48}))},t={render:()=>(i("user"),e.jsx(a,{storageKey:"sb:indexes",label:"Indexes",items:[{key:"i1",label:"users_pkey",sub:"on users"},{key:"i2",label:"users_email_idx",sub:"on users"}],icon:e.jsx(n,{size:12,style:{color:"var(--color-warning)"}}),headerPaddingLeft:24,itemPaddingLeft:48}))},s={render:()=>(i(""),e.jsx(a,{storageKey:"sb:empty",label:"Sequences",items:[],icon:e.jsx(n,{size:12,style:{color:"var(--color-text-tertiary)"}}),headerPaddingLeft:24,itemPaddingLeft:48}))};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: () => {
    useFilter('');
    return <SchemaObjectGroup storageKey="sb:functions" label="Functions" items={objectItems} icon={<FunctionSquare size={12} style={{
      color: 'var(--color-info)'
    }} />} headerPaddingLeft={24} itemPaddingLeft={48} />;
  }
}`,...r.parameters?.docs?.source},description:{story:"A `SchemaObjectGroup` of functions with secondary (sub) text.",...r.parameters?.docs?.description}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  render: () => {
    useFilter('user');
    return <SchemaObjectGroup storageKey="sb:indexes" label="Indexes" items={[{
      key: 'i1',
      label: 'users_pkey',
      sub: 'on users'
    }, {
      key: 'i2',
      label: 'users_email_idx',
      sub: 'on users'
    }]} icon={<KeySquare size={12} style={{
      color: 'var(--color-warning)'
    }} />} headerPaddingLeft={24} itemPaddingLeft={48} />;
  }
}`,...t.parameters?.docs?.source},description:{story:"With an active filter, groups force-expand and item labels are highlighted.",...t.parameters?.docs?.description}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render: () => {
    useFilter('');
    return <SchemaObjectGroup storageKey="sb:empty" label="Sequences" items={[]} icon={<KeySquare size={12} style={{
      color: 'var(--color-text-tertiary)'
    }} />} headerPaddingLeft={24} itemPaddingLeft={48} />;
  }
}`,...s.parameters?.docs?.source},description:{story:"Empty groups render nothing (items length is 0).",...s.parameters?.docs?.description}}};const _=["ObjectGroupCollapsed","FilteredAutoExpanded","Empty"];export{s as Empty,t as FilteredAutoExpanded,r as ObjectGroupCollapsed,_ as __namedExportsOrder,P as default};
