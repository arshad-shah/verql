import{J as f,B as g}from"./iframe-CdY22T7n.js";import{T as y}from"./TableNode-Bru-dLfV.js";import{u as w}from"./schema-DS6dFCac.js";import{u as C}from"./ui-D4eVvrGh.js";import{a as x}from"./connections-DUId3Rta.js";import"./preload-helper-PPVm8Dsz.js";import"./ContextMenu-BOut3BPG.js";import"./index-CqE97RaD.js";import"./cn-DDt1maD9.js";import"./ColumnRow-kbPWTT2T.js";import"./useClipboard-D688GeTN.js";import"./toast-CRDfB1Gr.js";import"./ipc-CvYYIIIu.js";import"./react-CM93qTYy.js";import"./I18nProvider-QSPSpfHa.js";import"./index-8X-GOh7L.js";import"./settings-Df4NhSNk.js";import"./useDataNouns-CYpckCOG.js";import"./driver-capabilities-BByz55u6.js";import"./data-nouns-BDP8SmCF.js";import"./link-pR3DmJnL.js";import"./createLucideIcon-CIh8D4qA.js";import"./hash-B34uKq7z.js";import"./HighlightedText-DraRHiop.js";import"./Button-DVlKTRa-.js";import"./Tooltip-DFQSTWFy.js";import"./floating-ui.react-BTPmBFa-.js";import"./index-kMnmcFYy.js";import"./index-Cf8GF5kW.js";import"./external-link-Bx6J9E1D.js";import"./play-CZ8FQLPo.js";import"./download-DjV-ZsBY.js";import"./tabs-C7I9_q2c.js";import"./selection-CNDBGd8q.js";import"./initial-autocommit-U4zp3Q6E.js";import"./plugin-ui-9V3NCBVr.js";import"./format-CHIMByc-.js";import"./table-2-BDbQiJoD.js";import"./chevron-down-D2vYOdxz.js";import"./chevron-right-BAbzGsgL.js";import"./notifications-CxwpcP25.js";const n="mock-conn",d="public",h=[{name:"id",dataType:"bigint",nullable:!1,defaultValue:"nextval(...)",isPrimaryKey:!0,isForeignKey:!1},{name:"org_id",dataType:"uuid",nullable:!1,defaultValue:null,isPrimaryKey:!1,isForeignKey:!0,references:{table:"organizations",column:"id"}},{name:"email",dataType:"varchar(255)",nullable:!1,defaultValue:null,isPrimaryKey:!1,isForeignKey:!1},{name:"created_at",dataType:"timestamptz",nullable:!1,defaultValue:"now()",isPrimaryKey:!1,isForeignKey:!1}],S=[{name:"users_pkey",columns:["id"],unique:!0},{name:"users_email_idx",columns:["email"],unique:!0}];function b({table:s="users",expanded:c=!1,rowCount:i,withColumns:l=!0,withIndexes:u=!0,highlightQuery:p}){return f.useEffect(()=>{window.electronAPI={invoke:async()=>[],on:()=>()=>{}};const m=`${n}:${d}:${s}`;x.setState({activeConnectionId:n,connections:[]}),C.setState({expandedTreeNodes:new Set(c?[`table:${n}:${d}:${s}`]:[])}),w.setState({columns:new Map(l?[[m,h]]:[]),indexes:new Map(u?[[m,S]]:[]),rowCounts:new Map(i!==void 0?[[m,i]]:[]),filterText:p??""})},[s,c,i,l,u,p]),g.jsx("div",{style:{width:320,background:"var(--color-bg-secondary)",padding:4},children:g.jsx(y,{tableName:s,connectionId:n,schema:d,depth:0,highlightQuery:p,onExportTable:()=>{}})})}const de={title:"Components/Explorer/TableNode",component:b},e={args:{rowCount:12438}},r={args:{table:"events",rowCount:2104882}},o={args:{expanded:!0,rowCount:12438}},t={args:{expanded:!0,rowCount:12438,withColumns:!1}},a={args:{rowCount:412,highlightQuery:"usr"}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  args: {
    rowCount: 12_438
  }
}`,...e.parameters?.docs?.source},description:{story:"Collapsed row with a formatted row-count.",...e.parameters?.docs?.description}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    table: 'events',
    rowCount: 2_104_882
  }
}`,...r.parameters?.docs?.source},description:{story:'Collapsed with a large row-count (rendered as "2.1M").',...r.parameters?.docs?.description}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    expanded: true,
    rowCount: 12_438
  }
}`,...o.parameters?.docs?.source},description:{story:"Expanded into a card: stat pills + the column list.",...o.parameters?.docs?.description}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    expanded: true,
    rowCount: 12_438,
    withColumns: false
  }
}`,...t.parameters?.docs?.source},description:{story:"Expanded while columns are still loading.",...t.parameters?.docs?.description}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    rowCount: 412,
    highlightQuery: 'usr'
  }
}`,...a.parameters?.docs?.source},description:{story:"Collapsed row with a search highlight on the name.",...a.parameters?.docs?.description}}};const ce=["Collapsed","CollapsedLargeCount","Expanded","ExpandedLoading","Highlighted"];export{e as Collapsed,r as CollapsedLargeCount,o as Expanded,t as ExpandedLoading,a as Highlighted,ce as __namedExportsOrder,de as default};
