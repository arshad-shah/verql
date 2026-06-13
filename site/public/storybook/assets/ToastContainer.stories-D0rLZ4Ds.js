import{B as e,J as m}from"./iframe-CdY22T7n.js";import{u}from"./toast-CRDfB1Gr.js";import"./ThemeProvider-DNYYmpnc.js";import{a as c}from"./cn-DDt1maD9.js";import{B as S}from"./Box-Bd47NzIT.js";import{F as h}from"./Flex-CE2f2iq4.js";import{S as C}from"./Stack--Ivib9E_.js";import"./Grid-C7p1bp0f.js";import"./Container-D0pENg5w.js";import"./Divider-CC5zJA6v.js";import"./Spacer-B6mR4OMa.js";import"./ScrollArea-DsVAjX50.js";import"./AspectRatio-PTPAY6Hu.js";import"./Card-UMTkYlih.js";import"./Panel-CrM5lnRj.js";import"./Modal-EvcNrSt5.js";import"./Sheet-Bui5TeLS.js";import"./Popover-ekmZQG1b.js";import"./Tooltip-DFQSTWFy.js";import"./DropdownMenu-DPcpRel2.js";import"./ContextMenu-BOut3BPG.js";import"./Accordion-BJdES6PL.js";import"./GradientSurface-C281tc_L.js";import{I as E}from"./Button-DVlKTRa-.js";import"./Input-DjpTQLBk.js";import"./Textarea-CzIEnTGU.js";import"./Label-gu33wJKO.js";import"./FormField-CgphHAJ9.js";import"./Select-CAB-yi5k.js";import"./Checkbox-DDEoxGC3.js";import"./Radio-B7PLoi94.js";import"./Switch-BBKi_QXD.js";import"./Slider-DFgVipQ_.js";import"./NumberInput-CxGbH90u.js";import"./SearchInput-CAJDyJI7.js";import"./PasswordInput-yqvteJ6H.js";import"./TagsInput-DUVVsLjJ.js";import"./DatePicker-BFX3pHnd.js";import"./ColorInput-jrVGPdr-.js";import"./ColorPicker-CTQREHAa.js";import"./FileContentInput-JQwPf_a6.js";import"./FilePathInput-BcZ3Lft3.js";import"./Badge-Dn_M9v_L.js";import"./BadgeIndicator-BlVGNMQr.js";import"./Tag-96dLrhkw.js";import"./Avatar-BtYeYK_B.js";import"./Skeleton-BIOO4slx.js";import"./EmptyState-lPmgnzUi.js";import"./KeyValue-a9TLj5lg.js";import"./Table-BjAIyt7e.js";import"./List-DZhZIDuR.js";import"./TreeItem-Dy-Qf4il.js";import"./CodeView-DwjwXYkg.js";import"./Toast-DFHqdqIU.js";import"./Alert-Dvw7u8hm.js";import"./Progress-BZJHEeVB.js";import"./Spinner-BZmpou-y.js";import{C as l}from"./Banner-B-2Lw8fl.js";import"./Tabs-DFrZiyUC.js";import"./Breadcrumb-Gq6pv0jV.js";import"./Link-BtAoe6Yk.js";import"./Pagination-k2D09rK0.js";import{T as d}from"./Text-u8VLJp0e.js";import"./Heading-BkWmjzHt.js";import"./Code-3CWmbko6.js";import"./KbdGroup-CVThv8mv.js";import"./VisuallyHidden-ZCvqR7kA.js";import"./index-kMnmcFYy.js";import"./ResizeHandle-BA8IuddH.js";import{u as j}from"./I18nProvider-QSPSpfHa.js";import{L as w}from"./loader-circle-O_NBEwYb.js";import{C as f,I as b}from"./info-xDV3YaJU.js";import{X as k}from"./x-CFCsdqrP.js";import"./preload-helper-PPVm8Dsz.js";import"./ipc-CvYYIIIu.js";import"./react-CM93qTYy.js";import"./settings-Df4NhSNk.js";import"./index-CqE97RaD.js";import"./floating-ui.react-BTPmBFa-.js";import"./chevron-down-D2vYOdxz.js";import"./createLucideIcon-CIh8D4qA.js";import"./chevron-right-BAbzGsgL.js";import"./check-BxkDBxqF.js";import"./chevron-left-XPJ7hgLI.js";import"./upload-CNDn8ix9.js";import"./shield-DDsFW79G.js";import"./useClipboard-D688GeTN.js";import"./triangle-alert-BmHsaBbn.js";import"./circle-check-CBnAbgkE.js";import"./arrow-down-sHqQ2fUb.js";import"./arrow-up-DGQOQQzZ.js";import"./index-Cf8GF5kW.js";import"./index-8X-GOh7L.js";const I={error:f,success:l,info:b},v={error:f,success:l,info:w},T={error:"border-error/30 bg-error/10",success:"border-success/30 bg-success/10",info:"border-accent/30 bg-accent/10"},N={error:"text-error",success:"text-success",info:"text-accent"};function y(){const{t}=j(),{toasts:a,removeToast:x}=u();return a.length===0?null:e.jsx(C,{gap:"sm",className:"fixed bottom-10 right-4 z-50 max-w-sm",children:a.map(r=>{const g=r.persistent?v[r.type]:I[r.type];return e.jsxs(h,{align:"start",gap:"sm",className:c("px-3 py-2.5 rounded-lg border backdrop-blur-sm shadow-lg toast-enter",T[r.type]),role:"alert",children:[e.jsx(g,{size:16,className:c("shrink-0 mt-0.5",N[r.type],r.persistent&&r.type==="info"&&"animate-spin")}),e.jsxs(S,{className:"flex-1 min-w-0",children:[e.jsx(d,{size:"sm",weight:"medium",as:"p",children:r.title}),r.message&&e.jsx(d,{size:"xs",color:"secondary",as:"p",className:"mt-0.5 whitespace-pre-wrap break-words",children:r.message})]}),e.jsx(E,{label:t("shell.toast.dismiss"),size:"xs",variant:"ghost",onClick:()=>x(r.id),className:"shrink-0 text-text-muted hover:text-text-primary p-0.5 h-auto w-auto",children:e.jsx(k,{size:14})})]},r.id)})})}y.__docgenInfo={description:"",methods:[],displayName:"ToastContainer"};function p(t){u.setState({toasts:t})}const ye={title:"Components/Shell/ToastContainer",component:y,parameters:{layout:"fullscreen"}},o={decorators:[t=>(m.useEffect(()=>{p([{id:"1",type:"success",title:"Query executed",message:"128 rows in 42ms"}])},[]),e.jsx(t,{}))]},s={decorators:[t=>(m.useEffect(()=>{p([{id:"1",type:"error",title:"Connection failed",message:"could not connect to server: Connection refused"}])},[]),e.jsx(t,{}))]},i={decorators:[t=>(m.useEffect(()=>{p([{id:"1",type:"info",title:"Exporting…",message:"Writing rows to CSV",persistent:!0}])},[]),e.jsx(t,{}))]},n={decorators:[t=>(m.useEffect(()=>{p([{id:"1",type:"success",title:"Saved query"},{id:"2",type:"info",title:"Schema refreshed"},{id:"3",type:"error",title:"Migration failed",message:'relation "users" already exists'}])},[]),e.jsx(t,{}))]};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  decorators: [Story => {
    useEffect(() => {
      seed([{
        id: '1',
        type: 'success',
        title: 'Query executed',
        message: '128 rows in 42ms'
      }]);
    }, []);
    return <Story />;
  }]
}`,...o.parameters?.docs?.source},description:{story:"A single success toast.",...o.parameters?.docs?.description}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  decorators: [Story => {
    useEffect(() => {
      seed([{
        id: '1',
        type: 'error',
        title: 'Connection failed',
        message: 'could not connect to server: Connection refused'
      }]);
    }, []);
    return <Story />;
  }]
}`,...s.parameters?.docs?.source},description:{story:"An error toast with a longer message.",...s.parameters?.docs?.description}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  decorators: [Story => {
    useEffect(() => {
      seed([{
        id: '1',
        type: 'info',
        title: 'Exporting…',
        message: 'Writing rows to CSV',
        persistent: true
      }]);
    }, []);
    return <Story />;
  }]
}`,...i.parameters?.docs?.source},description:{story:"A persistent info toast (spinner icon, stays until dismissed).",...i.parameters?.docs?.description}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  decorators: [Story => {
    useEffect(() => {
      seed([{
        id: '1',
        type: 'success',
        title: 'Saved query'
      }, {
        id: '2',
        type: 'info',
        title: 'Schema refreshed'
      }, {
        id: '3',
        type: 'error',
        title: 'Migration failed',
        message: 'relation "users" already exists'
      }]);
    }, []);
    return <Story />;
  }]
}`,...n.parameters?.docs?.source},description:{story:"Several stacked toasts of mixed types.",...n.parameters?.docs?.description}}};const xe=["Success","Error","PersistentInfo","Stacked"];export{s as Error,i as PersistentInfo,n as Stacked,o as Success,xe as __namedExportsOrder,ye as default};
