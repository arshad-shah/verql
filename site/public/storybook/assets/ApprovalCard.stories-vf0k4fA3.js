import{B as a}from"./iframe-CdY22T7n.js";import{A as s}from"./ApprovalCard-c04ttdVL.js";import"./preload-helper-PPVm8Dsz.js";import"./Text-u8VLJp0e.js";import"./index-CqE97RaD.js";import"./cn-DDt1maD9.js";import"./Button-DVlKTRa-.js";import"./I18nProvider-QSPSpfHa.js";import"./index-8X-GOh7L.js";import"./settings-Df4NhSNk.js";import"./ipc-CvYYIIIu.js";import"./react-CM93qTYy.js";const{fn:c,expect:d,userEvent:i}=__STORYBOOK_MODULE_TEST__,o=e=>({requestId:"req-1",toolName:"execute_query",toolDescription:"Execute a SQL query against the database",parameters:{sql:"DROP TABLE users;"},display:"DROP TABLE users;",...e}),D={title:"Components/AI/ApprovalCard",component:s,decorators:[e=>a.jsx("div",{style:{width:360,padding:16},children:a.jsx(e,{})})]},r={args:{approval:o(),onRespond:c()},play:async({args:e,canvas:p})=>{const l=p.getByRole("button",{name:/run/i});await i.click(l),await d(e.onRespond).toHaveBeenCalledWith("req-1",!0)}},n={args:{approval:o(),onRespond:c()},play:async({args:e,canvas:p})=>{const l=p.getByRole("button",{name:/decline/i});await i.click(l),await d(e.onRespond).toHaveBeenCalledWith("req-1",!1)}},t={render:()=>{const e=()=>{};return a.jsxs("div",{className:"flex flex-col gap-4",children:[a.jsx(s,{approval:o({toolName:"execute_query",display:"DELETE FROM orders WHERE status = 'cancelled'"}),onRespond:e}),a.jsx(s,{approval:o({toolName:"modify_schema",toolDescription:"Modify database schema",display:"ALTER TABLE users ADD COLUMN phone VARCHAR(20)"}),onRespond:e}),a.jsx(s,{approval:o({toolName:"create_index",toolDescription:"Create a database index",display:"CREATE INDEX idx_orders_user_id ON orders(user_id)"}),onRespond:e})]})}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    approval: makeApproval(),
    onRespond: fn()
  },
  play: async ({
    args,
    canvas
  }) => {
    const approveBtn = canvas.getByRole('button', {
      name: /run/i
    });
    await userEvent.click(approveBtn);
    await expect(args.onRespond).toHaveBeenCalledWith('req-1', true);
  }
}`,...r.parameters?.docs?.source}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  args: {
    approval: makeApproval(),
    onRespond: fn()
  },
  play: async ({
    args,
    canvas
  }) => {
    const rejectBtn = canvas.getByRole('button', {
      name: /decline/i
    });
    await userEvent.click(rejectBtn);
    await expect(args.onRespond).toHaveBeenCalledWith('req-1', false);
  }
}`,...n.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  render: () => {
    const noop = () => {};
    return <div className="flex flex-col gap-4">
        <ApprovalCardContent approval={makeApproval({
        toolName: 'execute_query',
        display: 'DELETE FROM orders WHERE status = \\'cancelled\\''
      })} onRespond={noop} />
        <ApprovalCardContent approval={makeApproval({
        toolName: 'modify_schema',
        toolDescription: 'Modify database schema',
        display: 'ALTER TABLE users ADD COLUMN phone VARCHAR(20)'
      })} onRespond={noop} />
        <ApprovalCardContent approval={makeApproval({
        toolName: 'create_index',
        toolDescription: 'Create a database index',
        display: 'CREATE INDEX idx_orders_user_id ON orders(user_id)'
      })} onRespond={noop} />
      </div>;
  }
}`,...t.parameters?.docs?.source}}};const g=["Default","Reject","DifferentTools"];export{r as Default,t as DifferentTools,n as Reject,g as __namedExportsOrder,D as default};
