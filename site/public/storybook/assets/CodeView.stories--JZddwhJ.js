import{B as t}from"./iframe-CdY22T7n.js";import{C as n}from"./CodeView-DwjwXYkg.js";import"./preload-helper-PPVm8Dsz.js";import"./useClipboard-D688GeTN.js";import"./toast-CRDfB1Gr.js";import"./ipc-CvYYIIIu.js";import"./react-CM93qTYy.js";import"./I18nProvider-QSPSpfHa.js";import"./index-8X-GOh7L.js";import"./settings-Df4NhSNk.js";const C={title:"Primitives/Data Display/CodeView",component:n},e={args:{code:"SELECT id, name FROM users WHERE active = true;",language:"sql"}},r={args:{code:`{
  "mcpServers": {
    "verql": { "type": "sse" }
  }
}`,language:"json"}},s={args:{code:`const result = await db.query("SELECT * FROM users");
console.log(result.rows);`,language:"javascript"}},o={args:{code:"SELECT count(*) FROM orders;",language:"sql",showCopy:!1}},a={args:{code:"SELECT id, name, email FROM customers LIMIT 10;",language:"sql",actions:t.jsx("button",{type:"button",style:{fontSize:10,padding:"2px 6px",borderRadius:4,cursor:"pointer"},children:"Insert"})}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  args: {
    code: 'SELECT id, name FROM users WHERE active = true;',
    language: 'sql'
  }
}`,...e.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    code: '{\\n  "mcpServers": {\\n    "verql": { "type": "sse" }\\n  }\\n}',
    language: 'json'
  }
}`,...r.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    code: 'const result = await db.query("SELECT * FROM users");\\nconsole.log(result.rows);',
    language: 'javascript'
  }
}`,...s.parameters?.docs?.source}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    code: 'SELECT count(*) FROM orders;',
    language: 'sql',
    showCopy: false
  }
}`,...o.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    code: 'SELECT id, name, email FROM customers LIMIT 10;',
    language: 'sql',
    actions: <button type="button" style={{
      fontSize: 10,
      padding: '2px 6px',
      borderRadius: 4,
      cursor: 'pointer'
    }}>
        Insert
      </button>
  }
}`,...a.parameters?.docs?.source}}};const y=["Sql","Json","JavaScript","NoCopyButton","WithActions"];export{s as JavaScript,r as Json,o as NoCopyButton,e as Sql,a as WithActions,y as __namedExportsOrder,C as default};
