import{B as s,J as a}from"./iframe-CdY22T7n.js";import{A as p}from"./ActionZone-DHfEyBJv.js";import{u as m}from"./ai-CvrNmzOO.js";import"./preload-helper-PPVm8Dsz.js";import"./ApprovalCard-c04ttdVL.js";import"./Text-u8VLJp0e.js";import"./index-CqE97RaD.js";import"./cn-DDt1maD9.js";import"./Button-DVlKTRa-.js";import"./I18nProvider-QSPSpfHa.js";import"./index-8X-GOh7L.js";import"./settings-Df4NhSNk.js";import"./ipc-CvYYIIIu.js";import"./react-CM93qTYy.js";import"./PermissionModeRow-wtFafLto.js";import"./Flex-CE2f2iq4.js";import"./shield-DDsFW79G.js";import"./createLucideIcon-CIh8D4qA.js";import"./eye-JPLtWa-Z.js";import"./zap-DNul0GQD.js";import"./ChatInput-DcNnlHxw.js";import"./connections-DUId3Rta.js";import"./notifications-CxwpcP25.js";import"./toast-CRDfB1Gr.js";import"./schema-DS6dFCac.js";import"./tabs-C7I9_q2c.js";import"./selection-CNDBGd8q.js";import"./ui-D4eVvrGh.js";import"./driver-capabilities-BByz55u6.js";import"./Card-UMTkYlih.js";import"./SchemaAutocomplete-N4cW1zyr.js";import"./ModelPicker-BWrVDTSU.js";import"./ScrollArea-DsVAjX50.js";import"./useClickOutside-iKaz7lvc.js";import"./chevron-down-D2vYOdxz.js";import"./square-SnO96Uuy.js";import"./arrow-up-DGQOQQzZ.js";import"./db-error-BYObUJyz.js";import"./data-nouns-BDP8SmCF.js";import"./notify-error-vjblLAFU.js";import"./registry-D16PU4cN.js";function n(){window.electronAPI={invoke:async()=>{},on:()=>()=>{}}}function i(r){return function(){return a.useEffect(()=>{n(),m.setState({pendingApproval:r.pendingApproval??null,permissionProfile:r.permissionProfile??"ask-write"})},[]),s.jsx(p,{})}}const Y={title:"Components/AI/ActionZone",component:p,decorators:[r=>s.jsx("div",{style:{width:380,background:"var(--color-bg-primary)"},children:s.jsx(r,{})})]},e={render:i({})},o={render:i({pendingApproval:{requestId:"req-1",toolName:"execute_query",toolDescription:"Execute a SQL query against the database",parameters:{sql:"DELETE FROM orders WHERE status = 'cancelled';"},display:"DELETE FROM orders WHERE status = 'cancelled';"}})},t={render:i({permissionProfile:"auto"})};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  render: seed({})
}`,...e.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: seed({
    pendingApproval: {
      requestId: 'req-1',
      toolName: 'execute_query',
      toolDescription: 'Execute a SQL query against the database',
      parameters: {
        sql: 'DELETE FROM orders WHERE status = \\'cancelled\\';'
      },
      display: "DELETE FROM orders WHERE status = 'cancelled';"
    }
  })
}`,...o.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  render: seed({
    permissionProfile: 'auto'
  })
}`,...t.parameters?.docs?.source}}};const $=["Composer","WithPendingApproval","AutoMode"];export{t as AutoMode,e as Composer,o as WithPendingApproval,$ as __namedExportsOrder,Y as default};
