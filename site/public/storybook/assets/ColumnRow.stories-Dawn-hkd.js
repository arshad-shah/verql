import{B as i}from"./iframe-CdY22T7n.js";import{C as s}from"./ColumnRow-kbPWTT2T.js";import"./preload-helper-PPVm8Dsz.js";import"./ContextMenu-BOut3BPG.js";import"./index-CqE97RaD.js";import"./cn-DDt1maD9.js";import"./useClipboard-D688GeTN.js";import"./toast-CRDfB1Gr.js";import"./ipc-CvYYIIIu.js";import"./react-CM93qTYy.js";import"./I18nProvider-QSPSpfHa.js";import"./index-8X-GOh7L.js";import"./settings-Df4NhSNk.js";import"./useDataNouns-CYpckCOG.js";import"./connections-DUId3Rta.js";import"./notifications-CxwpcP25.js";import"./schema-DS6dFCac.js";import"./tabs-C7I9_q2c.js";import"./selection-CNDBGd8q.js";import"./ui-D4eVvrGh.js";import"./driver-capabilities-BByz55u6.js";import"./data-nouns-BDP8SmCF.js";import"./link-pR3DmJnL.js";import"./createLucideIcon-CIh8D4qA.js";import"./hash-B34uKq7z.js";const E={title:"Components/Explorer/ColumnRow",component:s,args:{tableName:"users",connectionId:"demo"},decorators:[t=>i.jsx("div",{style:{width:280,padding:4,background:"var(--color-bg-secondary)",border:"1px solid var(--color-border-default)",borderRadius:8},children:i.jsx(t,{})})]},n=t=>({name:"id",dataType:"bigint",nullable:!1,defaultValue:null,isPrimaryKey:!1,isForeignKey:!1,...t}),r={args:{column:n({name:"id",dataType:"bigint",isPrimaryKey:!0})}},e={args:{column:n({name:"org_id",dataType:"uuid",isForeignKey:!0,references:{table:"organizations",column:"id"}})}},o={args:{column:n({name:"email",dataType:"varchar(255)"})}},a={args:{column:n({name:"extremely_long_descriptive_column_name_that_overflows",dataType:"character varying(1024)",nullable:!0})}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    column: col({
      name: 'id',
      dataType: 'bigint',
      isPrimaryKey: true
    })
  }
}`,...r.parameters?.docs?.source},description:{story:"A primary-key column — warning-tinted key icon + PK badge.",...r.parameters?.docs?.description}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  args: {
    column: col({
      name: 'org_id',
      dataType: 'uuid',
      isForeignKey: true,
      references: {
        table: 'organizations',
        column: 'id'
      }
    })
  }
}`,...e.parameters?.docs?.source},description:{story:"A foreign-key column — info-tinted link icon + FK badge.",...e.parameters?.docs?.description}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    column: col({
      name: 'email',
      dataType: 'varchar(255)'
    })
  }
}`,...o.parameters?.docs?.source},description:{story:"A plain column — neutral hash icon, no badge.",...o.parameters?.docs?.description}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    column: col({
      name: 'extremely_long_descriptive_column_name_that_overflows',
      dataType: 'character varying(1024)',
      nullable: true
    })
  }
}`,...a.parameters?.docs?.source},description:{story:"Long name + long type both truncate within the row.",...a.parameters?.docs?.description}}};const z=["PrimaryKey","ForeignKey","Plain","Truncated"];export{e as ForeignKey,o as Plain,r as PrimaryKey,a as Truncated,z as __namedExportsOrder,E as default};
