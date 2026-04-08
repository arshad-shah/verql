import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { Table } from '../../../../src/renderer/src/primitives/data-display/Table'
import { List } from '../../../../src/renderer/src/primitives/data-display/List'

describe('Table', () => {
  it('renders table with headers and rows', () => {
    render(
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.Head>Name</Table.Head>
            <Table.Head>Age</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          <Table.Row>
            <Table.Cell>Alice</Table.Cell>
            <Table.Cell>30</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table>
    )
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Age')).toBeInTheDocument()
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('30')).toBeInTheDocument()
  })

  it('renders a table element as root', () => {
    const { container } = render(<Table><Table.Body /></Table>)
    expect(container.querySelector('table')).toBeInTheDocument()
  })

  it('renders thead for Table.Header', () => {
    const { container } = render(
      <Table>
        <Table.Header />
      </Table>
    )
    expect(container.querySelector('thead')).toBeInTheDocument()
  })

  it('renders tbody for Table.Body', () => {
    const { container } = render(
      <Table>
        <Table.Body />
      </Table>
    )
    expect(container.querySelector('tbody')).toBeInTheDocument()
  })

  it('renders tr for Table.Row', () => {
    const { container } = render(
      <Table>
        <Table.Body>
          <Table.Row />
        </Table.Body>
      </Table>
    )
    expect(container.querySelector('tr')).toBeInTheDocument()
  })

  it('renders th for Table.Head', () => {
    const { container } = render(
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.Head>Column</Table.Head>
          </Table.Row>
        </Table.Header>
      </Table>
    )
    expect(container.querySelector('th')).toBeInTheDocument()
  })

  it('renders td for Table.Cell', () => {
    const { container } = render(
      <Table>
        <Table.Body>
          <Table.Row>
            <Table.Cell>Value</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table>
    )
    expect(container.querySelector('td')).toBeInTheDocument()
  })

  it('applies head text styling', () => {
    const { container } = render(
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.Head>Column</Table.Head>
          </Table.Row>
        </Table.Header>
      </Table>
    )
    const th = container.querySelector('th')
    expect(th).toHaveClass('text-xs')
    expect(th).toHaveClass('font-medium')
    expect(th).toHaveClass('text-text-secondary')
  })

  it('applies cell text styling', () => {
    const { container } = render(
      <Table>
        <Table.Body>
          <Table.Row>
            <Table.Cell>Value</Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table>
    )
    const td = container.querySelector('td')
    expect(td).toHaveClass('text-text-primary')
    expect(td).toHaveClass('px-3')
    expect(td).toHaveClass('py-2')
  })
})

describe('List', () => {
  it('renders items', () => {
    render(
      <List>
        <List.Item>Item 1</List.Item>
        <List.Item>Item 2</List.Item>
      </List>
    )
    expect(screen.getByText('Item 1')).toBeInTheDocument()
    expect(screen.getByText('Item 2')).toBeInTheDocument()
  })

  it('renders a ul element as root', () => {
    const { container } = render(<List><List.Item>Item</List.Item></List>)
    expect(container.querySelector('ul')).toBeInTheDocument()
  })

  it('renders li for List.Item', () => {
    const { container } = render(<List><List.Item>Item</List.Item></List>)
    expect(container.querySelector('li')).toBeInTheDocument()
  })

  it('applies item styling', () => {
    const { container } = render(<List><List.Item>Item</List.Item></List>)
    const li = container.querySelector('li')
    expect(li).toHaveClass('px-3')
    expect(li).toHaveClass('py-2')
    expect(li).toHaveClass('text-sm')
    expect(li).toHaveClass('text-text-primary')
  })

  it('applies flex col on root', () => {
    const { container } = render(<List />)
    expect(container.querySelector('ul')).toHaveClass('flex')
    expect(container.querySelector('ul')).toHaveClass('flex-col')
  })
})
