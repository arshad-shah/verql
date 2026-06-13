import{B as r}from"./iframe-CdY22T7n.js";import"./ThemeProvider-DNYYmpnc.js";import{a}from"./cn-DDt1maD9.js";import{B as c}from"./Box-Bd47NzIT.js";import{F as b}from"./Flex-CE2f2iq4.js";import"./Stack--Ivib9E_.js";import"./Grid-C7p1bp0f.js";import"./Container-D0pENg5w.js";import"./Divider-CC5zJA6v.js";import"./Spacer-B6mR4OMa.js";import"./ScrollArea-DsVAjX50.js";import"./AspectRatio-PTPAY6Hu.js";import"./Card-UMTkYlih.js";import"./Panel-CrM5lnRj.js";import"./Modal-EvcNrSt5.js";import"./Sheet-Bui5TeLS.js";import"./Popover-ekmZQG1b.js";import"./Tooltip-DFQSTWFy.js";import"./DropdownMenu-DPcpRel2.js";import"./ContextMenu-BOut3BPG.js";import"./Accordion-BJdES6PL.js";import"./GradientSurface-C281tc_L.js";import{B as w}from"./Button-DVlKTRa-.js";import"./Input-DjpTQLBk.js";import"./Textarea-CzIEnTGU.js";import"./Label-gu33wJKO.js";import"./FormField-CgphHAJ9.js";import"./Select-CAB-yi5k.js";import"./Checkbox-DDEoxGC3.js";import"./Radio-B7PLoi94.js";import"./Switch-BBKi_QXD.js";import"./Slider-DFgVipQ_.js";import"./NumberInput-CxGbH90u.js";import"./SearchInput-CAJDyJI7.js";import"./PasswordInput-yqvteJ6H.js";import"./TagsInput-DUVVsLjJ.js";import"./DatePicker-BFX3pHnd.js";import"./ColorInput-jrVGPdr-.js";import"./ColorPicker-CTQREHAa.js";import"./FileContentInput-JQwPf_a6.js";import"./FilePathInput-BcZ3Lft3.js";import"./Badge-Dn_M9v_L.js";import"./BadgeIndicator-BlVGNMQr.js";import"./Tag-96dLrhkw.js";import"./Avatar-BtYeYK_B.js";import"./Skeleton-BIOO4slx.js";import"./EmptyState-lPmgnzUi.js";import"./KeyValue-a9TLj5lg.js";import"./Table-BjAIyt7e.js";import"./List-DZhZIDuR.js";import"./TreeItem-Dy-Qf4il.js";import"./CodeView-DwjwXYkg.js";import"./Toast-DFHqdqIU.js";import"./Alert-Dvw7u8hm.js";import"./Progress-BZJHEeVB.js";import"./Spinner-BZmpou-y.js";import"./Banner-B-2Lw8fl.js";import"./Tabs-DFrZiyUC.js";import"./Breadcrumb-Gq6pv0jV.js";import"./Link-BtAoe6Yk.js";import"./Pagination-k2D09rK0.js";import{T as d}from"./Text-u8VLJp0e.js";import"./Heading-BkWmjzHt.js";import"./Code-3CWmbko6.js";import"./KbdGroup-CVThv8mv.js";import"./VisuallyHidden-ZCvqR7kA.js";import"./index-kMnmcFYy.js";import"./ResizeHandle-BA8IuddH.js";import{b as h}from"./format-time-DlFmmhf9.js";import"./preload-helper-PPVm8Dsz.js";import"./settings-Df4NhSNk.js";import"./ipc-CvYYIIIu.js";import"./react-CM93qTYy.js";import"./index-CqE97RaD.js";import"./floating-ui.react-BTPmBFa-.js";import"./chevron-down-D2vYOdxz.js";import"./createLucideIcon-CIh8D4qA.js";import"./chevron-right-BAbzGsgL.js";import"./check-BxkDBxqF.js";import"./x-CFCsdqrP.js";import"./chevron-left-XPJ7hgLI.js";import"./upload-CNDn8ix9.js";import"./shield-DDsFW79G.js";import"./useClipboard-D688GeTN.js";import"./toast-CRDfB1Gr.js";import"./I18nProvider-QSPSpfHa.js";import"./index-8X-GOh7L.js";import"./info-xDV3YaJU.js";import"./triangle-alert-BmHsaBbn.js";import"./circle-check-CBnAbgkE.js";import"./arrow-down-sHqQ2fUb.js";import"./arrow-up-DGQOQQzZ.js";import"./index-Cf8GF5kW.js";const _={error:"bg-error",warning:"bg-warning",info:"bg-info",success:"bg-success"};function l({notification:n,onClick:u}){const{id:g,type:f,message:y,source:m,timestamp:x,read:p}=n;return r.jsx(w,{variant:"ghost",size:"sm",onClick:()=>u(g),className:a("w-full justify-start rounded-none px-3.5 py-1.5 h-auto border-b border-white/3",p&&"opacity-60"),children:r.jsxs(b,{direction:"row",align:"start",gap:"sm",className:"w-full",children:[r.jsx(c,{className:a("mt-1.25 h-1.5 w-1.5 shrink-0 rounded-full",_[f],p&&"opacity-40")}),r.jsxs(c,{className:"min-w-0 flex-1 text-left",children:[r.jsx(d,{size:"xs",color:"primary",truncate:!0,children:y}),r.jsxs(d,{size:"xs",color:"muted",className:"mt-0.5 text-[9px]",children:[m&&r.jsxs("span",{children:[m.label," · "]}),h(x)]})]})]})})}l.__docgenInfo={description:"",methods:[],displayName:"NotificationItem",props:{notification:{required:!0,tsType:{name:"Notification"},description:""},onClick:{required:!0,tsType:{name:"signature",type:"function",raw:"(id: string) => void",signature:{arguments:[{type:{name:"string"},name:"id"}],return:{name:"void"}}},description:""}}};const{fn:j}=__STORYBOOK_MODULE_TEST__,s={id:"n1",type:"info",title:"Query finished",message:"Returned 128 rows in 42ms",timestamp:Date.now()-9e4,read:!1},po={title:"Components/Shell/NotificationItem",component:l,parameters:{layout:"padded"},args:{onClick:j()},decorators:[n=>r.jsx("div",{className:"w-80 bg-bg-primary border border-border-default rounded",children:r.jsx(n,{})})]},o={args:{notification:s}},t={args:{notification:{...s,id:"n2",type:"error",message:"Connection to prod-orders refused",source:{type:"connection",id:"c1",label:"prod-orders"}}}},i={args:{notification:{...s,id:"n3",type:"warning",message:"2 plugins failed to load",source:{type:"plugin",id:"system",label:"Plugin system"}}}},e={args:{notification:{...s,id:"n4",type:"success",message:"Export completed",read:!0,timestamp:Date.now()-72e5}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    notification: base
  }
}`,...o.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    notification: {
      ...base,
      id: 'n2',
      type: 'error',
      message: 'Connection to prod-orders refused',
      source: {
        type: 'connection',
        id: 'c1',
        label: 'prod-orders'
      }
    }
  }
}`,...t.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    notification: {
      ...base,
      id: 'n3',
      type: 'warning',
      message: '2 plugins failed to load',
      source: {
        type: 'plugin',
        id: 'system',
        label: 'Plugin system'
      }
    }
  }
}`,...i.parameters?.docs?.source}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  args: {
    notification: {
      ...base,
      id: 'n4',
      type: 'success',
      message: 'Export completed',
      read: true,
      timestamp: Date.now() - 7_200_000
    }
  }
}`,...e.parameters?.docs?.source}}};const ao=["Info","Error","Warning","SuccessRead"];export{t as Error,o as Info,e as SuccessRead,i as Warning,ao as __namedExportsOrder,po as default};
