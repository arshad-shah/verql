import{J as a,B as o}from"./iframe-CdY22T7n.js";import{S as i}from"./SchemaSegment-B3seFBsu.js";import{u as m}from"./tabs-C7I9_q2c.js";import"./preload-helper-PPVm8Dsz.js";import"./StatusBarSegment-B9b9S1Aa.js";import"./index-CqE97RaD.js";import"./cn-DDt1maD9.js";import"./ipc-CvYYIIIu.js";import"./selection-CNDBGd8q.js";import"./react-CM93qTYy.js";import"./ui-D4eVvrGh.js";import"./settings-Df4NhSNk.js";import"./index-8X-GOh7L.js";const{fn:u}=__STORYBOOK_MODULE_TEST__;function n(e={}){return{id:"q1",type:"query",title:"SELECT * FROM users",connectionId:"conn-1",schema:"public",sql:"SELECT 1;",results:null,isExecuting:!1,error:null,isDirty:!1,...e}}function c(e){m.setState({tabs:e?[e]:[],activeTabId:e?e.id:null})}const j={title:"Components/Shell/StatusBar/SchemaSegment",component:i,parameters:{layout:"centered"},args:{onClick:u()},decorators:[e=>o.jsx("div",{className:"flex h-7 items-stretch bg-bg-primary border border-border-default rounded",children:o.jsx(e,{})})]},r={decorators:[e=>(a.useEffect(()=>{c(n())},[]),o.jsx(e,{}))]},t={decorators:[e=>(a.useEffect(()=>{c(n({schema:"analytics"}))},[]),o.jsx(e,{}))]},s={decorators:[e=>(a.useEffect(()=>{c(null)},[]),o.jsx(e,{}))]};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  decorators: [Story => {
    useEffect(() => {
      seed(makeQueryTab());
    }, []);
    return <Story />;
  }]
}`,...r.parameters?.docs?.source},description:{story:"Active query tab on the `public` schema.",...r.parameters?.docs?.description}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  decorators: [Story => {
    useEffect(() => {
      seed(makeQueryTab({
        schema: 'analytics'
      }));
    }, []);
    return <Story />;
  }]
}`,...t.parameters?.docs?.source},description:{story:"Active query tab on a custom schema.",...t.parameters?.docs?.description}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  decorators: [Story => {
    useEffect(() => {
      seed(null);
    }, []);
    return <Story />;
  }]
}`,...s.parameters?.docs?.source},description:{story:"No active query tab → renders nothing.",...s.parameters?.docs?.description}}};const q=["PublicSchema","CustomSchema","NoQueryTab"];export{t as CustomSchema,s as NoQueryTab,r as PublicSchema,q as __namedExportsOrder,j as default};
