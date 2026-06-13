import{J as p,B as m}from"./iframe-CdY22T7n.js";import"./ThemeProvider-DNYYmpnc.js";import{B as T}from"./Box-Bd47NzIT.js";import"./Flex-CE2f2iq4.js";import"./Stack--Ivib9E_.js";import"./Grid-C7p1bp0f.js";import"./Container-D0pENg5w.js";import"./Divider-CC5zJA6v.js";import"./Spacer-B6mR4OMa.js";import"./ScrollArea-DsVAjX50.js";import"./AspectRatio-PTPAY6Hu.js";import"./Card-UMTkYlih.js";import"./Panel-CrM5lnRj.js";import"./Modal-EvcNrSt5.js";import"./Sheet-Bui5TeLS.js";import"./Popover-ekmZQG1b.js";import"./Tooltip-DFQSTWFy.js";import"./DropdownMenu-DPcpRel2.js";import"./ContextMenu-BOut3BPG.js";import"./Accordion-BJdES6PL.js";import"./GradientSurface-C281tc_L.js";import{B as f}from"./Button-DVlKTRa-.js";import"./Input-DjpTQLBk.js";import"./Textarea-CzIEnTGU.js";import"./Label-gu33wJKO.js";import"./FormField-CgphHAJ9.js";import"./Select-CAB-yi5k.js";import"./Checkbox-DDEoxGC3.js";import"./Radio-B7PLoi94.js";import"./Switch-BBKi_QXD.js";import"./Slider-DFgVipQ_.js";import"./NumberInput-CxGbH90u.js";import"./SearchInput-CAJDyJI7.js";import"./PasswordInput-yqvteJ6H.js";import"./TagsInput-DUVVsLjJ.js";import"./DatePicker-BFX3pHnd.js";import"./ColorInput-jrVGPdr-.js";import"./ColorPicker-CTQREHAa.js";import"./FileContentInput-JQwPf_a6.js";import"./FilePathInput-BcZ3Lft3.js";import"./Badge-Dn_M9v_L.js";import"./BadgeIndicator-BlVGNMQr.js";import"./Tag-96dLrhkw.js";import"./Avatar-BtYeYK_B.js";import"./Skeleton-BIOO4slx.js";import"./EmptyState-lPmgnzUi.js";import"./KeyValue-a9TLj5lg.js";import"./Table-BjAIyt7e.js";import"./List-DZhZIDuR.js";import"./TreeItem-Dy-Qf4il.js";import"./CodeView-DwjwXYkg.js";import"./Toast-DFHqdqIU.js";import"./Alert-Dvw7u8hm.js";import"./Progress-BZJHEeVB.js";import"./Spinner-BZmpou-y.js";import"./Banner-B-2Lw8fl.js";import"./Tabs-DFrZiyUC.js";import"./Breadcrumb-Gq6pv0jV.js";import"./Link-BtAoe6Yk.js";import"./Pagination-k2D09rK0.js";import"./Text-u8VLJp0e.js";import"./Heading-BkWmjzHt.js";import"./Code-3CWmbko6.js";import"./KbdGroup-CVThv8mv.js";import"./VisuallyHidden-ZCvqR7kA.js";import"./index-kMnmcFYy.js";import"./ResizeHandle-BA8IuddH.js";import{u as l,a as E,b as r}from"./ui-D4eVvrGh.js";import{I as C,a as y}from"./ipc-CvYYIIIu.js";import"./preload-helper-PPVm8Dsz.js";import"./settings-Df4NhSNk.js";import"./react-CM93qTYy.js";import"./cn-DDt1maD9.js";import"./index-CqE97RaD.js";import"./floating-ui.react-BTPmBFa-.js";import"./chevron-down-D2vYOdxz.js";import"./createLucideIcon-CIh8D4qA.js";import"./chevron-right-BAbzGsgL.js";import"./check-BxkDBxqF.js";import"./x-CFCsdqrP.js";import"./chevron-left-XPJ7hgLI.js";import"./upload-CNDn8ix9.js";import"./shield-DDsFW79G.js";import"./useClipboard-D688GeTN.js";import"./toast-CRDfB1Gr.js";import"./I18nProvider-QSPSpfHa.js";import"./index-8X-GOh7L.js";import"./info-xDV3YaJU.js";import"./triangle-alert-BmHsaBbn.js";import"./circle-check-CBnAbgkE.js";import"./arrow-down-sHqQ2fUb.js";import"./arrow-up-DGQOQQzZ.js";import"./index-Cf8GF5kW.js";function u({categories:e}={}){const g=l(t=>t.activeSettingsCategory),S=l(t=>t.setActiveSettingsCategory),[A,v]=p.useState(new Set),d=p.useCallback(async()=>{try{const t=await window.electronAPI.invoke(C.PLUGINS_LIST),I=new Set(t.filter(n=>n.status.state==="active"||n.status.state==="degraded").map(n=>n.name));v(I)}catch{v(new Set)}},[]);p.useEffect(()=>{d();const t=window.electronAPI.on(y.PLUGINS_LIFECYCLE,d);return()=>t?.()},[d]);const N=(e??E).filter(t=>!t.ownedBy||A.has(t.ownedBy));return m.jsx(T,{paddingY:"sm",children:N.map(t=>m.jsx(f,{variant:"ghost",size:"md",onClick:()=>S(t.id),className:`w-full justify-start rounded-none px-4 ${g===t.id?"bg-hover border-l-2 border-l-accent text-text-primary":"border-l-2 border-l-transparent text-text-secondary"}`,children:t.label},t.id))})}u.__docgenInfo={description:"",methods:[],displayName:"SettingsCategoryNav"};function h(e){window.electronAPI={invoke:async()=>e,on:()=>()=>{}}}function c(e){return function(){return p.useEffect(()=>{h(e.plugins??[]),l.setState({activeSettingsCategory:e.active})},[]),m.jsx("div",{style:{width:220},children:m.jsx(u,{categories:e.categories})})}}const le={title:"Components/Settings/SettingsCategoryNav",component:u},i={render:c({active:r.GENERAL,plugins:[{name:"verql-plugin-ai",status:{state:"active"}}]})},o={render:c({active:r.KEYBINDINGS,plugins:[{name:"verql-plugin-ai",status:{state:"active"}}]})},s={render:c({active:r.GENERAL,plugins:[]})},a={render:c({active:r.APPEARANCE,plugins:[{name:"verql-plugin-ai",status:{state:"active"}}],categories:E.filter(e=>[r.APPEARANCE,r.EDITOR].includes(e.id))})};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  render: withNav({
    active: SETTINGS_CATEGORY.GENERAL,
    plugins: [{
      name: 'verql-plugin-ai',
      status: {
        state: 'active'
      }
    }]
  })
}`,...i.parameters?.docs?.source},description:{story:"Default nav with the AI plugin active, so every category is visible.",...i.parameters?.docs?.description}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: withNav({
    active: SETTINGS_CATEGORY.KEYBINDINGS,
    plugins: [{
      name: 'verql-plugin-ai',
      status: {
        state: 'active'
      }
    }]
  })
}`,...o.parameters?.docs?.source},description:{story:"A non-default category selected — the active item is highlighted.",...o.parameters?.docs?.description}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render: withNav({
    active: SETTINGS_CATEGORY.GENERAL,
    plugins: []
  })
}`,...s.parameters?.docs?.source},description:{story:"AI plugin inactive — its category is hidden without a restart.",...s.parameters?.docs?.description}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  render: withNav({
    active: SETTINGS_CATEGORY.APPEARANCE,
    plugins: [{
      name: 'verql-plugin-ai',
      status: {
        state: 'active'
      }
    }],
    categories: SETTINGS_CATEGORIES.filter(c => [SETTINGS_CATEGORY.APPEARANCE, SETTINGS_CATEGORY.EDITOR].includes(c.id as 'appearance' | 'editor'))
  })
}`,...a.parameters?.docs?.source},description:{story:"A pre-filtered list (the settings search box passes `categories`).",...a.parameters?.docs?.description}}};const ue=["Default","KeybindingsActive","AiPluginDisabled","SearchFiltered"];export{s as AiPluginDisabled,i as Default,o as KeybindingsActive,a as SearchFiltered,ue as __namedExportsOrder,le as default};
