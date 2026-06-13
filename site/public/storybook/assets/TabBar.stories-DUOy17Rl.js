import{J as o,B as l}from"./iframe-CdY22T7n.js";import{u as I}from"./tabs-C7I9_q2c.js";import{a as F,u as te}from"./connections-DUId3Rta.js";import{r as Q}from"./tab-actions-BWtN1_vi.js";import{i as ae}from"./initial-autocommit-U4zp3Q6E.js";import"./ThemeProvider-DNYYmpnc.js";import{a as A}from"./cn-DDt1maD9.js";import"./Box-Bd47NzIT.js";import{F as N}from"./Flex-CE2f2iq4.js";import"./Stack--Ivib9E_.js";import"./Grid-C7p1bp0f.js";import"./Container-D0pENg5w.js";import"./Divider-CC5zJA6v.js";import"./Spacer-B6mR4OMa.js";import"./ScrollArea-DsVAjX50.js";import"./AspectRatio-PTPAY6Hu.js";import"./Card-UMTkYlih.js";import"./Panel-CrM5lnRj.js";import"./Modal-EvcNrSt5.js";import"./Sheet-Bui5TeLS.js";import"./Popover-ekmZQG1b.js";import{T as re}from"./Tooltip-DFQSTWFy.js";import"./DropdownMenu-DPcpRel2.js";import"./ContextMenu-BOut3BPG.js";import"./Accordion-BJdES6PL.js";import"./GradientSurface-C281tc_L.js";import{I as q}from"./Button-DVlKTRa-.js";import"./Input-DjpTQLBk.js";import"./Textarea-CzIEnTGU.js";import"./Label-gu33wJKO.js";import"./FormField-CgphHAJ9.js";import"./Select-CAB-yi5k.js";import"./Checkbox-DDEoxGC3.js";import"./Radio-B7PLoi94.js";import"./Switch-BBKi_QXD.js";import"./Slider-DFgVipQ_.js";import"./NumberInput-CxGbH90u.js";import"./SearchInput-CAJDyJI7.js";import"./PasswordInput-yqvteJ6H.js";import"./TagsInput-DUVVsLjJ.js";import"./DatePicker-BFX3pHnd.js";import"./ColorInput-jrVGPdr-.js";import"./ColorPicker-CTQREHAa.js";import"./FileContentInput-JQwPf_a6.js";import"./FilePathInput-BcZ3Lft3.js";import"./Badge-Dn_M9v_L.js";import"./BadgeIndicator-BlVGNMQr.js";import"./Tag-96dLrhkw.js";import"./Avatar-BtYeYK_B.js";import"./Skeleton-BIOO4slx.js";import"./EmptyState-lPmgnzUi.js";import"./KeyValue-a9TLj5lg.js";import"./Table-BjAIyt7e.js";import"./List-DZhZIDuR.js";import"./TreeItem-Dy-Qf4il.js";import"./CodeView-DwjwXYkg.js";import"./Toast-DFHqdqIU.js";import"./Alert-Dvw7u8hm.js";import"./Progress-BZJHEeVB.js";import"./Spinner-BZmpou-y.js";import"./Banner-B-2Lw8fl.js";import"./Tabs-DFrZiyUC.js";import"./Breadcrumb-Gq6pv0jV.js";import"./Link-BtAoe6Yk.js";import"./Pagination-k2D09rK0.js";import"./Text-u8VLJp0e.js";import"./Heading-BkWmjzHt.js";import"./Code-3CWmbko6.js";import"./KbdGroup-CVThv8mv.js";import"./VisuallyHidden-ZCvqR7kA.js";import"./index-kMnmcFYy.js";import"./ResizeHandle-BA8IuddH.js";import{T as oe}from"./TabItem-CgZA9ZKG.js";import{u as ne}from"./I18nProvider-QSPSpfHa.js";import{C as se}from"./chevron-left-XPJ7hgLI.js";import{C as ie}from"./chevron-right-BAbzGsgL.js";import{P as ce}from"./plus-CAnyLFIc.js";import"./preload-helper-PPVm8Dsz.js";import"./ipc-CvYYIIIu.js";import"./selection-CNDBGd8q.js";import"./react-CM93qTYy.js";import"./ui-D4eVvrGh.js";import"./settings-Df4NhSNk.js";import"./index-8X-GOh7L.js";import"./notifications-CxwpcP25.js";import"./toast-CRDfB1Gr.js";import"./schema-DS6dFCac.js";import"./driver-capabilities-BByz55u6.js";import"./statement-status-BUm074p9.js";import"./index-CqE97RaD.js";import"./floating-ui.react-BTPmBFa-.js";import"./chevron-down-D2vYOdxz.js";import"./createLucideIcon-CIh8D4qA.js";import"./check-BxkDBxqF.js";import"./x-CFCsdqrP.js";import"./upload-CNDn8ix9.js";import"./shield-DDsFW79G.js";import"./useClipboard-D688GeTN.js";import"./info-xDV3YaJU.js";import"./triangle-alert-BmHsaBbn.js";import"./circle-check-CBnAbgkE.js";import"./arrow-down-sHqQ2fUb.js";import"./arrow-up-DGQOQQzZ.js";import"./index-Cf8GF5kW.js";import"./party-popper-BsLbN0Ql.js";import"./sparkles-CxexV2Kg.js";import"./settings-CXM-ENgy.js";import"./package-Bg4X5YjY.js";import"./puzzle-BMfHqn80.js";import"./table-2-BDbQiJoD.js";import"./plug-DvKOIYjE.js";import"./git-fork-C6-3uYqi.js";function le(){const e=o.useRef(null),[a,r]=o.useState(!1),[u,y]=o.useState(!1),m=o.useCallback(()=>{const t=e.current;t&&(r(t.scrollLeft>0),y(t.scrollLeft+t.clientWidth<t.scrollWidth-1))},[]);o.useEffect(()=>{const t=e.current;if(!t)return;m(),t.addEventListener("scroll",m,{passive:!0});const s=new ResizeObserver(m);s.observe(t);const c=new MutationObserver(m);return c.observe(t,{childList:!0}),()=>{t.removeEventListener("scroll",m),s.disconnect(),c.disconnect()}},[m]);const p=o.useCallback(()=>{e.current?.scrollBy({left:-200,behavior:"smooth"})},[]),g=o.useCallback(()=>{e.current?.scrollBy({left:200,behavior:"smooth"})},[]),f=o.useCallback(t=>{const s=e.current;if(!s)return;const c=s.querySelector(`[data-tab-id="${t}"]`);c&&c.scrollIntoView({block:"nearest",inline:"nearest",behavior:"smooth"})},[]),v=o.useCallback(t=>{const s=e.current;s&&Math.abs(t.deltaY)>Math.abs(t.deltaX)&&(s.scrollLeft+=t.deltaY,t.preventDefault())},[]);return{scrollRef:e,canScrollLeft:a,canScrollRight:u,scrollLeft:p,scrollRight:g,scrollIntoView:f,onWheel:v}}function me({onReorder:e}){const[a,r]=o.useState(null),[u,y]=o.useState(null),m=o.useRef(0),p=o.useRef(!1),g=o.useCallback((t,s)=>{m.current=t.clientX,p.current=!1,r(s),t.dataTransfer.effectAllowed="move";const c=document.createElement("div");c.style.opacity="0",document.body.appendChild(c),t.dataTransfer.setDragImage(c,0,0),requestAnimationFrame(()=>c.remove())},[]),f=o.useCallback((t,s)=>{t.preventDefault(),t.dataTransfer.dropEffect="move",!p.current&&Math.abs(t.clientX-m.current)>3&&(p.current=!0),p.current&&y(s)},[]),v=o.useCallback(()=>{p.current&&a!==null&&u!==null&&a!==u&&e(a,u),r(null),y(null),p.current=!1},[a,u,e]);return{draggedIndex:a,dropIndex:u,onDragStart:g,onDragOver:f,onDragEnd:v}}function j(){const{t:e}=ne(),{tabs:a,activeTabId:r,setActiveTab:u,closeTab:y,closeOtherTabs:m,closeTabsToRight:p,closeAllTabs:g,addQueryTab:f,reorderTabs:v,duplicateTab:t}=I(),s=F(i=>i.activeConnectionId),c=te(),{scrollRef:$,canScrollLeft:U,canScrollRight:W,scrollLeft:X,scrollRight:V,scrollIntoView:M,onWheel:Y}=le(),{draggedIndex:O,dropIndex:J,onDragStart:K,onDragOver:G,onDragEnd:H}=me({onReorder:v});o.useEffect(()=>{r&&M(r)},[r,M]);const Z=(i,d)=>{const h=a.find(ee=>ee.id===i);return[{label:e("shell.tabBar.close"),onSelect:()=>Q(i,y)},{label:e("shell.tabBar.closeOthers"),onSelect:()=>m(i),disabled:a.length<=1},{label:e("shell.tabBar.closeToRight"),onSelect:()=>p(i),disabled:d>=a.length-1},{label:e("shell.tabBar.closeAll"),onSelect:()=>g()},{label:e("shell.tabBar.duplicate"),onSelect:()=>t(i),disabled:h?.type!=="query"},{label:e("shell.tabBar.copyTitle"),onSelect:()=>navigator.clipboard.writeText(h?.title??"")}]};return l.jsxs(N,{align:"end",gap:"xs",className:"h-10 shrink-0 bg-tab-bar-bg px-2 pt-1.5",children:[U&&l.jsx(q,{label:e("shell.tabBar.scrollLeft"),size:"xs",variant:"ghost",onClick:X,tabIndex:-1,className:A("shrink-0 text-text-tertiary hover:text-text-primary transition-opacity"),children:l.jsx(se,{size:14})}),l.jsx(N,{ref:$,onWheel:Y,align:"end",className:"flex-1 h-full overflow-x-hidden gap-0.5",children:a.map((i,d)=>l.jsx(oe,{tab:i,index:d,isActive:r===i.id,isDragged:O===d,isDropTarget:J===d&&O!==d,contextMenuItems:Z(i.id,d),onActivate:()=>u(i.id),onClose:()=>Q(i.id,y),onDragStart:h=>K(h,d),onDragOver:h=>G(h,d),onDragEnd:H},i.id))}),W&&l.jsx(q,{label:e("shell.tabBar.scrollRight"),size:"xs",variant:"ghost",onClick:V,tabIndex:-1,className:A("shrink-0 text-text-tertiary hover:text-text-primary transition-opacity"),children:l.jsx(ie,{size:14})}),l.jsx(re,{content:e("shell.tabBar.newTab"),side:"bottom",children:l.jsx(q,{label:e("shell.tabBar.newTab"),size:"xs",variant:"ghost",onClick:()=>f(s,null,{autoCommit:ae(c)}),className:"shrink-0 text-text-tertiary hover:text-text-primary",children:l.jsx(ce,{size:14})})})]})}j.__docgenInfo={description:"",methods:[],displayName:"TabBar"};const{expect:n,userEvent:R}=__STORYBOOK_MODULE_TEST__;function b(e={}){return{id:"q1",type:"query",title:"SELECT * FROM users",connectionId:"conn-1",schema:"public",sql:"SELECT * FROM users;",results:null,isExecuting:!1,error:null,isDirty:!1,...e}}function L(e={}){return{id:"t1",type:"table",title:"users",connectionId:"conn-1",tableName:"users",schema:"public",...e}}function _(e={}){return{id:"er1",type:"er-diagram",title:"ER Diagram — public",connectionId:"conn-1",schema:"public",...e}}function P(e={}){return{id:"cf1",type:"connection-form",title:"New Connection",...e}}function z(e={}){return{id:"pd1",type:"plugin-detail",title:"MongoDB Driver",pluginName:"mongodb",...e}}function T(e,a){I.setState({tabs:e,activeTabId:a,recentlyClosed:[]}),F.setState({activeConnectionId:"conn-1"})}const Ta={title:"Components/Shell/TabBar",component:j,decorators:[e=>l.jsx("div",{style:{width:900},children:l.jsx(e,{})})]},B={beforeEach:()=>{const e=b();T([e],e.id)},play:async({canvas:e})=>{await n(e.getByText("SELECT * FROM users")).toBeInTheDocument(),await n(e.getByLabelText("New Query Tab")).toBeInTheDocument()}},x={beforeEach:()=>{T([b({id:"q1",title:"SELECT * FROM users"}),L({id:"t1",title:"orders"}),_({id:"er1",title:"ER Diagram — public"}),P({id:"cf1",title:"New Connection"}),z({id:"pd1",title:"MongoDB Driver"})],"t1")},play:async({canvas:e})=>{await n(e.getByText("SELECT * FROM users")).toBeInTheDocument(),await n(e.getByText("orders")).toBeInTheDocument(),await n(e.getByText("ER Diagram — public")).toBeInTheDocument(),await n(e.getByText("New Connection")).toBeInTheDocument(),await n(e.getByText("MongoDB Driver")).toBeInTheDocument()}},w={beforeEach:()=>{T([b({id:"q1",title:"Unsaved query",isDirty:!0}),b({id:"q2",title:"Saved query",isDirty:!1})],"q1")},play:async({canvas:e})=>{await n(e.getByText("Unsaved query")).toBeInTheDocument(),await n(e.getByText("Saved query")).toBeInTheDocument()}},D={beforeEach:()=>{T([],null)},play:async({canvas:e})=>{const a=e.getByLabelText("New Query Tab");await n(a).toBeInTheDocument(),await R.click(a);const r=I.getState();await n(r.tabs.length).toBe(1),await n(r.tabs[0].type).toBe("query")}},S={beforeEach:()=>{const e=Array.from({length:12},(a,r)=>b({id:`q${r}`,title:`Query ${r+1} — ${["users","orders","products","analytics","sessions","payments","invoices","logs","events","metrics","reports","backups"][r]}`}));T(e,"q0")},play:async({canvas:e})=>{await n(e.getByText("Query 1 — users")).toBeInTheDocument()}},E={beforeEach:()=>{T([b({id:"q1",title:"Tab One"}),L({id:"t1",title:"Tab Two"})],"q1")},play:async({canvas:e})=>{await R.click(e.getByText("Tab Two"));const a=I.getState();await n(a.activeTabId).toBe("t1")}},C={beforeEach:()=>{const e=b({id:"q1",title:"Closable tab"});T([e],e.id)},play:async({canvas:e})=>{const a=e.getByLabelText("Close tab");await R.click(a);const r=I.getState();await n(r.tabs.length).toBe(0),await n(r.recentlyClosed.length).toBe(1)}},k={beforeEach:()=>{T([b({id:"q1",title:"Query"}),L({id:"t1",title:"Table"}),_({id:"er1",title:"ER Diagram"}),P({id:"cf1",title:"Connection Form"}),z({id:"pd1",title:"Plugin Detail"})],"q1")}};B.parameters={...B.parameters,docs:{...B.parameters?.docs,source:{originalSource:`{
  beforeEach: () => {
    const tab = makeQueryTab();
    seedStores([tab], tab.id);
  },
  play: async ({
    canvas
  }) => {
    await expect(canvas.getByText('SELECT * FROM users')).toBeInTheDocument();
    await expect(canvas.getByLabelText('New Query Tab')).toBeInTheDocument();
  }
}`,...B.parameters?.docs?.source},description:{story:"Single active query tab — the default starting state.",...B.parameters?.docs?.description}}};x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  beforeEach: () => {
    seedStores([makeQueryTab({
      id: 'q1',
      title: 'SELECT * FROM users'
    }), makeTableTab({
      id: 't1',
      title: 'orders'
    }), makeErDiagramTab({
      id: 'er1',
      title: 'ER Diagram — public'
    }), makeConnectionFormTab({
      id: 'cf1',
      title: 'New Connection'
    }), makePluginDetailTab({
      id: 'pd1',
      title: 'MongoDB Driver'
    })], 't1');
  },
  play: async ({
    canvas
  }) => {
    await expect(canvas.getByText('SELECT * FROM users')).toBeInTheDocument();
    await expect(canvas.getByText('orders')).toBeInTheDocument();
    await expect(canvas.getByText('ER Diagram — public')).toBeInTheDocument();
    await expect(canvas.getByText('New Connection')).toBeInTheDocument();
    await expect(canvas.getByText('MongoDB Driver')).toBeInTheDocument();
  }
}`,...x.parameters?.docs?.source},description:{story:"Multiple tabs of mixed types with one active.",...x.parameters?.docs?.description}}};w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  beforeEach: () => {
    seedStores([makeQueryTab({
      id: 'q1',
      title: 'Unsaved query',
      isDirty: true
    }), makeQueryTab({
      id: 'q2',
      title: 'Saved query',
      isDirty: false
    })], 'q1');
  },
  play: async ({
    canvas
  }) => {
    await expect(canvas.getByText('Unsaved query')).toBeInTheDocument();
    await expect(canvas.getByText('Saved query')).toBeInTheDocument();
  }
}`,...w.parameters?.docs?.source},description:{story:"A dirty query tab shows the unsaved indicator dot.",...w.parameters?.docs?.description}}};D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  beforeEach: () => {
    seedStores([], null);
  },
  play: async ({
    canvas
  }) => {
    const newBtn = canvas.getByLabelText('New Query Tab');
    await expect(newBtn).toBeInTheDocument();
    await userEvent.click(newBtn);
    // After click, a new query tab should be added via the real store action
    const state = useTabsStore.getState();
    await expect(state.tabs.length).toBe(1);
    await expect(state.tabs[0].type).toBe('query');
  }
}`,...D.parameters?.docs?.source},description:{story:"No tabs open — empty bar with just the new-tab button.",...D.parameters?.docs?.description}}};S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  beforeEach: () => {
    const tabs = Array.from({
      length: 12
    }, (_, i) => makeQueryTab({
      id: \`q\${i}\`,
      title: \`Query \${i + 1} — \${['users', 'orders', 'products', 'analytics', 'sessions', 'payments', 'invoices', 'logs', 'events', 'metrics', 'reports', 'backups'][i]}\`
    }));
    seedStores(tabs, 'q0');
  },
  play: async ({
    canvas
  }) => {
    await expect(canvas.getByText('Query 1 — users')).toBeInTheDocument();
  }
}`,...S.parameters?.docs?.source},description:{story:"Many tabs to demonstrate overflow state.",...S.parameters?.docs?.description}}};E.parameters={...E.parameters,docs:{...E.parameters?.docs,source:{originalSource:`{
  beforeEach: () => {
    seedStores([makeQueryTab({
      id: 'q1',
      title: 'Tab One'
    }), makeTableTab({
      id: 't1',
      title: 'Tab Two'
    })], 'q1');
  },
  play: async ({
    canvas
  }) => {
    await userEvent.click(canvas.getByText('Tab Two'));
    const state = useTabsStore.getState();
    await expect(state.activeTabId).toBe('t1');
  }
}`,...E.parameters?.docs?.source},description:{story:"Clicking a tab switches the active tab via the real store.",...E.parameters?.docs?.description}}};C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  beforeEach: () => {
    const tab = makeQueryTab({
      id: 'q1',
      title: 'Closable tab'
    });
    seedStores([tab], tab.id);
  },
  play: async ({
    canvas
  }) => {
    const closeBtn = canvas.getByLabelText('Close tab');
    await userEvent.click(closeBtn);
    const state = useTabsStore.getState();
    await expect(state.tabs.length).toBe(0);
    await expect(state.recentlyClosed.length).toBe(1);
  }
}`,...C.parameters?.docs?.source},description:{story:"Clicking the close button removes the tab via the real store.",...C.parameters?.docs?.description}}};k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
  beforeEach: () => {
    seedStores([makeQueryTab({
      id: 'q1',
      title: 'Query'
    }), makeTableTab({
      id: 't1',
      title: 'Table'
    }), makeErDiagramTab({
      id: 'er1',
      title: 'ER Diagram'
    }), makeConnectionFormTab({
      id: 'cf1',
      title: 'Connection Form'
    }), makePluginDetailTab({
      id: 'pd1',
      title: 'Plugin Detail'
    })], 'q1');
  }
}`,...k.parameters?.docs?.source},description:{story:"All five tab types rendered together to verify icon and color mapping.",...k.parameters?.docs?.description}}};const ya=["SingleTab","MultipleTabs","DirtyQueryTab","EmptyBar","ManyTabs","TabActivation","TabClose","AllTabTypes"];export{k as AllTabTypes,w as DirtyQueryTab,D as EmptyBar,S as ManyTabs,x as MultipleTabs,B as SingleTab,E as TabActivation,C as TabClose,ya as __namedExportsOrder,Ta as default};
