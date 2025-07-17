/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { z } from 'zod';
import { defineTool } from './tool.js';
import { generateLocator } from './utils.js';
import { expect } from '@playwright/test';

const assertCheckedSchema = z.object({
  element: z.string().describe('Human-readable element description used to obtain permission to interact with the element'),
  ref: z.string().describe('Exact target element reference from the page snapshot'),
});

const assertChecked = defineTool({
  capability: 'core',
  schema: {
    name: 'browser_assert_checked',
    title: 'Assert checked',
    description: 'Assert that an element is checked or unchecked',
    inputSchema: assertCheckedSchema,
    type: 'readOnly',
  },

  handle: async (context, params) => {
    const tab = context.currentTabOrDie();
    const locator = tab.snapshotOrDie().refLocator(params);

    const code: string[] = [];

    code.push(`// Assert ${params.element} toBeChecked`);
    code.push(`await expect(page.${await generateLocator(locator)}).toBeChecked();`);

    const action = async () => {
      try {
        await expect(locator).toBeChecked();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Expected element ${params.element} to be checked, but it was not. Error: ${message}`);
      }
    };

    return {
      code,
      action,
      captureSnapshot: true,
      waitForNetwork: false,
    };
  },
});

const assertVisibleSchema = z.object({
  element: z.string().describe('Human-readable element description used to obtain permission to interact with the element'),
  ref: z.string().describe('Exact target element reference from the page snapshot'),
});

const assertVisible = defineTool({
  capability: 'core',
  schema: {
    name: 'browser_assert_visible',
    title: 'Assert visible',
    description: 'Assert that an element is visible',
    inputSchema: assertVisibleSchema,
    type: 'readOnly',
  },

  handle: async (context, params) => {
    const tab = context.currentTabOrDie();
    const locator = tab.snapshotOrDie().refLocator(params);

    const code: string[] = [];

    code.push(`// Assert ${params.element} toBeVisible`);
    code.push(`await expect(page.${await generateLocator(locator)}).toBeVisible();`);

    const action = async () => {
      try {
        await expect(locator).toBeVisible();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Expected element ${params.element} to be visible, but it was not. Error: ${message}`);
      }
    };

    return {
      code,
      action,
      captureSnapshot: true,
      waitForNetwork: false,
    };
  },
});

const assertContainTextSchema = z.object({
  element: z.string().describe('Human-readable element description used to obtain permission to interact with the element'),
  ref: z.string().describe('Exact target element reference from the page snapshot'),
  expected: z.string().describe('Expected text substring'),
});

const assertContainText = defineTool({
  capability: 'core',
  schema: {
    name: 'browser_assert_contain_text',
    title: 'Assert contain text',
    description: 'Assert that an element contains specific text',
    inputSchema: assertContainTextSchema,
    type: 'readOnly',
  },

  handle: async (context, params) => {
    const tab = context.currentTabOrDie();
    const locator = tab.snapshotOrDie().refLocator(params);

    const code: string[] = [];

    code.push(`// Assert ${params.element} toContainText "${params.expected}"`);
    code.push(`await expect(page.${await generateLocator(locator)}).toContainText('${params.expected}');`);

    const action = async () => {
      const actualText = await locator.textContent();
      if (!actualText || !actualText.includes(params.expected))
        throw new Error(`Expected element to contain text "${params.expected}", but got "${actualText}"`);
    };

    return {
      code,
      action,
      captureSnapshot: true,
      waitForNetwork: false,
    };
  },
});

const assertHaveTextSchema = z.object({
  element: z.string().describe('Human-readable element description used to obtain permission to interact with the element'),
  ref: z.string().describe('Exact target element reference from the page snapshot'),
  expected: z.string().describe('Expected exact text'),
});

const assertHaveText = defineTool({
  capability: 'core',
  schema: {
    name: 'browser_assert_have_text',
    title: 'Assert have text',
    description: 'Assert that an element has exact text',
    inputSchema: assertHaveTextSchema,
    type: 'readOnly',
  },

  handle: async (context, params) => {
    const tab = context.currentTabOrDie();
    const locator = tab.snapshotOrDie().refLocator(params);

    const code: string[] = [];

    code.push(`// Assert ${params.element} toHaveText "${params.expected}"`);
    code.push(`await expect(page.${await generateLocator(locator)}).toHaveText('${params.expected}');`);

    const action = async () => {
      const actualText = await locator.textContent();
      if (actualText !== params.expected)
        throw new Error(`Expected element to have text "${params.expected}", but got "${actualText}"`);
    };

    return {
      code,
      action,
      captureSnapshot: true,
      waitForNetwork: false,
    };
  },
});

const assertHaveValueSchema = z.object({
  element: z.string().describe('Human-readable element description used to obtain permission to interact with the element'),
  ref: z.string().describe('Exact target element reference from the page snapshot'),
  expected: z.string().describe('Expected value'),
});

const assertHaveValue = defineTool({
  capability: 'core',
  schema: {
    name: 'browser_assert_have_value',
    title: 'Assert have value',
    description: 'Assert that an input element has specific value',
    inputSchema: assertHaveValueSchema,
    type: 'readOnly',
  },

  handle: async (context, params) => {
    const tab = context.currentTabOrDie();
    const locator = tab.snapshotOrDie().refLocator(params);

    const code: string[] = [];

    code.push(`// Assert ${params.element} toHaveValue "${params.expected}"`);
    code.push(`await expect(page.${await generateLocator(locator)}).toHaveValue('${params.expected}');`);

    const action = async () => {
      const actualValue = await locator.inputValue();
      if (actualValue !== params.expected)
        throw new Error(`Expected element to have value "${params.expected}", but got "${actualValue}"`);

    };

    return {
      code,
      action,
      captureSnapshot: true,
      waitForNetwork: false,
    };
  },
});

const assertHaveTitleSchema = z.object({
  expected: z.string().describe('Expected page title'),
});

const assertHaveTitle = defineTool({
  capability: 'core',
  schema: {
    name: 'browser_assert_have_title',
    title: 'Assert have title',
    description: 'Assert that the page has specific title',
    inputSchema: assertHaveTitleSchema,
    type: 'readOnly',
  },

  handle: async (context, params) => {
    const tab = context.currentTabOrDie();

    const code: string[] = [];

    code.push(`// Assert page toHaveTitle "${params.expected}"`);
    code.push(`await expect(page).toHaveTitle('${params.expected}');`);

    const action = async () => {
      const actualTitle = await tab.page.title();
      if (actualTitle !== params.expected)
        throw new Error(`Expected page title to be "${params.expected}", but got "${actualTitle}"`);

    };

    return {
      code,
      action,
      captureSnapshot: true,
      waitForNetwork: false,
    };
  },
});

const assertHaveURLSchema = z.object({
  expected: z.string().describe('Expected page URL'),
});

const assertHaveURL = defineTool({
  capability: 'core',
  schema: {
    name: 'browser_assert_have_url',
    title: 'Assert have URL',
    description: 'Assert that the page has specific URL',
    inputSchema: assertHaveURLSchema,
    type: 'readOnly',
  },

  handle: async (context, params) => {
    const tab = context.currentTabOrDie();

    const code: string[] = [];

    code.push(`// Assert page toHaveURL "${params.expected}"`);
    code.push(`await expect(page).toHaveURL('${params.expected}');`);

    const action = async () => {
      const actualURL = tab.page.url();
      if (actualURL !== params.expected)
        throw new Error(`Expected page URL to be "${params.expected}", but got "${actualURL}"`);

    };

    return {
      code,
      action,
      captureSnapshot: true,
      waitForNetwork: false,
    };
  },
});

export default [
  assertChecked,
  assertVisible,
  assertContainText,
  assertHaveText,
  assertHaveValue,
  assertHaveTitle,
  assertHaveURL,
];
