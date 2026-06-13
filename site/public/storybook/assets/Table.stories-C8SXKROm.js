import{B as e}from"./iframe-CdY22T7n.js";import{T as l}from"./Table-BjAIyt7e.js";import"./preload-helper-PPVm8Dsz.js";import"./index-CqE97RaD.js";import"./cn-DDt1maD9.js";const m={title:"Primitives/Data Display/Table",component:l},o=[{id:1,name:"Alice Brown",email:"alice@example.com",role:"Admin"},{id:2,name:"Bob Smith",email:"bob@example.com",role:"Editor"},{id:3,name:"Charlie D",email:"charlie@example.com",role:"Viewer"},{id:4,name:"Diana E",email:"diana@example.com",role:"Editor"}],d={render:()=>e.jsx("div",{style:{width:480},children:e.jsxs(l,{children:[e.jsx(l.Header,{children:e.jsxs(l.Row,{children:[e.jsx(l.Head,{children:"ID"}),e.jsx(l.Head,{children:"Name"}),e.jsx(l.Head,{children:"Email"}),e.jsx(l.Head,{children:"Role"})]})}),e.jsx(l.Body,{children:o.map(a=>e.jsxs(l.Row,{children:[e.jsx(l.Cell,{children:a.id}),e.jsx(l.Cell,{children:a.name}),e.jsx(l.Cell,{children:a.email}),e.jsx(l.Cell,{children:a.role})]},a.id))})]})})},r={render:()=>e.jsx("div",{style:{display:"flex",flexDirection:"column",gap:32,width:480},children:["sm","md","lg"].map(a=>e.jsxs("div",{children:[e.jsxs("p",{style:{fontSize:12,marginBottom:8,color:"var(--color-text-secondary)"},children:["Size: ",a]}),e.jsxs(l,{children:[e.jsx(l.Header,{children:e.jsxs(l.Row,{children:[e.jsx(l.Head,{size:a,children:"ID"}),e.jsx(l.Head,{size:a,children:"Name"}),e.jsx(l.Head,{size:a,children:"Email"}),e.jsx(l.Head,{size:a,children:"Role"})]})}),e.jsx(l.Body,{children:o.map(n=>e.jsxs(l.Row,{children:[e.jsx(l.Cell,{size:a,children:n.id}),e.jsx(l.Cell,{size:a,children:n.name}),e.jsx(l.Cell,{size:a,children:n.email}),e.jsx(l.Cell,{size:a,children:n.role})]},n.id))})]})]},a))})},i={render:()=>e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:32,width:600},children:[e.jsxs("div",{children:[e.jsx("p",{style:{fontSize:12,marginBottom:8,color:"var(--color-text-secondary)"},children:"Empty (header only)"}),e.jsxs(l,{children:[e.jsx(l.Header,{children:e.jsxs(l.Row,{children:[e.jsx(l.Head,{children:"ID"}),e.jsx(l.Head,{children:"Name"}),e.jsx(l.Head,{children:"Email"}),e.jsx(l.Head,{children:"Role"})]})}),e.jsx(l.Body,{})]})]}),e.jsxs("div",{children:[e.jsx("p",{style:{fontSize:12,marginBottom:8,color:"var(--color-text-secondary)"},children:"Single row"}),e.jsxs(l,{children:[e.jsx(l.Header,{children:e.jsxs(l.Row,{children:[e.jsx(l.Head,{children:"ID"}),e.jsx(l.Head,{children:"Name"}),e.jsx(l.Head,{children:"Email"}),e.jsx(l.Head,{children:"Role"})]})}),e.jsx(l.Body,{children:e.jsxs(l.Row,{children:[e.jsx(l.Cell,{children:"1"}),e.jsx(l.Cell,{children:"Alice Brown"}),e.jsx(l.Cell,{children:"alice@example.com"}),e.jsx(l.Cell,{children:"Admin"})]})})]})]}),e.jsxs("div",{children:[e.jsx("p",{style:{fontSize:12,marginBottom:8,color:"var(--color-text-secondary)"},children:"Many columns (6+)"}),e.jsxs(l,{children:[e.jsx(l.Header,{children:e.jsxs(l.Row,{children:[e.jsx(l.Head,{children:"ID"}),e.jsx(l.Head,{children:"Name"}),e.jsx(l.Head,{children:"Email"}),e.jsx(l.Head,{children:"Role"}),e.jsx(l.Head,{children:"Department"}),e.jsx(l.Head,{children:"Status"}),e.jsx(l.Head,{children:"Joined"})]})}),e.jsxs(l.Body,{children:[e.jsxs(l.Row,{children:[e.jsx(l.Cell,{children:"1"}),e.jsx(l.Cell,{children:"Alice Brown"}),e.jsx(l.Cell,{children:"alice@example.com"}),e.jsx(l.Cell,{children:"Admin"}),e.jsx(l.Cell,{children:"Engineering"}),e.jsx(l.Cell,{children:"Active"}),e.jsx(l.Cell,{children:"2024-01-15"})]}),e.jsxs(l.Row,{children:[e.jsx(l.Cell,{children:"2"}),e.jsx(l.Cell,{children:"Bob Smith"}),e.jsx(l.Cell,{children:"bob@example.com"}),e.jsx(l.Cell,{children:"Editor"}),e.jsx(l.Cell,{children:"Marketing"}),e.jsx(l.Cell,{children:"Inactive"}),e.jsx(l.Cell,{children:"2023-08-22"})]})]})]})]})]})};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    width: 480
  }}>
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.Head>ID</Table.Head>
            <Table.Head>Name</Table.Head>
            <Table.Head>Email</Table.Head>
            <Table.Head>Role</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {users.map(user => <Table.Row key={user.id}>
              <Table.Cell>{user.id}</Table.Cell>
              <Table.Cell>{user.name}</Table.Cell>
              <Table.Cell>{user.email}</Table.Cell>
              <Table.Cell>{user.role}</Table.Cell>
            </Table.Row>)}
        </Table.Body>
      </Table>
    </div>
}`,...d.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: 32,
    width: 480
  }}>
      {(['sm', 'md', 'lg'] as const).map(size => <div key={size}>
          <p style={{
        fontSize: 12,
        marginBottom: 8,
        color: 'var(--color-text-secondary)'
      }}>Size: {size}</p>
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.Head size={size}>ID</Table.Head>
                <Table.Head size={size}>Name</Table.Head>
                <Table.Head size={size}>Email</Table.Head>
                <Table.Head size={size}>Role</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {users.map(user => <Table.Row key={user.id}>
                  <Table.Cell size={size}>{user.id}</Table.Cell>
                  <Table.Cell size={size}>{user.name}</Table.Cell>
                  <Table.Cell size={size}>{user.email}</Table.Cell>
                  <Table.Cell size={size}>{user.role}</Table.Cell>
                </Table.Row>)}
            </Table.Body>
          </Table>
        </div>)}
    </div>
}`,...r.parameters?.docs?.source}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: 32,
    width: 600
  }}>
      {/* Empty table — header only, no body rows */}
      <div>
        <p style={{
        fontSize: 12,
        marginBottom: 8,
        color: 'var(--color-text-secondary)'
      }}>Empty (header only)</p>
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.Head>ID</Table.Head>
              <Table.Head>Name</Table.Head>
              <Table.Head>Email</Table.Head>
              <Table.Head>Role</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body />
        </Table>
      </div>

      {/* Single row */}
      <div>
        <p style={{
        fontSize: 12,
        marginBottom: 8,
        color: 'var(--color-text-secondary)'
      }}>Single row</p>
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.Head>ID</Table.Head>
              <Table.Head>Name</Table.Head>
              <Table.Head>Email</Table.Head>
              <Table.Head>Role</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            <Table.Row>
              <Table.Cell>1</Table.Cell>
              <Table.Cell>Alice Brown</Table.Cell>
              <Table.Cell>alice@example.com</Table.Cell>
              <Table.Cell>Admin</Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table>
      </div>

      {/* Many columns (6+) */}
      <div>
        <p style={{
        fontSize: 12,
        marginBottom: 8,
        color: 'var(--color-text-secondary)'
      }}>Many columns (6+)</p>
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.Head>ID</Table.Head>
              <Table.Head>Name</Table.Head>
              <Table.Head>Email</Table.Head>
              <Table.Head>Role</Table.Head>
              <Table.Head>Department</Table.Head>
              <Table.Head>Status</Table.Head>
              <Table.Head>Joined</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            <Table.Row>
              <Table.Cell>1</Table.Cell>
              <Table.Cell>Alice Brown</Table.Cell>
              <Table.Cell>alice@example.com</Table.Cell>
              <Table.Cell>Admin</Table.Cell>
              <Table.Cell>Engineering</Table.Cell>
              <Table.Cell>Active</Table.Cell>
              <Table.Cell>2024-01-15</Table.Cell>
            </Table.Row>
            <Table.Row>
              <Table.Cell>2</Table.Cell>
              <Table.Cell>Bob Smith</Table.Cell>
              <Table.Cell>bob@example.com</Table.Cell>
              <Table.Cell>Editor</Table.Cell>
              <Table.Cell>Marketing</Table.Cell>
              <Table.Cell>Inactive</Table.Cell>
              <Table.Cell>2023-08-22</Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table>
      </div>
    </div>
}`,...i.parameters?.docs?.source}}};const x=["Default","Sizes","States"];export{d as Default,r as Sizes,i as States,x as __namedExportsOrder,m as default};
