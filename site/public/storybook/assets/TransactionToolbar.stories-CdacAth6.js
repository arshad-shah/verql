import{B as t}from"./iframe-CdY22T7n.js";import{T as A}from"./ThemeProvider-DNYYmpnc.js";import"./Box-Bd47NzIT.js";import{F as d}from"./Flex-CE2f2iq4.js";import"./Stack--Ivib9E_.js";import"./Grid-C7p1bp0f.js";import"./Container-D0pENg5w.js";import"./Divider-CC5zJA6v.js";import"./Spacer-B6mR4OMa.js";import"./ScrollArea-DsVAjX50.js";import"./AspectRatio-PTPAY6Hu.js";import"./Card-UMTkYlih.js";import"./Panel-CrM5lnRj.js";import"./Modal-EvcNrSt5.js";import"./Sheet-Bui5TeLS.js";import"./Popover-ekmZQG1b.js";import"./Tooltip-DFQSTWFy.js";import"./DropdownMenu-DPcpRel2.js";import"./ContextMenu-BOut3BPG.js";import"./Accordion-BJdES6PL.js";import"./GradientSurface-C281tc_L.js";import{B as g}from"./Button-DVlKTRa-.js";import"./Input-DjpTQLBk.js";import"./Textarea-CzIEnTGU.js";import"./Label-gu33wJKO.js";import"./FormField-CgphHAJ9.js";import{S as I}from"./Select-CAB-yi5k.js";import"./Checkbox-DDEoxGC3.js";import"./Radio-B7PLoi94.js";import{S as b}from"./Switch-BBKi_QXD.js";import"./Slider-DFgVipQ_.js";import"./NumberInput-CxGbH90u.js";import"./SearchInput-CAJDyJI7.js";import"./PasswordInput-yqvteJ6H.js";import"./TagsInput-DUVVsLjJ.js";import"./DatePicker-BFX3pHnd.js";import"./ColorInput-jrVGPdr-.js";import"./ColorPicker-CTQREHAa.js";import"./FileContentInput-JQwPf_a6.js";import"./FilePathInput-BcZ3Lft3.js";import{B as R}from"./Badge-Dn_M9v_L.js";import"./BadgeIndicator-BlVGNMQr.js";import"./Tag-96dLrhkw.js";import"./Avatar-BtYeYK_B.js";import"./Skeleton-BIOO4slx.js";import"./EmptyState-lPmgnzUi.js";import"./KeyValue-a9TLj5lg.js";import"./Table-BjAIyt7e.js";import"./List-DZhZIDuR.js";import"./TreeItem-Dy-Qf4il.js";import"./CodeView-DwjwXYkg.js";import"./Toast-DFHqdqIU.js";import"./Alert-Dvw7u8hm.js";import"./Progress-BZJHEeVB.js";import"./Spinner-BZmpou-y.js";import"./Banner-B-2Lw8fl.js";import"./Tabs-DFrZiyUC.js";import"./Breadcrumb-Gq6pv0jV.js";import"./Link-BtAoe6Yk.js";import"./Pagination-k2D09rK0.js";import"./Text-u8VLJp0e.js";import"./Heading-BkWmjzHt.js";import"./Code-3CWmbko6.js";import"./KbdGroup-CVThv8mv.js";import"./VisuallyHidden-ZCvqR7kA.js";import"./index-kMnmcFYy.js";import"./ResizeHandle-BA8IuddH.js";import{u as k}from"./I18nProvider-QSPSpfHa.js";import"./preload-helper-PPVm8Dsz.js";import"./settings-Df4NhSNk.js";import"./ipc-CvYYIIIu.js";import"./react-CM93qTYy.js";import"./cn-DDt1maD9.js";import"./index-CqE97RaD.js";import"./floating-ui.react-BTPmBFa-.js";import"./chevron-down-D2vYOdxz.js";import"./createLucideIcon-CIh8D4qA.js";import"./chevron-right-BAbzGsgL.js";import"./check-BxkDBxqF.js";import"./x-CFCsdqrP.js";import"./chevron-left-XPJ7hgLI.js";import"./upload-CNDn8ix9.js";import"./shield-DDsFW79G.js";import"./useClipboard-D688GeTN.js";import"./toast-CRDfB1Gr.js";import"./info-xDV3YaJU.js";import"./triangle-alert-BmHsaBbn.js";import"./circle-check-CBnAbgkE.js";import"./arrow-down-sHqQ2fUb.js";import"./arrow-up-DGQOQQzZ.js";import"./index-Cf8GF5kW.js";import"./index-8X-GOh7L.js";function y({caps:e,txn:o,onToggleAutoCommit:x,onCommit:T,onRollback:C,onIsolationChange:v,onReadOnlyChange:f}){const{t:a}=k();if(!e?.autoCommit&&!e?.manualTransactions)return null;const h=e.transactionLabel??a("query.txn.transaction"),L=e.rollbackKind==="discard"?a("query.txn.discard"):a("query.txn.rollback"),n=o.status==="active",E=n?"warning":"default",O=n?a("query.txn.statusActive",{label:h}):o.autoCommit?a("query.txn.statusAutoCommit"):a("query.txn.statusIdle"),p=(e.isolationLevels??[]).map(r=>({value:r,label:r}));return t.jsxs(d,{direction:"row",align:"center",gap:"sm",className:"flex-wrap",children:[t.jsx(R,{variant:E,size:"sm",children:O}),e.autoCommit&&t.jsxs("label",{className:"flex items-center gap-1.5 cursor-pointer select-none",children:[t.jsx(b,{label:a("query.txn.autoCommit"),checked:o.autoCommit,onChange:r=>x(r.target.checked)}),t.jsx("span",{className:"text-xs text-text-secondary",children:a("query.txn.autoCommit")})]}),p.length>0&&t.jsx(I,{"aria-label":a("query.txn.isolationLevel"),value:o.isolationLevel??"",onChange:r=>v?.(r),options:p,size:"xs",className:"w-44",disabled:n}),e.readOnly&&t.jsxs("label",{className:"flex items-center gap-1.5 cursor-pointer select-none",children:[t.jsx(b,{label:a("query.txn.readOnly"),checked:o.readOnly,onChange:r=>f?.(r.target.checked),disabled:n}),t.jsx("span",{className:"text-xs text-text-secondary",children:a("query.txn.readOnly")})]}),e.manualTransactions&&t.jsxs(d,{direction:"row",align:"center",gap:"xs",children:[t.jsx(g,{variant:"outline",size:"xs",disabled:!n,onClick:T,className:"bg-success/10 text-success hover:bg-success/20 border-0 disabled:opacity-40",children:a("query.txn.commit")}),t.jsx(g,{variant:"outline",size:"xs",disabled:!n,onClick:C,className:"bg-error/10 text-error hover:bg-error/20 border-0 disabled:opacity-40",children:L})]})]})}y.__docgenInfo={description:"",methods:[],displayName:"TransactionToolbar",props:{caps:{required:!0,tsType:{name:"union",raw:"DriverCapabilities['session'] | undefined",elements:[{name:"DriverCapabilities['session']",raw:"DriverCapabilities['session']"},{name:"undefined"}]},description:""},txn:{required:!0,tsType:{name:"QueryTabTxnState"},description:""},onToggleAutoCommit:{required:!0,tsType:{name:"signature",type:"function",raw:"(enabled: boolean) => void",signature:{arguments:[{type:{name:"boolean"},name:"enabled"}],return:{name:"void"}}},description:""},onCommit:{required:!0,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:""},onRollback:{required:!0,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:""},onIsolationChange:{required:!1,tsType:{name:"signature",type:"function",raw:"(level: string) => void",signature:{arguments:[{type:{name:"string"},name:"level"}],return:{name:"void"}}},description:""},onReadOnlyChange:{required:!1,tsType:{name:"signature",type:"function",raw:"(readOnly: boolean) => void",signature:{arguments:[{type:{name:"boolean"},name:"readOnly"}],return:{name:"void"}}},description:""}}};const{fn:s}=__STORYBOOK_MODULE_TEST__,ga={title:"Components/Query/TransactionToolbar",component:y,decorators:[e=>t.jsx(A,{children:t.jsx("div",{className:"p-4 bg-bg-primary",children:t.jsx(e,{})})})],args:{onToggleAutoCommit:s(),onCommit:s(),onRollback:s(),onIsolationChange:s(),onReadOnlyChange:s()}},i={args:{caps:{autoCommit:!0,manualTransactions:!1},txn:{autoCommit:!0,status:"none",readOnly:!1}}},m={args:{caps:{autoCommit:!0,manualTransactions:!0,transactionLabel:"Transaction",rollbackKind:"full"},txn:{autoCommit:!1,status:"none",readOnly:!1}}},l={args:{caps:{autoCommit:!0,manualTransactions:!0,transactionLabel:"Transaction",rollbackKind:"full"},txn:{autoCommit:!1,status:"active",readOnly:!1}}},c={args:{caps:{autoCommit:!0,manualTransactions:!0,transactionLabel:"MULTI/EXEC",rollbackKind:"discard"},txn:{autoCommit:!1,status:"active",readOnly:!1}}},u={args:{caps:{autoCommit:!0,manualTransactions:!0,transactionLabel:"Transaction",rollbackKind:"full",isolationLevels:["READ COMMITTED","REPEATABLE READ","SERIALIZABLE"],readOnly:!0},txn:{autoCommit:!1,status:"active",isolationLevel:"SERIALIZABLE",readOnly:!0}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    caps: {
      autoCommit: true,
      manualTransactions: false
    },
    txn: {
      autoCommit: true,
      status: 'none',
      readOnly: false
    }
  }
}`,...i.parameters?.docs?.source},description:{story:`Driver only supports auto-commit toggle (e.g. a simple driver with no
manual transaction support). Shows the toggle and status badge only.`,...i.parameters?.docs?.description}}};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  args: {
    caps: {
      autoCommit: true,
      manualTransactions: true,
      transactionLabel: 'Transaction',
      rollbackKind: 'full'
    },
    txn: {
      autoCommit: false,
      status: 'none',
      readOnly: false
    }
  }
}`,...m.parameters?.docs?.source},description:{story:`Full transaction-capable driver (Postgres/MySQL style) with autoCommit
disabled and no active transaction — shows Commit/Rollback in disabled
state and "Idle" status badge.`,...m.parameters?.docs?.description}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    caps: {
      autoCommit: true,
      manualTransactions: true,
      transactionLabel: 'Transaction',
      rollbackKind: 'full'
    },
    txn: {
      autoCommit: false,
      status: 'active',
      readOnly: false
    }
  }
}`,...l.parameters?.docs?.source},description:{story:`Full transaction-capable driver with an active transaction — Commit and
Rollback buttons are enabled, status badge shows "Transaction active".`,...l.parameters?.docs?.description}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    caps: {
      autoCommit: true,
      manualTransactions: true,
      transactionLabel: 'MULTI/EXEC',
      rollbackKind: 'discard'
    },
    txn: {
      autoCommit: false,
      status: 'active',
      readOnly: false
    }
  }
}`,...c.parameters?.docs?.source},description:{story:`Redis-style driver using MULTI/EXEC semantics. The rollback button is
labelled "Discard" and the status badge reflects the MULTI/EXEC label.`,...c.parameters?.docs?.description}}};u.parameters={...u.parameters,docs:{...u.parameters?.docs,source:{originalSource:`{
  args: {
    caps: {
      autoCommit: true,
      manualTransactions: true,
      transactionLabel: 'Transaction',
      rollbackKind: 'full',
      isolationLevels: ['READ COMMITTED', 'REPEATABLE READ', 'SERIALIZABLE'],
      readOnly: true
    },
    txn: {
      autoCommit: false,
      status: 'active',
      isolationLevel: 'SERIALIZABLE',
      readOnly: true
    }
  }
}`,...u.parameters?.docs?.source},description:{story:`Postgres-style driver with isolation level selector and read-only toggle.
Transaction is active with SERIALIZABLE isolation in read-only mode.`,...u.parameters?.docs?.description}}};const ba=["AutoCommitOnly","FullTransactionIdle","FullTransactionActive","RedisStyle","WithIsolationAndReadOnly"];export{i as AutoCommitOnly,l as FullTransactionActive,m as FullTransactionIdle,c as RedisStyle,u as WithIsolationAndReadOnly,ba as __namedExportsOrder,ga as default};
