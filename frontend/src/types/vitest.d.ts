/// <reference types="vitest" />
import '@testing-library/jest-dom';

declare module 'vitest' {
  interface Assertion<T = unknown> {
    toBeInTheDocument(): T;
    toHaveAttribute(name: string, value?: string): T;
    toBeDisabled(): T;
    toHaveValue(value: string | number | string[]): T;
    toBeVisible(): T;
    toHaveClass(className: string): T;
    toHaveTextContent(text: string | RegExp): T;
    toContainElement(element: HTMLElement | null): T;
    toBeEmpty(): T;
    toHaveFocus(): T;
    toBeChecked(): T;
    toBeRequired(): T;
    toBeValid(): T;
    toBeInvalid(): T;
  }
}
