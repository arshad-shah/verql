import{B as e}from"./iframe-CdY22T7n.js";import{G as n}from"./GradientSurface-C281tc_L.js";import"./preload-helper-PPVm8Dsz.js";import"./index-CqE97RaD.js";import"./cn-DDt1maD9.js";const p={title:"Primitives/Surfaces/GradientSurface",component:n,argTypes:{tone:{control:"select",options:["accent","neutral"]},intensity:{control:"select",options:["subtle","bold"]}}},o=()=>e.jsxs("div",{className:"flex h-40 w-56 flex-col justify-end p-5 gap-1",children:[e.jsx("div",{className:"h-8 w-8 rounded-lg",style:{background:"linear-gradient(140deg,var(--color-accent),var(--color-accent-emphasis))"}}),e.jsx("span",{className:"text-text-primary font-semibold",children:"Verql"}),e.jsx("span",{className:"text-text-secondary text-xs",children:"A theme-derived gradient surface."})]}),s={args:{tone:"accent",intensity:"subtle"},render:r=>e.jsx(n,{...r,className:"rounded-xl border border-border-default",children:e.jsx(o,{})})},a={render:()=>e.jsx("div",{className:"flex flex-wrap gap-4",children:["accent","neutral"].map(r=>["subtle","bold"].map(t=>e.jsxs("div",{className:"flex flex-col gap-1.5",children:[e.jsxs("span",{className:"text-xs text-text-muted",children:[r," · ",t]}),e.jsx(n,{tone:r,intensity:t,className:"rounded-xl border border-border-default",children:e.jsx(o,{})})]},`${r}-${t}`)))})};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    tone: 'accent',
    intensity: 'subtle'
  },
  render: args => <GradientSurface {...args} className="rounded-xl border border-border-default">
      <Sample />
    </GradientSurface>
}`,...s.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  render: () => <div className="flex flex-wrap gap-4">
      {(['accent', 'neutral'] as const).map(tone => (['subtle', 'bold'] as const).map(intensity => <div key={\`\${tone}-\${intensity}\`} className="flex flex-col gap-1.5">
            <span className="text-xs text-text-muted">{tone} · {intensity}</span>
            <GradientSurface tone={tone} intensity={intensity} className="rounded-xl border border-border-default">
              <Sample />
            </GradientSurface>
          </div>))}
    </div>
}`,...a.parameters?.docs?.source},description:{story:"All tone × intensity combinations.",...a.parameters?.docs?.description}}};const x=["Default","Variants"];export{s as Default,a as Variants,x as __namedExportsOrder,p as default};
