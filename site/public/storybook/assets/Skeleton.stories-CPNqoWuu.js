import{B as e}from"./iframe-CdY22T7n.js";import{S as t}from"./Skeleton-BIOO4slx.js";import"./preload-helper-PPVm8Dsz.js";import"./index-CqE97RaD.js";import"./cn-DDt1maD9.js";const p={title:"Primitives/Data Display/Skeleton",component:t,argTypes:{shape:{control:"inline-radio",options:["line","block","circle","pill"]},animation:{control:"inline-radio",options:["shimmer","pulse","none"]}}},n={args:{style:{width:240,height:16}}},r={render:()=>e.jsxs("div",{style:{display:"flex",alignItems:"center",gap:24},children:[e.jsx(t,{shape:"line",style:{width:200}}),e.jsx(t,{shape:"pill"}),e.jsx(t,{shape:"circle",style:{width:40}}),e.jsx(t,{shape:"block",style:{width:160}})]})},s={render:()=>e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:12,width:280},children:[e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:11,color:"var(--color-text-secondary)",marginBottom:6},children:"shimmer"}),e.jsx(t,{animation:"shimmer"})]}),e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:11,color:"var(--color-text-secondary)",marginBottom:6},children:"pulse"}),e.jsx(t,{animation:"pulse"})]}),e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:11,color:"var(--color-text-secondary)",marginBottom:6},children:"none"}),e.jsx(t,{animation:"none"})]})]})},l={render:()=>e.jsxs("div",{style:{display:"flex",gap:24},children:[e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:11,color:"var(--color-text-secondary)",marginBottom:6},children:"Card skeleton"}),e.jsxs("div",{style:{width:280,padding:16,border:"1px solid var(--color-border-default)",borderRadius:8,display:"flex",flexDirection:"column",gap:10},children:[e.jsx(t,{style:{height:16,width:"60%"}}),e.jsx(t,{style:{height:12,width:"90%"}}),e.jsx(t,{style:{height:12,width:"75%"}}),e.jsxs("div",{style:{display:"flex",gap:8,marginTop:4},children:[e.jsx(t,{style:{height:28,width:72,borderRadius:6}}),e.jsx(t,{style:{height:28,width:60,borderRadius:6}})]})]})]}),e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:11,color:"var(--color-text-secondary)",marginBottom:6},children:"Table skeleton"}),e.jsx("div",{style:{width:400,display:"flex",flexDirection:"column",gap:8},children:Array.from({length:5},(d,i)=>e.jsxs("div",{style:{display:"flex",gap:12,alignItems:"center"},children:[e.jsx(t,{style:{height:14,width:120}}),e.jsx(t,{style:{height:14,width:80}}),e.jsx(t,{style:{height:14,flex:1}})]},i))})]}),e.jsxs("div",{children:[e.jsx("div",{style:{fontSize:11,color:"var(--color-text-secondary)",marginBottom:6},children:"Profile skeleton"}),e.jsxs("div",{style:{width:240,padding:16,border:"1px solid var(--color-border-default)",borderRadius:8,display:"flex",gap:12,alignItems:"center"},children:[e.jsx(t,{shape:"circle",style:{width:44}}),e.jsxs("div",{style:{flex:1,display:"flex",flexDirection:"column",gap:6},children:[e.jsx(t,{style:{height:12,width:"70%"}}),e.jsx(t,{style:{height:10,width:"50%"}})]})]})]})]})},a={render:()=>{const d=[{id:"nightshift",label:"Nightshift",bg:"#0B0F16",text:"#E8ECF3",base:"rgba(232, 236, 243, 0.10)",hi:"rgba(232, 236, 243, 0.22)"},{id:"lab",label:"Lab",bg:"#FAFAF6",text:"#1A1A1C",base:"rgba(26, 26, 28, 0.10)",hi:"rgba(26, 26, 28, 0.20)"},{id:"inkpaper",label:"Ink & Paper",bg:"#F2EBDE",text:"#14110F",base:"rgba(20, 17, 15, 0.10)",hi:"rgba(20, 17, 15, 0.20)"},{id:"dark",label:"Dark",bg:"#0d0d1a",text:"#ffffff",base:"rgba(255, 255, 255, 0.08)",hi:"rgba(255, 255, 255, 0.18)"},{id:"light",label:"Light",bg:"#ffffff",text:"#0d0d1a",base:"rgba(13, 13, 26, 0.08)",hi:"rgba(13, 13, 26, 0.18)"},{id:"midnight",label:"Midnight",bg:"#0a0a12",text:"#e0e0f0",base:"rgba(224, 224, 240, 0.08)",hi:"rgba(224, 224, 240, 0.18)"},{id:"dracula",label:"Dracula",bg:"#282a36",text:"#f8f8f2",base:"rgba(248, 248, 242, 0.08)",hi:"rgba(248, 248, 242, 0.18)"},{id:"nord",label:"Nord",bg:"#2e3440",text:"#eceff4",base:"rgba(236, 239, 244, 0.08)",hi:"rgba(236, 239, 244, 0.18)"},{id:"solarized",label:"Solarized",bg:"#002b36",text:"#fdf6e3",base:"rgba(253, 246, 227, 0.08)",hi:"rgba(253, 246, 227, 0.18)"},{id:"catppuccin",label:"Catppuccin",bg:"#1e1e2e",text:"#cdd6f4",base:"rgba(205, 214, 244, 0.08)",hi:"rgba(205, 214, 244, 0.18)"}];return e.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(2, 1fr)",gap:12},children:d.map(i=>e.jsxs("div",{style:{padding:16,borderRadius:8,background:i.bg,color:i.text,"--color-text-primary":i.text,"--color-skeleton-base":i.base,"--color-skeleton-highlight":i.hi},children:[e.jsx("div",{style:{fontSize:11,opacity:.7,marginBottom:8},children:i.label}),e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:6},children:[e.jsx(t,{style:{height:12,width:"70%"}}),e.jsx(t,{style:{height:10,width:"90%"}}),e.jsx(t,{style:{height:10,width:"50%"}})]})]},i.id))})}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  args: {
    style: {
      width: 240,
      height: 16
    }
  }
}`,...n.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: 24
  }}>
      <Skeleton shape="line" style={{
      width: 200
    }} />
      <Skeleton shape="pill" />
      <Skeleton shape="circle" style={{
      width: 40
    }} />
      <Skeleton shape="block" style={{
      width: 160
    }} />
    </div>
}`,...r.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    width: 280
  }}>
      <div>
        <div style={{
        fontSize: 11,
        color: 'var(--color-text-secondary)',
        marginBottom: 6
      }}>shimmer</div>
        <Skeleton animation="shimmer" />
      </div>
      <div>
        <div style={{
        fontSize: 11,
        color: 'var(--color-text-secondary)',
        marginBottom: 6
      }}>pulse</div>
        <Skeleton animation="pulse" />
      </div>
      <div>
        <div style={{
        fontSize: 11,
        color: 'var(--color-text-secondary)',
        marginBottom: 6
      }}>none</div>
        <Skeleton animation="none" />
      </div>
    </div>
}`,...s.parameters?.docs?.source}}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    gap: 24
  }}>
      <div>
        <div style={{
        fontSize: 11,
        color: 'var(--color-text-secondary)',
        marginBottom: 6
      }}>Card skeleton</div>
        <div style={{
        width: 280,
        padding: 16,
        border: '1px solid var(--color-border-default)',
        borderRadius: 8,
        display: 'flex',
        flexDirection: 'column',
        gap: 10
      }}>
          <Skeleton style={{
          height: 16,
          width: '60%'
        }} />
          <Skeleton style={{
          height: 12,
          width: '90%'
        }} />
          <Skeleton style={{
          height: 12,
          width: '75%'
        }} />
          <div style={{
          display: 'flex',
          gap: 8,
          marginTop: 4
        }}>
            <Skeleton style={{
            height: 28,
            width: 72,
            borderRadius: 6
          }} />
            <Skeleton style={{
            height: 28,
            width: 60,
            borderRadius: 6
          }} />
          </div>
        </div>
      </div>
      <div>
        <div style={{
        fontSize: 11,
        color: 'var(--color-text-secondary)',
        marginBottom: 6
      }}>Table skeleton</div>
        <div style={{
        width: 400,
        display: 'flex',
        flexDirection: 'column',
        gap: 8
      }}>
          {Array.from({
          length: 5
        }, (_, i) => <div key={i} style={{
          display: 'flex',
          gap: 12,
          alignItems: 'center'
        }}>
              <Skeleton style={{
            height: 14,
            width: 120
          }} />
              <Skeleton style={{
            height: 14,
            width: 80
          }} />
              <Skeleton style={{
            height: 14,
            flex: 1
          }} />
            </div>)}
        </div>
      </div>
      <div>
        <div style={{
        fontSize: 11,
        color: 'var(--color-text-secondary)',
        marginBottom: 6
      }}>Profile skeleton</div>
        <div style={{
        width: 240,
        padding: 16,
        border: '1px solid var(--color-border-default)',
        borderRadius: 8,
        display: 'flex',
        gap: 12,
        alignItems: 'center'
      }}>
          <Skeleton shape="circle" style={{
          width: 44
        }} />
          <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 6
        }}>
            <Skeleton style={{
            height: 12,
            width: '70%'
          }} />
            <Skeleton style={{
            height: 10,
            width: '50%'
          }} />
          </div>
        </div>
      </div>
    </div>
}`,...l.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  render: () => {
    // Concrete values are mirrored from \`themes-data.ts\` — what each bundled
    // theme actually ships. The story renders that for parity with the
    // running app instead of the color-mix fallback in tokens.css.
    type Swatch = {
      id: string;
      label: string;
      bg: string;
      text: string;
      base: string;
      hi: string;
    };
    const swatches: Swatch[] = [{
      id: 'nightshift',
      label: 'Nightshift',
      bg: '#0B0F16',
      text: '#E8ECF3',
      base: 'rgba(232, 236, 243, 0.10)',
      hi: 'rgba(232, 236, 243, 0.22)'
    }, {
      id: 'lab',
      label: 'Lab',
      bg: '#FAFAF6',
      text: '#1A1A1C',
      base: 'rgba(26, 26, 28, 0.10)',
      hi: 'rgba(26, 26, 28, 0.20)'
    }, {
      id: 'inkpaper',
      label: 'Ink & Paper',
      bg: '#F2EBDE',
      text: '#14110F',
      base: 'rgba(20, 17, 15, 0.10)',
      hi: 'rgba(20, 17, 15, 0.20)'
    }, {
      id: 'dark',
      label: 'Dark',
      bg: '#0d0d1a',
      text: '#ffffff',
      base: 'rgba(255, 255, 255, 0.08)',
      hi: 'rgba(255, 255, 255, 0.18)'
    }, {
      id: 'light',
      label: 'Light',
      bg: '#ffffff',
      text: '#0d0d1a',
      base: 'rgba(13, 13, 26, 0.08)',
      hi: 'rgba(13, 13, 26, 0.18)'
    }, {
      id: 'midnight',
      label: 'Midnight',
      bg: '#0a0a12',
      text: '#e0e0f0',
      base: 'rgba(224, 224, 240, 0.08)',
      hi: 'rgba(224, 224, 240, 0.18)'
    }, {
      id: 'dracula',
      label: 'Dracula',
      bg: '#282a36',
      text: '#f8f8f2',
      base: 'rgba(248, 248, 242, 0.08)',
      hi: 'rgba(248, 248, 242, 0.18)'
    }, {
      id: 'nord',
      label: 'Nord',
      bg: '#2e3440',
      text: '#eceff4',
      base: 'rgba(236, 239, 244, 0.08)',
      hi: 'rgba(236, 239, 244, 0.18)'
    }, {
      id: 'solarized',
      label: 'Solarized',
      bg: '#002b36',
      text: '#fdf6e3',
      base: 'rgba(253, 246, 227, 0.08)',
      hi: 'rgba(253, 246, 227, 0.18)'
    }, {
      id: 'catppuccin',
      label: 'Catppuccin',
      bg: '#1e1e2e',
      text: '#cdd6f4',
      base: 'rgba(205, 214, 244, 0.08)',
      hi: 'rgba(205, 214, 244, 0.18)'
    }];
    return <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: 12
    }}>
        {swatches.map(s => <div key={s.id} style={{
        padding: 16,
        borderRadius: 8,
        background: s.bg,
        color: s.text,
        ['--color-text-primary' as any]: s.text,
        ['--color-skeleton-base' as any]: s.base,
        ['--color-skeleton-highlight' as any]: s.hi
      }}>
            <div style={{
          fontSize: 11,
          opacity: 0.7,
          marginBottom: 8
        }}>{s.label}</div>
            <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 6
        }}>
              <Skeleton style={{
            height: 12,
            width: '70%'
          }} />
              <Skeleton style={{
            height: 10,
            width: '90%'
          }} />
              <Skeleton style={{
            height: 10,
            width: '50%'
          }} />
            </div>
          </div>)}
      </div>;
  }
}`,...a.parameters?.docs?.source},description:{story:`Renders the same skeleton inside swatches that mimic each theme's bg so
 you can visually verify contrast across the full bundled theme set.`,...a.parameters?.docs?.description}}};const y=["Default","Shapes","Animations","Variants","AcrossThemes"];export{a as AcrossThemes,s as Animations,n as Default,r as Shapes,l as Variants,y as __namedExportsOrder,p as default};
