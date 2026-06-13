import{B as o}from"./iframe-CdY22T7n.js";import{W as s}from"./WidgetRenderer-BPkLSeog.js";import"./preload-helper-PPVm8Dsz.js";import"./Popover-ekmZQG1b.js";import"./cn-DDt1maD9.js";import"./SelectorWidget-D3Vkp3Q4.js";import"./ThemeProvider-DNYYmpnc.js";import"./settings-Df4NhSNk.js";import"./ipc-CvYYIIIu.js";import"./react-CM93qTYy.js";import"./Box-Bd47NzIT.js";import"./Flex-CE2f2iq4.js";import"./Stack--Ivib9E_.js";import"./Grid-C7p1bp0f.js";import"./Container-D0pENg5w.js";import"./Divider-CC5zJA6v.js";import"./Spacer-B6mR4OMa.js";import"./ScrollArea-DsVAjX50.js";import"./AspectRatio-PTPAY6Hu.js";import"./Card-UMTkYlih.js";import"./index-CqE97RaD.js";import"./Panel-CrM5lnRj.js";import"./Modal-EvcNrSt5.js";import"./Sheet-Bui5TeLS.js";import"./Tooltip-DFQSTWFy.js";import"./floating-ui.react-BTPmBFa-.js";import"./index-kMnmcFYy.js";import"./index-Cf8GF5kW.js";import"./DropdownMenu-DPcpRel2.js";import"./ContextMenu-BOut3BPG.js";import"./Accordion-BJdES6PL.js";import"./chevron-down-D2vYOdxz.js";import"./createLucideIcon-CIh8D4qA.js";import"./chevron-right-BAbzGsgL.js";import"./GradientSurface-C281tc_L.js";import"./Button-DVlKTRa-.js";import"./Input-DjpTQLBk.js";import"./Textarea-CzIEnTGU.js";import"./Label-gu33wJKO.js";import"./FormField-CgphHAJ9.js";import"./Select-CAB-yi5k.js";import"./check-BxkDBxqF.js";import"./Checkbox-DDEoxGC3.js";import"./Radio-B7PLoi94.js";import"./Switch-BBKi_QXD.js";import"./Slider-DFgVipQ_.js";import"./NumberInput-CxGbH90u.js";import"./SearchInput-CAJDyJI7.js";import"./PasswordInput-yqvteJ6H.js";import"./TagsInput-DUVVsLjJ.js";import"./x-CFCsdqrP.js";import"./DatePicker-BFX3pHnd.js";import"./chevron-left-XPJ7hgLI.js";import"./ColorInput-jrVGPdr-.js";import"./ColorPicker-CTQREHAa.js";import"./FileContentInput-JQwPf_a6.js";import"./upload-CNDn8ix9.js";import"./shield-DDsFW79G.js";import"./FilePathInput-BcZ3Lft3.js";import"./Badge-Dn_M9v_L.js";import"./BadgeIndicator-BlVGNMQr.js";import"./Tag-96dLrhkw.js";import"./Avatar-BtYeYK_B.js";import"./Skeleton-BIOO4slx.js";import"./EmptyState-lPmgnzUi.js";import"./KeyValue-a9TLj5lg.js";import"./Table-BjAIyt7e.js";import"./List-DZhZIDuR.js";import"./TreeItem-Dy-Qf4il.js";import"./CodeView-DwjwXYkg.js";import"./useClipboard-D688GeTN.js";import"./toast-CRDfB1Gr.js";import"./I18nProvider-QSPSpfHa.js";import"./index-8X-GOh7L.js";import"./Toast-DFHqdqIU.js";import"./Text-u8VLJp0e.js";import"./info-xDV3YaJU.js";import"./triangle-alert-BmHsaBbn.js";import"./circle-check-CBnAbgkE.js";import"./Alert-Dvw7u8hm.js";import"./Progress-BZJHEeVB.js";import"./Spinner-BZmpou-y.js";import"./Banner-B-2Lw8fl.js";import"./Tabs-DFrZiyUC.js";import"./Breadcrumb-Gq6pv0jV.js";import"./Link-BtAoe6Yk.js";import"./Pagination-k2D09rK0.js";import"./Heading-BkWmjzHt.js";import"./Code-3CWmbko6.js";import"./KbdGroup-CVThv8mv.js";import"./arrow-down-sHqQ2fUb.js";import"./arrow-up-DGQOQQzZ.js";import"./VisuallyHidden-ZCvqR7kA.js";import"./ResizeHandle-BA8IuddH.js";import"./plugin-ui-9V3NCBVr.js";import"./connections-DUId3Rta.js";import"./notifications-CxwpcP25.js";import"./schema-DS6dFCac.js";import"./tabs-C7I9_q2c.js";import"./selection-CNDBGd8q.js";import"./ui-D4eVvrGh.js";import"./driver-capabilities-BByz55u6.js";import"./ActionButtonWidget-CAzJbaCV.js";import"./StatusIndicatorWidget-5WModyw5.js";import"./TextWidget-CZmgKeFE.js";const oe={title:"Components/PluginUi/WidgetRenderer",component:s,args:{pluginId:"demo-plugin"},decorators:[n=>o.jsx("div",{style:{width:280},children:o.jsx(n,{})})]},t={args:{widgets:[{id:"w-label",type:"text",content:"Connection",style:"label"},{id:"w-value",type:"text",content:"prod-postgres",style:"value"},{id:"w-status",type:"status-indicator",label:"Connected",icon:"circle",status:"ok"},{id:"w-sep",type:"separator"},{id:"w-select",type:"selector",label:"Schema",onChange:"demo.setSchema",value:"public",options:[{value:"public",label:"public"},{value:"audit",label:"audit"}]},{id:"w-action",type:"action-button",label:"Refresh",command:"demo.refresh",variant:"primary"}]}},e={args:{widgets:[{id:"w-section",type:"section",label:"Replicas",collapsible:!0,children:[{id:"s-1",type:"status-indicator",label:"replica-1",icon:"circle",status:"ok"},{id:"s-2",type:"status-indicator",label:"replica-2",icon:"circle",status:"warning"},{id:"s-3",type:"status-indicator",label:"replica-3",icon:"circle",status:"error"}]}]}},i={args:{widgets:[{id:"v-1",type:"text",content:"Shown",style:"value"},{id:"v-2",type:"text",content:"Hidden",style:"value",visible:!1},{id:"v-3",type:"status-indicator",label:"Also shown",icon:"circle",status:"ok"}]}},r={args:{widgets:[]}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    widgets: [{
      id: 'w-label',
      type: 'text',
      content: 'Connection',
      style: 'label'
    }, {
      id: 'w-value',
      type: 'text',
      content: 'prod-postgres',
      style: 'value'
    }, {
      id: 'w-status',
      type: 'status-indicator',
      label: 'Connected',
      icon: 'circle',
      status: 'ok'
    }, {
      id: 'w-sep',
      type: 'separator'
    }, {
      id: 'w-select',
      type: 'selector',
      label: 'Schema',
      onChange: 'demo.setSchema',
      value: 'public',
      options: [{
        value: 'public',
        label: 'public'
      }, {
        value: 'audit',
        label: 'audit'
      }]
    }, {
      id: 'w-action',
      type: 'action-button',
      label: 'Refresh',
      command: 'demo.refresh',
      variant: 'primary'
    }] satisfies Widget[]
  }
}`,...t.parameters?.docs?.source},description:{story:"A mix of the primitive widget types rendered in sequence.",...t.parameters?.docs?.description}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  args: {
    widgets: [{
      id: 'w-section',
      type: 'section',
      label: 'Replicas',
      collapsible: true,
      children: [{
        id: 's-1',
        type: 'status-indicator',
        label: 'replica-1',
        icon: 'circle',
        status: 'ok'
      }, {
        id: 's-2',
        type: 'status-indicator',
        label: 'replica-2',
        icon: 'circle',
        status: 'warning'
      }, {
        id: 's-3',
        type: 'status-indicator',
        label: 'replica-3',
        icon: 'circle',
        status: 'error'
      }]
    }] satisfies Widget[]
  }
}`,...e.parameters?.docs?.source},description:{story:"A section nesting other widgets — exercises the recursive render path.",...e.parameters?.docs?.description}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    widgets: [{
      id: 'v-1',
      type: 'text',
      content: 'Shown',
      style: 'value'
    }, {
      id: 'v-2',
      type: 'text',
      content: 'Hidden',
      style: 'value',
      visible: false
    }, {
      id: 'v-3',
      type: 'status-indicator',
      label: 'Also shown',
      icon: 'circle',
      status: 'ok'
    }] satisfies Widget[]
  }
}`,...i.parameters?.docs?.source},description:{story:"Hidden widgets are skipped; only visible ones render.",...i.parameters?.docs?.description}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    widgets: []
  }
}`,...r.parameters?.docs?.source},description:{story:"Empty widget list renders nothing.",...r.parameters?.docs?.description}}};const ne=["MixedWidgets","NestedSection","RespectsVisibility","Empty"];export{r as Empty,t as MixedWidgets,e as NestedSection,i as RespectsVisibility,ne as __namedExportsOrder,oe as default};
