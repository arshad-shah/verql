import{B as o}from"./iframe-CdY22T7n.js";import{S as a}from"./SettingLabel-7ew2r1vH.js";import"./preload-helper-PPVm8Dsz.js";import"./Flex-CE2f2iq4.js";import"./cn-DDt1maD9.js";import"./Text-u8VLJp0e.js";import"./index-CqE97RaD.js";const u={title:"Components/Settings/SettingLabel",component:a,decorators:[t=>o.jsx("div",{style:{width:360},children:o.jsx(t,{})})]},e={args:{label:"Restore tabs on startup",description:"Reopen the query tabs you had open when you last closed Verql."}},r={args:{label:"Confirm before running destructive queries"}},s={args:{label:"Maximum history items",description:"The number of recorded query runs Verql keeps before the oldest entries are pruned from your local history database."}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  args: {
    label: 'Restore tabs on startup',
    description: 'Reopen the query tabs you had open when you last closed Verql.'
  }
}`,...e.parameters?.docs?.source},description:{story:"Label with a supporting description — the common case.",...e.parameters?.docs?.description}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    label: 'Confirm before running destructive queries'
  }
}`,...r.parameters?.docs?.source},description:{story:"Label only — used when the control speaks for itself.",...r.parameters?.docs?.description}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    label: 'Maximum history items',
    description: 'The number of recorded query runs Verql keeps before the oldest entries are pruned from your local history database.'
  }
}`,...s.parameters?.docs?.source},description:{story:"Long description that wraps within the constrained row width.",...s.parameters?.docs?.description}}};const h=["WithDescription","LabelOnly","LongDescription"];export{r as LabelOnly,s as LongDescription,e as WithDescription,h as __namedExportsOrder,u as default};
