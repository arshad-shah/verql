import{J as h,B as r}from"./iframe-CdY22T7n.js";import"./ThemeProvider-DNYYmpnc.js";import{B as g}from"./Box-Bd47NzIT.js";import{F as l}from"./Flex-CE2f2iq4.js";import"./Stack--Ivib9E_.js";import"./Grid-C7p1bp0f.js";import"./Container-D0pENg5w.js";import"./Divider-CC5zJA6v.js";import"./Spacer-B6mR4OMa.js";import"./ScrollArea-DsVAjX50.js";import"./AspectRatio-PTPAY6Hu.js";import"./Card-UMTkYlih.js";import"./Panel-CrM5lnRj.js";import"./Modal-EvcNrSt5.js";import"./Sheet-Bui5TeLS.js";import"./Popover-ekmZQG1b.js";import"./Tooltip-DFQSTWFy.js";import"./DropdownMenu-DPcpRel2.js";import"./ContextMenu-BOut3BPG.js";import"./Accordion-BJdES6PL.js";import"./GradientSurface-C281tc_L.js";import"./Button-DVlKTRa-.js";import"./Input-DjpTQLBk.js";import"./Textarea-CzIEnTGU.js";import"./Label-gu33wJKO.js";import"./FormField-CgphHAJ9.js";import"./Select-CAB-yi5k.js";import"./Checkbox-DDEoxGC3.js";import"./Radio-B7PLoi94.js";import"./Switch-BBKi_QXD.js";import"./Slider-DFgVipQ_.js";import"./NumberInput-CxGbH90u.js";import"./SearchInput-CAJDyJI7.js";import"./PasswordInput-yqvteJ6H.js";import"./TagsInput-DUVVsLjJ.js";import"./DatePicker-BFX3pHnd.js";import"./ColorInput-jrVGPdr-.js";import"./ColorPicker-CTQREHAa.js";import"./FileContentInput-JQwPf_a6.js";import"./FilePathInput-BcZ3Lft3.js";import{B as b}from"./Badge-Dn_M9v_L.js";import"./BadgeIndicator-BlVGNMQr.js";import"./Tag-96dLrhkw.js";import"./Avatar-BtYeYK_B.js";import"./Skeleton-BIOO4slx.js";import"./EmptyState-lPmgnzUi.js";import"./KeyValue-a9TLj5lg.js";import"./Table-BjAIyt7e.js";import"./List-DZhZIDuR.js";import"./TreeItem-Dy-Qf4il.js";import"./CodeView-DwjwXYkg.js";import"./Toast-DFHqdqIU.js";import{A as N}from"./Alert-Dvw7u8hm.js";import"./Progress-BZJHEeVB.js";import"./Spinner-BZmpou-y.js";import"./Banner-B-2Lw8fl.js";import"./Tabs-DFrZiyUC.js";import"./Breadcrumb-Gq6pv0jV.js";import"./Link-BtAoe6Yk.js";import"./Pagination-k2D09rK0.js";import{T as u}from"./Text-u8VLJp0e.js";import"./Heading-BkWmjzHt.js";import"./Code-3CWmbko6.js";import"./KbdGroup-CVThv8mv.js";import"./VisuallyHidden-ZCvqR7kA.js";import"./index-kMnmcFYy.js";import"./ResizeHandle-BA8IuddH.js";import{a as v}from"./db-error-BYObUJyz.js";import{u as T}from"./I18nProvider-QSPSpfHa.js";import{C as S}from"./chevron-down-D2vYOdxz.js";import{C as R}from"./chevron-right-BAbzGsgL.js";import{u as E}from"./driver-capabilities-BByz55u6.js";import"./preload-helper-PPVm8Dsz.js";import"./settings-Df4NhSNk.js";import"./ipc-CvYYIIIu.js";import"./react-CM93qTYy.js";import"./cn-DDt1maD9.js";import"./index-CqE97RaD.js";import"./floating-ui.react-BTPmBFa-.js";import"./check-BxkDBxqF.js";import"./createLucideIcon-CIh8D4qA.js";import"./x-CFCsdqrP.js";import"./chevron-left-XPJ7hgLI.js";import"./upload-CNDn8ix9.js";import"./shield-DDsFW79G.js";import"./useClipboard-D688GeTN.js";import"./toast-CRDfB1Gr.js";import"./info-xDV3YaJU.js";import"./triangle-alert-BmHsaBbn.js";import"./circle-check-CBnAbgkE.js";import"./arrow-down-sHqQ2fUb.js";import"./arrow-up-DGQOQQzZ.js";import"./index-Cf8GF5kW.js";import"./index-8X-GOh7L.js";import"./data-nouns-BDP8SmCF.js";function f({error:t,dbType:m}){const{t:c}=T(),e=v(t,m),[d,x]=h.useState(!1),y=e.code==="UNKNOWN";return r.jsx(g,{className:"p-4 overflow-auto h-full",children:r.jsx(N,{variant:"error",title:e.title,className:"max-w-2xl",children:r.jsxs(l,{direction:"column",gap:"sm",children:[r.jsx(u,{size:"sm",as:"p",className:"leading-relaxed",children:e.message}),e.hint&&r.jsxs(l,{direction:"column",gap:"xs",align:"start",className:"rounded-md bg-bg-tertiary/40 px-3 py-2",children:[r.jsx(u,{size:"xs",weight:"medium",className:"text-text-secondary uppercase tracking-wide",children:c("query.error.hint")}),r.jsx(u,{size:"xs",color:"secondary",as:"p",className:"leading-relaxed",children:e.hint})]}),r.jsxs(l,{align:"center",justify:"between",gap:"sm",className:"pt-1",children:[!y&&r.jsx(b,{variant:"default",size:"sm",className:"font-mono text-[10px] uppercase",children:e.code}),r.jsxs("button",{type:"button",onClick:()=>x(w=>!w),className:"inline-flex items-center gap-1 text-[11px] text-text-muted hover:text-text-primary transition-colors ml-auto",children:[d?r.jsx(S,{size:12}):r.jsx(R,{size:12}),c(d?"query.error.hideDriverMessage":"query.error.showDriverMessage")]})]}),d&&r.jsx(g,{className:"rounded-md bg-bg-inset border border-border-default px-3 py-2 font-mono text-[11px] text-text-secondary whitespace-pre-wrap break-words",children:e.raw})]})})})}f.__docgenInfo={description:`Renders a database error as a friendly Alert.

Layout: title (parsed), one-line explanation, optional hint, and a
collapsible "Show driver message" disclosure for the raw text — power
users still need to see the original when a pattern misclassifies or
when they're filing a bug against a driver.

Lives in \`results/\` because the BottomDock's results tab is where query
errors surface; if we ever add another error surface (connection test,
import) it can reuse this verbatim.`,methods:[],displayName:"QueryErrorView",props:{error:{required:!0,tsType:{name:"string"},description:"Raw error message as caught from the IPC boundary."},dbType:{required:!1,tsType:{name:"string"},description:"Active connection's driver type, so driver error rules classify the error."}}};function q(){E.setState({byType:{postgresql:{errorRules:[{code:"SYNTAX_ERROR",pattern:'syntax error at or near "(.+?)"'}]}}})}const he={title:"Components/Results/QueryErrorView",component:f,decorators:[t=>r.jsx("div",{style:{width:720,maxWidth:"100%"},children:r.jsx(t,{})})]},o={args:{error:'password authentication failed for user "verql"',dbType:"postgresql"}},s={args:{error:"connect ECONNREFUSED 127.0.0.1:5432",dbType:"postgresql"}},i={args:{error:"canceling statement due to statement timeout",dbType:"postgresql"}},a={decorators:[t=>{function m(){return h.useEffect(q,[]),r.jsx(t,{})}return r.jsx(m,{})}],args:{error:'syntax error at or near "SELCT"',dbType:"postgresql"}},n={args:{error:"ERROR: deadlock detected while waiting for ShareLock on transaction 90231",dbType:"postgresql"}},p={args:{error:"fetch failed: getaddrinfo ENOTFOUND api.example.com"}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    error: 'password authentication failed for user "verql"',
    dbType: 'postgresql'
  }
}`,...o.parameters?.docs?.source},description:{story:"Authentication failure — classified by a host pattern, with a hint + code chip.",...o.parameters?.docs?.description}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    error: 'connect ECONNREFUSED 127.0.0.1:5432',
    dbType: 'postgresql'
  }
}`,...s.parameters?.docs?.source},description:{story:"Server unreachable — the most common connection error.",...s.parameters?.docs?.description}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    error: 'canceling statement due to statement timeout',
    dbType: 'postgresql'
  }
}`,...i.parameters?.docs?.source},description:{story:"Statement exceeded its timeout.",...i.parameters?.docs?.description}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  decorators: [Story => {
    function Seeded() {
      useEffect(seedDriverRules, []);
      return <Story />;
    }
    return <Seeded />;
  }],
  args: {
    error: 'syntax error at or near "SELCT"',
    dbType: 'postgresql'
  }
}`,...a.parameters?.docs?.source},description:{story:"Driver-owned, query-semantic classification (needs the driver's errorRules).",...a.parameters?.docs?.description}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  args: {
    error: 'ERROR: deadlock detected while waiting for ShareLock on transaction 90231',
    dbType: 'postgresql'
  }
}`,...n.parameters?.docs?.source},description:{story:"Unclassified error — falls through to UNKNOWN and renders the raw text cleanly.",...n.parameters?.docs?.description}}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  args: {
    error: 'fetch failed: getaddrinfo ENOTFOUND api.example.com'
  }
}`,...p.parameters?.docs?.source},description:{story:"No dbType supplied (e.g. an app/network error surface reusing the view).",...p.parameters?.docs?.description}}};const fe=["AuthFailed","ConnectionRefused","Timeout","DriverClassified","Unknown","NoDbType"];export{o as AuthFailed,s as ConnectionRefused,a as DriverClassified,p as NoDbType,i as Timeout,n as Unknown,fe as __namedExportsOrder,he as default};
