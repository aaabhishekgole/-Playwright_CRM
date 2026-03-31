import React, { Children, createContext, isValidElement, useContext } from 'react';
import { cn } from '@/lib/cn';

const SelectContext = createContext(null);

function extractText(node) {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(extractText).join('');
  }

  if (isValidElement(node)) {
    return extractText(node.props.children);
  }

  return '';
}

function collectItems(children, items = []) {
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) {
      return;
    }

    if (child.type?.__selectItem) {
      items.push({
        label: extractText(child.props.children) || child.props.value,
        value: child.props.value,
      });
      return;
    }

    if (child.props?.children) {
      collectItems(child.props.children, items);
    }
  });

  return items;
}

function findPlaceholder(children) {
  let placeholder = '';

  Children.forEach(children, (child) => {
    if (!isValidElement(child) || placeholder) {
      return;
    }

    if (child.type?.__selectValue) {
      placeholder = child.props.placeholder || '';
      return;
    }

    if (child.props?.children) {
      placeholder = findPlaceholder(child.props.children) || placeholder;
    }
  });

  return placeholder;
}

export function Select({ children, onValueChange, value }) {
  const items = collectItems(children);
  const placeholder = findPlaceholder(children);

  return <SelectContext.Provider value={{ items, onValueChange, placeholder, value }}>{children}</SelectContext.Provider>;
}

export function SelectTrigger({ children, className }) {
  const context = useContext(SelectContext);
  const hasSelectedValue = context.items.some((item) => item.value === context.value);

  return (
    <select
      value={context.value ?? ''}
      onChange={(event) => context.onValueChange?.(event.target.value)}
      className={cn(
        'flex h-10 w-full appearance-none items-center rounded-xl border border-slate-300 bg-white px-3 py-2 pr-10 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100',
        className,
      )}
    >
      {!hasSelectedValue && context.placeholder ? (
        <option disabled value="">
          {context.placeholder}
        </option>
      ) : null}
      {context.items.map((item) => (
        <option key={item.value} value={item.value}>
          {item.label}
        </option>
      ))}
      {children}
    </select>
  );
}

export function SelectValue() {
  return null;
}

SelectValue.__selectValue = true;

export function SelectContent() {
  return null;
}

export function SelectItem() {
  return null;
}

SelectItem.__selectItem = true;
