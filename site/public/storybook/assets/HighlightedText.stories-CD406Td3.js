import{B as s}from"./iframe-CdY22T7n.js";import{H as n}from"./HighlightedText-DraRHiop.js";import"./preload-helper-PPVm8Dsz.js";const d={title:"Components/Explorer/HighlightedText",component:n,decorators:[a=>s.jsx("div",{style:{fontSize:13,color:"var(--color-text-primary)"},children:s.jsx(a,{})})]},r={args:{text:"organizations",query:""}},e={args:{text:"organizations",query:"org"}},t={args:{text:"organizations",query:"oqn"}},o={args:{text:"organizations",query:"xyz"}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    text: 'organizations',
    query: ''
  }
}`,...r.parameters?.docs?.source},description:{story:"No query — falls back to plain, unmarked text.",...r.parameters?.docs?.description}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  args: {
    text: 'organizations',
    query: 'org'
  }
}`,...e.parameters?.docs?.source},description:{story:"A contiguous substring match.",...e.parameters?.docs?.description}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    text: 'organizations',
    query: 'oqn'
  }
}`,...t.parameters?.docs?.source},description:{story:"A scattered fuzzy match — non-adjacent characters get marked.",...t.parameters?.docs?.description}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    text: 'organizations',
    query: 'xyz'
  }
}`,...o.parameters?.docs?.source},description:{story:"Query that doesn't match — renders plain text (no marks).",...o.parameters?.docs?.description}}};const m=["NoQuery","Contiguous","Fuzzy","NoMatch"];export{e as Contiguous,t as Fuzzy,o as NoMatch,r as NoQuery,m as __namedExportsOrder,d as default};
