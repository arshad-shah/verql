import{B as t}from"./iframe-CdY22T7n.js";import{R as a,i as m,T as p}from"./TableNode-BUxtmnUg.js";import"./preload-helper-PPVm8Dsz.js";import"./index-DTpuwKqW.js";import"./index-kMnmcFYy.js";import"./index-Cf8GF5kW.js";import"./ThemeProvider-DNYYmpnc.js";import"./settings-Df4NhSNk.js";import"./ipc-CvYYIIIu.js";import"./react-CM93qTYy.js";import"./Box-Bd47NzIT.js";import"./cn-DDt1maD9.js";import"./Flex-CE2f2iq4.js";import"./Stack--Ivib9E_.js";import"./Grid-C7p1bp0f.js";import"./Container-D0pENg5w.js";import"./Divider-CC5zJA6v.js";import"./Spacer-B6mR4OMa.js";import"./ScrollArea-DsVAjX50.js";import"./AspectRatio-PTPAY6Hu.js";import"./Card-UMTkYlih.js";import"./index-CqE97RaD.js";import"./Panel-CrM5lnRj.js";import"./Modal-EvcNrSt5.js";import"./Sheet-Bui5TeLS.js";import"./Popover-ekmZQG1b.js";import"./Tooltip-DFQSTWFy.js";import"./floating-ui.react-BTPmBFa-.js";import"./DropdownMenu-DPcpRel2.js";import"./ContextMenu-BOut3BPG.js";import"./Accordion-BJdES6PL.js";import"./chevron-down-D2vYOdxz.js";import"./createLucideIcon-CIh8D4qA.js";import"./chevron-right-BAbzGsgL.js";import"./GradientSurface-C281tc_L.js";import"./Button-DVlKTRa-.js";import"./Input-DjpTQLBk.js";import"./Textarea-CzIEnTGU.js";import"./Label-gu33wJKO.js";import"./FormField-CgphHAJ9.js";import"./Select-CAB-yi5k.js";import"./check-BxkDBxqF.js";import"./Checkbox-DDEoxGC3.js";import"./Radio-B7PLoi94.js";import"./Switch-BBKi_QXD.js";import"./Slider-DFgVipQ_.js";import"./NumberInput-CxGbH90u.js";import"./SearchInput-CAJDyJI7.js";import"./PasswordInput-yqvteJ6H.js";import"./TagsInput-DUVVsLjJ.js";import"./x-CFCsdqrP.js";import"./DatePicker-BFX3pHnd.js";import"./chevron-left-XPJ7hgLI.js";import"./ColorInput-jrVGPdr-.js";import"./ColorPicker-CTQREHAa.js";import"./FileContentInput-JQwPf_a6.js";import"./upload-CNDn8ix9.js";import"./shield-DDsFW79G.js";import"./FilePathInput-BcZ3Lft3.js";import"./Badge-Dn_M9v_L.js";import"./BadgeIndicator-BlVGNMQr.js";import"./Tag-96dLrhkw.js";import"./Avatar-BtYeYK_B.js";import"./Skeleton-BIOO4slx.js";import"./EmptyState-lPmgnzUi.js";import"./KeyValue-a9TLj5lg.js";import"./Table-BjAIyt7e.js";import"./List-DZhZIDuR.js";import"./TreeItem-Dy-Qf4il.js";import"./CodeView-DwjwXYkg.js";import"./useClipboard-D688GeTN.js";import"./toast-CRDfB1Gr.js";import"./I18nProvider-QSPSpfHa.js";import"./index-8X-GOh7L.js";import"./Toast-DFHqdqIU.js";import"./Text-u8VLJp0e.js";import"./info-xDV3YaJU.js";import"./triangle-alert-BmHsaBbn.js";import"./circle-check-CBnAbgkE.js";import"./Alert-Dvw7u8hm.js";import"./Progress-BZJHEeVB.js";import"./Spinner-BZmpou-y.js";import"./Banner-B-2Lw8fl.js";import"./Tabs-DFrZiyUC.js";import"./Breadcrumb-Gq6pv0jV.js";import"./Link-BtAoe6Yk.js";import"./Pagination-k2D09rK0.js";import"./Heading-BkWmjzHt.js";import"./Code-3CWmbko6.js";import"./KbdGroup-CVThv8mv.js";import"./arrow-down-sHqQ2fUb.js";import"./arrow-up-DGQOQQzZ.js";import"./VisuallyHidden-ZCvqR7kA.js";import"./ResizeHandle-BA8IuddH.js";import"./link-pR3DmJnL.js";const s={tableNode:p};function n({data:e}){const o=[{id:e.tableName,type:"tableNode",position:{x:0,y:0},data:e}];return t.jsx("div",{style:{width:360,height:320},children:t.jsx(a,{children:t.jsx(m,{nodes:o,edges:[],nodeTypes:s,fitView:!0,minZoom:.2,maxZoom:2,proOptions:{hideAttribution:!0}})})})}const Xr={title:"Components/Er/TableNode",component:n},r={args:{data:{tableName:"orders",color:"#7c6ff7",columns:[{name:"id",dataType:"uuid",isPrimaryKey:!0,isForeignKey:!1},{name:"customer_id",dataType:"uuid",isPrimaryKey:!1,isForeignKey:!0},{name:"total",dataType:"numeric",isPrimaryKey:!1,isForeignKey:!1},{name:"status",dataType:"text",isPrimaryKey:!1,isForeignKey:!1},{name:"created_at",dataType:"timestamptz",isPrimaryKey:!1,isForeignKey:!1}]}}},i={args:{data:{tableName:"tags",color:"#28c840",columns:[{name:"id",dataType:"serial",isPrimaryKey:!0,isForeignKey:!1},{name:"label",dataType:"varchar(64)",isPrimaryKey:!1,isForeignKey:!1}]}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    data: {
      tableName: 'orders',
      color: '#7c6ff7',
      columns: [{
        name: 'id',
        dataType: 'uuid',
        isPrimaryKey: true,
        isForeignKey: false
      }, {
        name: 'customer_id',
        dataType: 'uuid',
        isPrimaryKey: false,
        isForeignKey: true
      }, {
        name: 'total',
        dataType: 'numeric',
        isPrimaryKey: false,
        isForeignKey: false
      }, {
        name: 'status',
        dataType: 'text',
        isPrimaryKey: false,
        isForeignKey: false
      }, {
        name: 'created_at',
        dataType: 'timestamptz',
        isPrimaryKey: false,
        isForeignKey: false
      }]
    }
  }
}`,...r.parameters?.docs?.source},description:{story:"A table with a primary key, a foreign key, and plain columns.",...r.parameters?.docs?.description}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    data: {
      tableName: 'tags',
      color: '#28c840',
      columns: [{
        name: 'id',
        dataType: 'serial',
        isPrimaryKey: true,
        isForeignKey: false
      }, {
        name: 'label',
        dataType: 'varchar(64)',
        isPrimaryKey: false,
        isForeignKey: false
      }]
    }
  }
}`,...i.parameters?.docs?.source},description:{story:"A small lookup table with only a primary key.",...i.parameters?.docs?.description}}};const Yr=["WithKeys","Minimal"];export{i as Minimal,r as WithKeys,Yr as __namedExportsOrder,Xr as default};
