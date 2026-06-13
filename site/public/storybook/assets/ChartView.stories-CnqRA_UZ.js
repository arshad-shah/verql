import{B as p}from"./iframe-CdY22T7n.js";import{T as m}from"./ThemeProvider-DNYYmpnc.js";import{C as n}from"./ChartView-DbgsjRE3.js";import"./preload-helper-PPVm8Dsz.js";import"./settings-Df4NhSNk.js";import"./ipc-CvYYIIIu.js";import"./react-CM93qTYy.js";import"./Box-Bd47NzIT.js";import"./cn-DDt1maD9.js";import"./Flex-CE2f2iq4.js";import"./Stack--Ivib9E_.js";import"./Grid-C7p1bp0f.js";import"./Container-D0pENg5w.js";import"./Divider-CC5zJA6v.js";import"./Spacer-B6mR4OMa.js";import"./ScrollArea-DsVAjX50.js";import"./AspectRatio-PTPAY6Hu.js";import"./Card-UMTkYlih.js";import"./index-CqE97RaD.js";import"./Panel-CrM5lnRj.js";import"./Modal-EvcNrSt5.js";import"./Sheet-Bui5TeLS.js";import"./Popover-ekmZQG1b.js";import"./Tooltip-DFQSTWFy.js";import"./floating-ui.react-BTPmBFa-.js";import"./index-kMnmcFYy.js";import"./index-Cf8GF5kW.js";import"./DropdownMenu-DPcpRel2.js";import"./ContextMenu-BOut3BPG.js";import"./Accordion-BJdES6PL.js";import"./chevron-down-D2vYOdxz.js";import"./createLucideIcon-CIh8D4qA.js";import"./chevron-right-BAbzGsgL.js";import"./GradientSurface-C281tc_L.js";import"./Button-DVlKTRa-.js";import"./Input-DjpTQLBk.js";import"./Textarea-CzIEnTGU.js";import"./Label-gu33wJKO.js";import"./FormField-CgphHAJ9.js";import"./Select-CAB-yi5k.js";import"./check-BxkDBxqF.js";import"./Checkbox-DDEoxGC3.js";import"./Radio-B7PLoi94.js";import"./Switch-BBKi_QXD.js";import"./Slider-DFgVipQ_.js";import"./NumberInput-CxGbH90u.js";import"./SearchInput-CAJDyJI7.js";import"./PasswordInput-yqvteJ6H.js";import"./TagsInput-DUVVsLjJ.js";import"./x-CFCsdqrP.js";import"./DatePicker-BFX3pHnd.js";import"./chevron-left-XPJ7hgLI.js";import"./ColorInput-jrVGPdr-.js";import"./ColorPicker-CTQREHAa.js";import"./FileContentInput-JQwPf_a6.js";import"./upload-CNDn8ix9.js";import"./shield-DDsFW79G.js";import"./FilePathInput-BcZ3Lft3.js";import"./Badge-Dn_M9v_L.js";import"./BadgeIndicator-BlVGNMQr.js";import"./Tag-96dLrhkw.js";import"./Avatar-BtYeYK_B.js";import"./Skeleton-BIOO4slx.js";import"./EmptyState-lPmgnzUi.js";import"./KeyValue-a9TLj5lg.js";import"./Table-BjAIyt7e.js";import"./List-DZhZIDuR.js";import"./TreeItem-Dy-Qf4il.js";import"./CodeView-DwjwXYkg.js";import"./useClipboard-D688GeTN.js";import"./toast-CRDfB1Gr.js";import"./I18nProvider-QSPSpfHa.js";import"./index-8X-GOh7L.js";import"./Toast-DFHqdqIU.js";import"./Text-u8VLJp0e.js";import"./info-xDV3YaJU.js";import"./triangle-alert-BmHsaBbn.js";import"./circle-check-CBnAbgkE.js";import"./Alert-Dvw7u8hm.js";import"./Progress-BZJHEeVB.js";import"./Spinner-BZmpou-y.js";import"./Banner-B-2Lw8fl.js";import"./Tabs-DFrZiyUC.js";import"./Breadcrumb-Gq6pv0jV.js";import"./Link-BtAoe6Yk.js";import"./Pagination-k2D09rK0.js";import"./Heading-BkWmjzHt.js";import"./Code-3CWmbko6.js";import"./KbdGroup-CVThv8mv.js";import"./arrow-down-sHqQ2fUb.js";import"./arrow-up-DGQOQQzZ.js";import"./VisuallyHidden-ZCvqR7kA.js";import"./ResizeHandle-BA8IuddH.js";const a=[{region:"North",revenue:4200},{region:"South",revenue:3100},{region:"East",revenue:5400},{region:"West",revenue:2800},{region:"Central",revenue:3900}],c=[{day:"2026-01-01",signups:120},{day:"2026-01-02",signups:180},{day:"2026-01-03",signups:150},{day:"2026-01-04",signups:240},{day:"2026-01-05",signups:300}],d=[{weight:1.2,price:19},{weight:2.4,price:31},{weight:3.1,price:44},{weight:4.8,price:52},{weight:5,price:70}],Yr={title:"Components/Charts/ChartView",component:n,decorators:[s=>p.jsx(m,{children:p.jsx("div",{style:{width:560,height:320},children:p.jsx(s,{})})})]},r={args:{type:"bar",data:a,xKey:"region",yKey:"revenue"}},t={args:{type:"line",data:c,xKey:"day",yKey:"signups"}},e={args:{type:"pie",data:a,xKey:"region",yKey:"revenue"}},o={args:{type:"scatter",data:d,xKey:"weight",yKey:"price"}},i={args:{type:"none",data:[],xKey:"",yKey:""}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    type: 'bar',
    data: categorical,
    xKey: 'region',
    yKey: 'revenue'
  }
}`,...r.parameters?.docs?.source},description:{story:"Categorical revenue by region.",...r.parameters?.docs?.description}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    type: 'line',
    data: timeseries,
    xKey: 'day',
    yKey: 'signups'
  }
}`,...t.parameters?.docs?.source},description:{story:"Daily signups over time.",...t.parameters?.docs?.description}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  args: {
    type: 'pie',
    data: categorical,
    xKey: 'region',
    yKey: 'revenue'
  }
}`,...e.parameters?.docs?.source},description:{story:"Revenue share by region.",...e.parameters?.docs?.description}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    type: 'scatter',
    data: scatter,
    xKey: 'weight',
    yKey: 'price'
  }
}`,...o.parameters?.docs?.source},description:{story:"Two numeric dimensions plotted against each other.",...o.parameters?.docs?.description}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    type: 'none',
    data: [],
    xKey: '',
    yKey: ''
  }
}`,...i.parameters?.docs?.source},description:{story:'No chartable shape / empty data — renders the "no chart available" message.',...i.parameters?.docs?.description}}};const Zr=["BarChart","LineChart","PieChart","ScatterChart","Empty"];export{r as BarChart,i as Empty,t as LineChart,e as PieChart,o as ScatterChart,Zr as __namedExportsOrder,Yr as default};
