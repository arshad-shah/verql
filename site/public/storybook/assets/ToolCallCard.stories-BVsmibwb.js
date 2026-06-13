import{B as n,J as l}from"./iframe-CdY22T7n.js";import{T as c}from"./ToolCallCard-DI5c1FQt.js";import{u}from"./ai-CvrNmzOO.js";import"./preload-helper-PPVm8Dsz.js";import"./Text-u8VLJp0e.js";import"./index-CqE97RaD.js";import"./cn-DDt1maD9.js";import"./registry-D16PU4cN.js";import"./CodeBlock-BZ__p80M.js";import"./ThemeProvider-DNYYmpnc.js";import"./settings-Df4NhSNk.js";import"./ipc-CvYYIIIu.js";import"./react-CM93qTYy.js";import"./Box-Bd47NzIT.js";import"./Flex-CE2f2iq4.js";import"./Stack--Ivib9E_.js";import"./Grid-C7p1bp0f.js";import"./Container-D0pENg5w.js";import"./Divider-CC5zJA6v.js";import"./Spacer-B6mR4OMa.js";import"./ScrollArea-DsVAjX50.js";import"./AspectRatio-PTPAY6Hu.js";import"./Card-UMTkYlih.js";import"./Panel-CrM5lnRj.js";import"./Modal-EvcNrSt5.js";import"./Sheet-Bui5TeLS.js";import"./Popover-ekmZQG1b.js";import"./Tooltip-DFQSTWFy.js";import"./floating-ui.react-BTPmBFa-.js";import"./index-kMnmcFYy.js";import"./index-Cf8GF5kW.js";import"./DropdownMenu-DPcpRel2.js";import"./ContextMenu-BOut3BPG.js";import"./Accordion-BJdES6PL.js";import"./chevron-down-D2vYOdxz.js";import"./createLucideIcon-CIh8D4qA.js";import"./chevron-right-BAbzGsgL.js";import"./GradientSurface-C281tc_L.js";import"./Button-DVlKTRa-.js";import"./Input-DjpTQLBk.js";import"./Textarea-CzIEnTGU.js";import"./Label-gu33wJKO.js";import"./FormField-CgphHAJ9.js";import"./Select-CAB-yi5k.js";import"./check-BxkDBxqF.js";import"./Checkbox-DDEoxGC3.js";import"./Radio-B7PLoi94.js";import"./Switch-BBKi_QXD.js";import"./Slider-DFgVipQ_.js";import"./NumberInput-CxGbH90u.js";import"./SearchInput-CAJDyJI7.js";import"./PasswordInput-yqvteJ6H.js";import"./TagsInput-DUVVsLjJ.js";import"./x-CFCsdqrP.js";import"./DatePicker-BFX3pHnd.js";import"./chevron-left-XPJ7hgLI.js";import"./ColorInput-jrVGPdr-.js";import"./ColorPicker-CTQREHAa.js";import"./FileContentInput-JQwPf_a6.js";import"./upload-CNDn8ix9.js";import"./shield-DDsFW79G.js";import"./FilePathInput-BcZ3Lft3.js";import"./Badge-Dn_M9v_L.js";import"./BadgeIndicator-BlVGNMQr.js";import"./Tag-96dLrhkw.js";import"./Avatar-BtYeYK_B.js";import"./Skeleton-BIOO4slx.js";import"./EmptyState-lPmgnzUi.js";import"./KeyValue-a9TLj5lg.js";import"./Table-BjAIyt7e.js";import"./List-DZhZIDuR.js";import"./TreeItem-Dy-Qf4il.js";import"./CodeView-DwjwXYkg.js";import"./useClipboard-D688GeTN.js";import"./toast-CRDfB1Gr.js";import"./I18nProvider-QSPSpfHa.js";import"./index-8X-GOh7L.js";import"./Toast-DFHqdqIU.js";import"./info-xDV3YaJU.js";import"./triangle-alert-BmHsaBbn.js";import"./circle-check-CBnAbgkE.js";import"./Alert-Dvw7u8hm.js";import"./Progress-BZJHEeVB.js";import"./Spinner-BZmpou-y.js";import"./Banner-B-2Lw8fl.js";import"./Tabs-DFrZiyUC.js";import"./Breadcrumb-Gq6pv0jV.js";import"./Link-BtAoe6Yk.js";import"./Pagination-k2D09rK0.js";import"./Heading-BkWmjzHt.js";import"./Code-3CWmbko6.js";import"./KbdGroup-CVThv8mv.js";import"./arrow-down-sHqQ2fUb.js";import"./arrow-up-DGQOQQzZ.js";import"./VisuallyHidden-ZCvqR7kA.js";import"./ResizeHandle-BA8IuddH.js";import"./tabs-C7I9_q2c.js";import"./selection-CNDBGd8q.js";import"./ui-D4eVvrGh.js";import"./connections-DUId3Rta.js";import"./notifications-CxwpcP25.js";import"./schema-DS6dFCac.js";import"./driver-capabilities-BByz55u6.js";import"./loader-circle-O_NBEwYb.js";import"./db-error-BYObUJyz.js";import"./data-nouns-BDP8SmCF.js";import"./notify-error-vjblLAFU.js";function d(){window.electronAPI={invoke:async()=>{},on:()=>()=>{}}}const e=r=>({id:"call-1",role:"assistant",content:"",timestamp:Date.now(),toolCalls:[{id:"tc-1",name:"execute_query",arguments:JSON.stringify({sql:"SELECT count(*) FROM users;"})}],...r}),a=r=>({id:"res-1",role:"tool",toolCallId:"tc-1",content:JSON.stringify({success:!0,data:{rowCount:1284}}),timestamp:Date.now(),...r});function t(r){return function(){return l.useEffect(()=>{d(),u.setState({pendingApproval:r.pendingApproval??null})},[]),n.jsx(c,{message:r.message,result:r.result})}}const ge={title:"Components/AI/ToolCallCard",component:c,decorators:[r=>n.jsx("div",{style:{width:380,background:"var(--color-bg-primary)"},children:n.jsx(r,{})})]},o={render:t({message:e(),result:a()})},s={render:t({message:e(),result:a({content:JSON.stringify({error:'relation "userz" does not exist'})})})},i={render:t({message:e()})},m={render:t({message:e({toolCalls:[{id:"tc-1",name:"execute_query",arguments:JSON.stringify({sql:"DROP TABLE users;"})}]}),pendingApproval:{requestId:"req-1",toolName:"execute_query",toolDescription:"Execute a SQL query",parameters:{sql:"DROP TABLE users;"},display:"DROP TABLE users;"}})},p={render:t({message:e({toolCalls:[{id:"tc-1",name:"list_tables",arguments:JSON.stringify({schema:"public"})}]}),result:a({content:JSON.stringify({success:!0,data:{rowCount:12}})})})};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: seed({
    message: callMessage(),
    result: resultMessage()
  })
}`,...o.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render: seed({
    message: callMessage(),
    result: resultMessage({
      content: JSON.stringify({
        error: 'relation "userz" does not exist'
      })
    })
  })
}`,...s.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  render: seed({
    message: callMessage()
  })
}`,...i.parameters?.docs?.source}}};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  render: seed({
    message: callMessage({
      toolCalls: [{
        id: 'tc-1',
        name: 'execute_query',
        arguments: JSON.stringify({
          sql: 'DROP TABLE users;'
        })
      }]
    }),
    pendingApproval: {
      requestId: 'req-1',
      toolName: 'execute_query',
      toolDescription: 'Execute a SQL query',
      parameters: {
        sql: 'DROP TABLE users;'
      },
      display: 'DROP TABLE users;'
    }
  })
}`,...m.parameters?.docs?.source}}};p.parameters={...p.parameters,docs:{...p.parameters?.docs,source:{originalSource:`{
  render: seed({
    message: callMessage({
      toolCalls: [{
        id: 'tc-1',
        name: 'list_tables',
        arguments: JSON.stringify({
          schema: 'public'
        })
      }]
    }),
    result: resultMessage({
      content: JSON.stringify({
        success: true,
        data: {
          rowCount: 12
        }
      })
    })
  })
}`,...p.parameters?.docs?.source}}};const Se=["Succeeded","Failed","Executing","AwaitingApproval","SchemaLookup"];export{m as AwaitingApproval,i as Executing,s as Failed,p as SchemaLookup,o as Succeeded,Se as __namedExportsOrder,ge as default};
