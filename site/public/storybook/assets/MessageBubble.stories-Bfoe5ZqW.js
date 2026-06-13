import{B as m}from"./iframe-CdY22T7n.js";import{M as p}from"./MessageBubble-DHgFFode.js";import"./preload-helper-PPVm8Dsz.js";import"./useClipboard-D688GeTN.js";import"./toast-CRDfB1Gr.js";import"./ipc-CvYYIIIu.js";import"./react-CM93qTYy.js";import"./I18nProvider-QSPSpfHa.js";import"./index-8X-GOh7L.js";import"./settings-Df4NhSNk.js";import"./Text-u8VLJp0e.js";import"./index-CqE97RaD.js";import"./cn-DDt1maD9.js";import"./Button-DVlKTRa-.js";import"./Avatar-BtYeYK_B.js";import"./ai-CvrNmzOO.js";import"./db-error-BYObUJyz.js";import"./driver-capabilities-BByz55u6.js";import"./data-nouns-BDP8SmCF.js";import"./notify-error-vjblLAFU.js";import"./notifications-CxwpcP25.js";import"./ui-D4eVvrGh.js";import"./connections-DUId3Rta.js";import"./schema-DS6dFCac.js";import"./tabs-C7I9_q2c.js";import"./selection-CNDBGd8q.js";import"./registry-D16PU4cN.js";import"./MarkdownContent-CJ7h--ZP.js";import"./CodeBlock-BZ__p80M.js";import"./ThemeProvider-DNYYmpnc.js";import"./Box-Bd47NzIT.js";import"./Flex-CE2f2iq4.js";import"./Stack--Ivib9E_.js";import"./Grid-C7p1bp0f.js";import"./Container-D0pENg5w.js";import"./Divider-CC5zJA6v.js";import"./Spacer-B6mR4OMa.js";import"./ScrollArea-DsVAjX50.js";import"./AspectRatio-PTPAY6Hu.js";import"./Card-UMTkYlih.js";import"./Panel-CrM5lnRj.js";import"./Modal-EvcNrSt5.js";import"./Sheet-Bui5TeLS.js";import"./Popover-ekmZQG1b.js";import"./Tooltip-DFQSTWFy.js";import"./floating-ui.react-BTPmBFa-.js";import"./index-kMnmcFYy.js";import"./index-Cf8GF5kW.js";import"./DropdownMenu-DPcpRel2.js";import"./ContextMenu-BOut3BPG.js";import"./Accordion-BJdES6PL.js";import"./chevron-down-D2vYOdxz.js";import"./createLucideIcon-CIh8D4qA.js";import"./chevron-right-BAbzGsgL.js";import"./GradientSurface-C281tc_L.js";import"./Input-DjpTQLBk.js";import"./Textarea-CzIEnTGU.js";import"./Label-gu33wJKO.js";import"./FormField-CgphHAJ9.js";import"./Select-CAB-yi5k.js";import"./check-BxkDBxqF.js";import"./Checkbox-DDEoxGC3.js";import"./Radio-B7PLoi94.js";import"./Switch-BBKi_QXD.js";import"./Slider-DFgVipQ_.js";import"./NumberInput-CxGbH90u.js";import"./SearchInput-CAJDyJI7.js";import"./PasswordInput-yqvteJ6H.js";import"./TagsInput-DUVVsLjJ.js";import"./x-CFCsdqrP.js";import"./DatePicker-BFX3pHnd.js";import"./chevron-left-XPJ7hgLI.js";import"./ColorInput-jrVGPdr-.js";import"./ColorPicker-CTQREHAa.js";import"./FileContentInput-JQwPf_a6.js";import"./upload-CNDn8ix9.js";import"./shield-DDsFW79G.js";import"./FilePathInput-BcZ3Lft3.js";import"./Badge-Dn_M9v_L.js";import"./BadgeIndicator-BlVGNMQr.js";import"./Tag-96dLrhkw.js";import"./Skeleton-BIOO4slx.js";import"./EmptyState-lPmgnzUi.js";import"./KeyValue-a9TLj5lg.js";import"./Table-BjAIyt7e.js";import"./List-DZhZIDuR.js";import"./TreeItem-Dy-Qf4il.js";import"./CodeView-DwjwXYkg.js";import"./Toast-DFHqdqIU.js";import"./info-xDV3YaJU.js";import"./triangle-alert-BmHsaBbn.js";import"./circle-check-CBnAbgkE.js";import"./Alert-Dvw7u8hm.js";import"./Progress-BZJHEeVB.js";import"./Spinner-BZmpou-y.js";import"./Banner-B-2Lw8fl.js";import"./Tabs-DFrZiyUC.js";import"./Breadcrumb-Gq6pv0jV.js";import"./Link-BtAoe6Yk.js";import"./Pagination-k2D09rK0.js";import"./Heading-BkWmjzHt.js";import"./Code-3CWmbko6.js";import"./KbdGroup-CVThv8mv.js";import"./arrow-down-sHqQ2fUb.js";import"./arrow-up-DGQOQQzZ.js";import"./VisuallyHidden-ZCvqR7kA.js";import"./ResizeHandle-BA8IuddH.js";import"./ActionChip-u0nwh5q9.js";import"./network-DvKTch__.js";import"./panel-left-BRFinNOa.js";import"./plus-CAnyLFIc.js";import"./settings-CXM-ENgy.js";import"./sparkles-CxexV2Kg.js";import"./rotate-ccw-C-lQpUWg.js";const r=i=>({id:"1",role:"user",content:"Hello",timestamp:Date.now(),...i}),be={title:"Components/AI/MessageBubble",component:p,decorators:[i=>m.jsx("div",{style:{width:360,padding:16},children:m.jsx(i,{})})]},e={args:{message:r({role:"user",content:"Show me all tables in the public schema"})}},t={args:{message:r({role:"assistant",content:"Here are the tables in the public schema:\n\n- `users` (12 columns)\n- `orders` (8 columns)\n- `products` (6 columns)"})}},o={args:{message:r({role:"assistant",content:"1,284 users signed up today."})}},s={args:{message:r({role:"assistant",isError:!0,content:"Failed to connect to the database. Check your connection settings."})}},a={args:{message:r({role:"assistant",content:`The \`users\` table has the following structure:

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | serial | NO | nextval('users_id_seq') |
| email | varchar(255) | NO | |
| name | varchar(100) | YES | |
| created_at | timestamp | NO | now() |
| updated_at | timestamp | YES | |
| status | varchar(20) | NO | 'active' |

The table has a primary key on \`id\` and a unique constraint on \`email\`. There are 3 indexes defined.`})}},n={args:{message:r({role:"assistant",content:`To get the top 10 customers by order count:

\`\`\`sql
SELECT u.name, COUNT(o.id) as order_count
FROM users u
JOIN orders o ON o.user_id = u.id
GROUP BY u.name
ORDER BY order_count DESC
LIMIT 10;
\`\`\`

This joins the \`users\` and \`orders\` tables and groups by user name.`})}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  args: {
    message: makeMessage({
      role: 'user',
      content: 'Show me all tables in the public schema'
    })
  }
}`,...e.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    message: makeMessage({
      role: 'assistant',
      content: 'Here are the tables in the public schema:\\n\\n- \`users\` (12 columns)\\n- \`orders\` (8 columns)\\n- \`products\` (6 columns)'
    })
  }
}`,...t.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    message: makeMessage({
      role: 'assistant',
      content: '1,284 users signed up today.'
    })
  }
}`,...o.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    message: makeMessage({
      role: 'assistant',
      isError: true,
      content: 'Failed to connect to the database. Check your connection settings.'
    })
  }
}`,...s.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:"{\n  args: {\n    message: makeMessage({\n      role: 'assistant',\n      content: `The \\`users\\` table has the following structure:\\n\\n| Column | Type | Nullable | Default |\\n|--------|------|----------|---------|\\n| id | serial | NO | nextval('users_id_seq') |\\n| email | varchar(255) | NO | |\\n| name | varchar(100) | YES | |\\n| created_at | timestamp | NO | now() |\\n| updated_at | timestamp | YES | |\\n| status | varchar(20) | NO | 'active' |\\n\\nThe table has a primary key on \\`id\\` and a unique constraint on \\`email\\`. There are 3 indexes defined.`\n    })\n  }\n}",...a.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:"{\n  args: {\n    message: makeMessage({\n      role: 'assistant',\n      content: `To get the top 10 customers by order count:\\n\\n\\`\\`\\`sql\\nSELECT u.name, COUNT(o.id) as order_count\\nFROM users u\\nJOIN orders o ON o.user_id = u.id\\nGROUP BY u.name\\nORDER BY order_count DESC\\nLIMIT 10;\\n\\`\\`\\`\\n\\nThis joins the \\`users\\` and \\`orders\\` tables and groups by user name.`\n    })\n  }\n}",...n.parameters?.docs?.source}}};const Oe=["UserMessage","AssistantMessage","AssistantShortReply","AssistantError","LongContent","MarkdownContent"];export{s as AssistantError,t as AssistantMessage,o as AssistantShortReply,a as LongContent,n as MarkdownContent,e as UserMessage,Oe as __namedExportsOrder,be as default};
