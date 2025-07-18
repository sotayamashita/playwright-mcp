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

import { test, expect } from './fixtures.js';

test('browser_assert_checked', async ({ client, server }) => {
  server.setContent('/', `
    <title>Test Page</title>
    <input type="checkbox" id="checked-box" checked />
    <input type="checkbox" id="unchecked-box" />
    <input type="radio" id="checked-radio" name="radio" checked />
    <input type="radio" id="unchecked-radio" name="radio" />
  `, 'text/html');

  await client.callTool({
    name: 'browser_navigate',
    arguments: { url: server.PREFIX },
  });

  // Capture snapshot to make elements available for reference
  await client.callTool({
    name: 'browser_snapshot',
    arguments: {},
  });

  // Test toBeChecked assertion for checked checkbox
  const result = await client.callTool({
    name: 'browser_assert_checked',
    arguments: {
      element: 'checked checkbox',
      ref: 'e2',
    },
  });

  expect(result).toHaveTextContent(`
### Ran Playwright code
\`\`\`js
// Assert checked checkbox toBeChecked
await expect(page.locator('#checked-box')).toBeChecked();
\`\`\`

### Page state
- Page URL: ${server.PREFIX}
- Page Title: Test Page
- Page Snapshot:
\`\`\`yaml
- generic [active] [ref=e1]:
  - checkbox [checked] [ref=e2]
  - checkbox [ref=e3]
  - radio [checked] [ref=e4]
  - radio [ref=e5]
\`\`\``);

  // Test toBeChecked assertion for checked radio button
  const resultRadio = await client.callTool({
    name: 'browser_assert_checked',
    arguments: {
      element: 'checked radio button',
      ref: 'e4',
    },
  });

  expect(resultRadio).toHaveTextContent(`
### Ran Playwright code
\`\`\`js
// Assert checked radio button toBeChecked
await expect(page.locator('#checked-radio')).toBeChecked();
\`\`\`

### Page state
- Page URL: ${server.PREFIX}
- Page Title: Test Page
- Page Snapshot:
\`\`\`yaml
- generic [active] [ref=e1]:
  - checkbox [checked] [ref=e2]
  - checkbox [ref=e3]
  - radio [checked] [ref=e4]
  - radio [ref=e5]
\`\`\``);
});

test('browser_assert_checked (invalid ref)', async ({ client, server }) => {
  server.setContent('/', `
    <title>Test Page</title>
    <input type="checkbox" id="checked-box" checked />
  `, 'text/html');

  await client.callTool({
    name: 'browser_navigate',
    arguments: { url: server.PREFIX },
  });

  await client.callTool({
    name: 'browser_snapshot',
    arguments: {},
  });

  // Test with invalid ref
  const result = await client.callTool({
    name: 'browser_assert_checked',
    arguments: {
      element: 'nonexistent element',
      ref: 'e999',
    },
  });

  expect(result).toContainTextContent('Ref not found');
});

test('browser_assert_checked (unchecked element)', async ({ client, server }) => {
  server.setContent('/', `
    <title>Test Page</title>
    <input type="checkbox" id="unchecked-box" />
  `, 'text/html');

  await client.callTool({
    name: 'browser_navigate',
    arguments: { url: server.PREFIX },
  });

  await client.callTool({
    name: 'browser_snapshot',
    arguments: {},
  });

  // Test assertion on unchecked element (should fail)
  const result = await client.callTool({
    name: 'browser_assert_checked',
    arguments: {
      element: 'unchecked checkbox',
      ref: 'e2',
    },
  });

  // The tool should execute but the assertion should fail
  expect(result).toContainTextContent('Expected element unchecked checkbox to be checked, but it was not');
});

test('browser_assert_checked (element removed)', async ({ client, server }) => {
  server.setContent('/', `
    <title>Test Page</title>
    <input type="checkbox" id="checkbox1" checked />
    <input type="checkbox" id="checkbox2" checked />
    <button onclick="document.getElementById('checkbox2').remove()">Remove</button>
  `, 'text/html');

  await client.callTool({
    name: 'browser_navigate',
    arguments: { url: server.PREFIX },
  });

  await client.callTool({
    name: 'browser_snapshot',
    arguments: {},
  });

  // Remove the element
  await client.callTool({
    name: 'browser_click',
    arguments: {
      element: 'Remove button',
      ref: 'e4',
    },
  });

  // Try to assert on removed element
  const result = await client.callTool({
    name: 'browser_assert_checked',
    arguments: {
      element: 'removed checkbox',
      ref: 'e3',
    },
  });

  expect(result).toContainTextContent('Ref not found');
});

test('browser_assert_visible', async ({ client, server }) => {
  server.setContent('/', `
    <title>Test Page</title>
    <div id="visible-div">Visible content</div>
    <div id="hidden-div" style="display: none;">Hidden content</div>
    <div id="opacity-div" style="opacity: 0;">Opacity content</div>
  `, 'text/html');

  await client.callTool({
    name: 'browser_navigate',
    arguments: { url: server.PREFIX },
  });

  await client.callTool({
    name: 'browser_snapshot',
    arguments: {},
  });

  // Test toBeVisible assertion for visible element
  const result = await client.callTool({
    name: 'browser_assert_visible',
    arguments: {
      element: 'visible div',
      ref: 'e2',
    },
  });

  expect(result).toHaveTextContent(`
### Ran Playwright code
\`\`\`js
// Assert visible div toBeVisible
await expect(page.getByText('Visible content')).toBeVisible();
\`\`\`

### Page state
- Page URL: ${server.PREFIX}
- Page Title: Test Page
- Page Snapshot:
\`\`\`yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]: Visible content
  - generic [ref=e3]: Opacity content
\`\`\``);
});

test('browser_assert_visible (invalid ref)', async ({ client, server }) => {
  server.setContent('/', `
    <title>Test Page</title>
    <div id="visible-div">Visible content</div>
  `, 'text/html');

  await client.callTool({
    name: 'browser_navigate',
    arguments: { url: server.PREFIX },
  });

  await client.callTool({
    name: 'browser_snapshot',
    arguments: {},
  });

  // Test with invalid ref
  const result = await client.callTool({
    name: 'browser_assert_visible',
    arguments: {
      element: 'nonexistent element',
      ref: 'e999',
    },
  });

  expect(result).toContainTextContent('Ref not found');
});

test('browser_assert_visible (hidden element)', async ({ client, server }) => {
  server.setContent('/', `
    <title>Test Page</title>
    <div id="visible-div">Visible content</div>
    <div id="hidden-div" style="display: none;">Hidden content</div>
  `, 'text/html');

  await client.callTool({
    name: 'browser_navigate',
    arguments: { url: server.PREFIX },
  });

  await client.callTool({
    name: 'browser_snapshot',
    arguments: {},
  });

  // Test assertion on hidden element (should execute but assertion may fail)
  const result = await client.callTool({
    name: 'browser_assert_visible',
    arguments: {
      element: 'visible div',
      ref: 'e2',
    },
  });

  expect(result).toContainTextContent('Assert visible div toBeVisible');
});

test('browser_assert_contain_text', async ({ client, server }) => {
  server.setContent('/', `
    <title>Test Page</title>
    <div id="welcome">Welcome to our website</div>
    <p id="description">This is a comprehensive description of the application</p>
    <span id="status">Status: Active</span>
  `, 'text/html');

  await client.callTool({
    name: 'browser_navigate',
    arguments: { url: server.PREFIX },
  });

  await client.callTool({
    name: 'browser_snapshot',
    arguments: {},
  });

  // Test toContainText assertion for partial text match
  const result = await client.callTool({
    name: 'browser_assert_contain_text',
    arguments: {
      element: 'welcome message',
      ref: 'e2',
      expected: 'Welcome',
    },
  });

  expect(result).toHaveTextContent(`
### Ran Playwright code
\`\`\`js
// Assert welcome message toContainText "Welcome"
await expect(page.getByText('Welcome to our website')).toContainText('Welcome');
\`\`\`

### Page state
- Page URL: ${server.PREFIX}
- Page Title: Test Page
- Page Snapshot:
\`\`\`yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]: Welcome to our website
  - paragraph [ref=e3]: This is a comprehensive description of the application
  - generic [ref=e4]: "Status: Active"
\`\`\``);
});

test('browser_assert_contain_text (invalid ref)', async ({ client, server }) => {
  server.setContent('/', `
    <title>Test Page</title>
    <div>Some content</div>
  `, 'text/html');

  await client.callTool({
    name: 'browser_navigate',
    arguments: { url: server.PREFIX },
  });

  await client.callTool({
    name: 'browser_snapshot',
    arguments: {},
  });

  // Test with invalid ref
  const result = await client.callTool({
    name: 'browser_assert_contain_text',
    arguments: {
      element: 'nonexistent element',
      ref: 'e999',
      expected: 'test',
    },
  });

  expect(result).toContainTextContent('Ref not found');
});

test('browser_assert_contain_text (text mismatch)', async ({ client, server }) => {
  server.setContent('/', `
    <title>Test Page</title>
    <div>Hello World</div>
  `, 'text/html');

  await client.callTool({
    name: 'browser_navigate',
    arguments: { url: server.PREFIX },
  });

  await client.callTool({
    name: 'browser_snapshot',
    arguments: {},
  });

  // Test assertion with text that doesn't match
  const result = await client.callTool({
    name: 'browser_assert_contain_text',
    arguments: {
      element: 'hello div',
      ref: 'e2',
      expected: 'Goodbye',
    },
  });

  expect(result).toContainTextContent('Expected element to contain text "Goodbye", but got "Hello World"');
});

test('browser_assert_have_text', async ({ client, server }) => {
  server.setContent('/', `
    <title>Test Page</title>
    <div id="exact-text">Hello World</div>
    <p id="multi-word">This is a test</p>
    <span id="number">42</span>
  `, 'text/html');

  await client.callTool({
    name: 'browser_navigate',
    arguments: { url: server.PREFIX },
  });

  await client.callTool({
    name: 'browser_snapshot',
    arguments: {},
  });

  // Test toHaveText assertion for exact text match
  const result = await client.callTool({
    name: 'browser_assert_have_text',
    arguments: {
      element: 'exact text div',
      ref: 'e2',
      expected: 'Hello World',
    },
  });

  expect(result).toHaveTextContent(`
### Ran Playwright code
\`\`\`js
// Assert exact text div toHaveText "Hello World"
await expect(page.getByText('Hello World')).toHaveText('Hello World');
\`\`\`

### Page state
- Page URL: ${server.PREFIX}
- Page Title: Test Page
- Page Snapshot:
\`\`\`yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]: Hello World
  - paragraph [ref=e3]: This is a test
  - generic [ref=e4]: "42"
\`\`\``);
});

test('browser_assert_have_text (invalid ref)', async ({ client, server }) => {
  server.setContent('/', `
    <title>Test Page</title>
    <div>Some content</div>
  `, 'text/html');

  await client.callTool({
    name: 'browser_navigate',
    arguments: { url: server.PREFIX },
  });

  await client.callTool({
    name: 'browser_snapshot',
    arguments: {},
  });

  // Test with invalid ref
  const result = await client.callTool({
    name: 'browser_assert_have_text',
    arguments: {
      element: 'nonexistent element',
      ref: 'e999',
      expected: 'test',
    },
  });

  expect(result).toContainTextContent('Ref not found');
});

test('browser_assert_have_text (exact match failure)', async ({ client, server }) => {
  server.setContent('/', `
    <title>Test Page</title>
    <div>Hello World</div>
  `, 'text/html');

  await client.callTool({
    name: 'browser_navigate',
    arguments: { url: server.PREFIX },
  });

  await client.callTool({
    name: 'browser_snapshot',
    arguments: {},
  });

  // Test assertion with partial text (should fail for exact match)
  const result = await client.callTool({
    name: 'browser_assert_have_text',
    arguments: {
      element: 'hello div',
      ref: 'e2',
      expected: 'Hello',
    },
  });

  expect(result).toContainTextContent('Expected element to have text "Hello", but got "Hello World"');
});

test('browser_assert_have_value', async ({ client, server }) => {
  server.setContent('/', `
    <title>Test Page</title>
    <input type="text" id="text-input" value="Hello World" />
    <textarea id="textarea-input">Sample text</textarea>
    <select id="select-input">
      <option value="option1">Option 1</option>
      <option value="option2" selected>Option 2</option>
    </select>
  `, 'text/html');

  await client.callTool({
    name: 'browser_navigate',
    arguments: { url: server.PREFIX },
  });

  await client.callTool({
    name: 'browser_snapshot',
    arguments: {},
  });

  // Test toHaveValue assertion for text input
  const result = await client.callTool({
    name: 'browser_assert_have_value',
    arguments: {
      element: 'text input',
      ref: 'e2',
      expected: 'Hello World',
    },
  });

  expect(result).toHaveTextContent(`
### Ran Playwright code
\`\`\`js
// Assert text input toHaveValue "Hello World"
await expect(page.locator('#text-input')).toHaveValue('Hello World');
\`\`\`

### Page state
- Page URL: ${server.PREFIX}
- Page Title: Test Page
- Page Snapshot:
\`\`\`yaml
- generic [active] [ref=e1]:
  - textbox [ref=e2]: Hello World
  - textbox [ref=e3]: Sample text
  - combobox [ref=e4]:
    - option "Option 1"
    - option "Option 2" [selected]
\`\`\``);
});

test('browser_assert_have_value (invalid ref)', async ({ client, server }) => {
  server.setContent('/', `
    <title>Test Page</title>
    <input type="text" value="test" />
  `, 'text/html');

  await client.callTool({
    name: 'browser_navigate',
    arguments: { url: server.PREFIX },
  });

  await client.callTool({
    name: 'browser_snapshot',
    arguments: {},
  });

  // Test with invalid ref
  const result = await client.callTool({
    name: 'browser_assert_have_value',
    arguments: {
      element: 'nonexistent input',
      ref: 'e999',
      expected: 'test',
    },
  });

  expect(result).toContainTextContent('Ref not found');
});

test('browser_assert_have_value (value mismatch)', async ({ client, server }) => {
  server.setContent('/', `
    <title>Test Page</title>
    <input type="text" value="actual value" />
  `, 'text/html');

  await client.callTool({
    name: 'browser_navigate',
    arguments: { url: server.PREFIX },
  });

  await client.callTool({
    name: 'browser_snapshot',
    arguments: {},
  });

  // Test assertion with wrong expected value
  const result = await client.callTool({
    name: 'browser_assert_have_value',
    arguments: {
      element: 'text input',
      ref: 'e2',
      expected: 'expected value',
    },
  });

  expect(result).toContainTextContent('Expected element to have value "expected value", but got "actual value"');
});

test('browser_assert_have_title', async ({ client, server }) => {
  server.setContent('/', `
    <title>My Test Page</title>
    <h1>Welcome to the test page</h1>
  `, 'text/html');

  await client.callTool({
    name: 'browser_navigate',
    arguments: { url: server.PREFIX },
  });

  // Test toHaveTitle assertion for page title
  const result = await client.callTool({
    name: 'browser_assert_have_title',
    arguments: {
      expected: 'My Test Page',
    },
  });

  expect(result).toHaveTextContent(`
### Ran Playwright code
\`\`\`js
// Assert page toHaveTitle "My Test Page"
await expect(page).toHaveTitle('My Test Page');
\`\`\`

### Page state
- Page URL: ${server.PREFIX}
- Page Title: My Test Page
- Page Snapshot:
\`\`\`yaml
- heading "Welcome to the test page" [level=1] [ref=e2]
\`\`\``);
});

test('browser_assert_have_title (title mismatch)', async ({ client, server }) => {
  server.setContent('/', `
    <title>Actual Title</title>
    <h1>Content</h1>
  `, 'text/html');

  await client.callTool({
    name: 'browser_navigate',
    arguments: { url: server.PREFIX },
  });

  // Test assertion with wrong expected title
  const result = await client.callTool({
    name: 'browser_assert_have_title',
    arguments: {
      expected: 'Expected Title',
    },
  });

  expect(result).toContainTextContent('Expected page title to be "Expected Title", but got "Actual Title"');
});

test('browser_assert_have_title (empty title)', async ({ client, server }) => {
  server.setContent('/', `
    <h1>No title tag</h1>
  `, 'text/html');

  await client.callTool({
    name: 'browser_navigate',
    arguments: { url: server.PREFIX },
  });

  // Test assertion with empty title
  const result = await client.callTool({
    name: 'browser_assert_have_title',
    arguments: {
      expected: '',
    },
  });

  expect(result).toContainTextContent('Assert page toHaveTitle ""');
});

test('browser_assert_have_url', async ({ client, server }) => {
  server.setContent('/', `
    <title>Test Page</title>
    <h1>URL Test Page</h1>
  `, 'text/html');

  await client.callTool({
    name: 'browser_navigate',
    arguments: { url: server.PREFIX },
  });

  // Test toHaveURL assertion for page URL
  const result = await client.callTool({
    name: 'browser_assert_have_url',
    arguments: {
      expected: server.PREFIX,
    },
  });

  expect(result).toHaveTextContent(`
### Ran Playwright code
\`\`\`js
// Assert page toHaveURL "${server.PREFIX}"
await expect(page).toHaveURL('${server.PREFIX}');
\`\`\`

### Page state
- Page URL: ${server.PREFIX}
- Page Title: Test Page
- Page Snapshot:
\`\`\`yaml
- heading "URL Test Page" [level=1] [ref=e2]
\`\`\``);
});

test('browser_assert_have_url (URL mismatch)', async ({ client, server }) => {
  server.setContent('/', `
    <title>Test Page</title>
    <h1>Content</h1>
  `, 'text/html');

  await client.callTool({
    name: 'browser_navigate',
    arguments: { url: server.PREFIX },
  });

  // Test assertion with wrong expected URL
  const result = await client.callTool({
    name: 'browser_assert_have_url',
    arguments: {
      expected: 'https://example.com/wrong',
    },
  });

  expect(result).toContainTextContent('Expected page URL to be "https://example.com/wrong", but got "' + server.PREFIX + '"');
});

test('browser_assert_have_url (partial URL match)', async ({ client, server }) => {
  server.setContent('/', `
    <title>Test Page</title>
    <h1>Content</h1>
  `, 'text/html');

  await client.callTool({
    name: 'browser_navigate',
    arguments: { url: server.PREFIX },
  });

  // Test assertion with partial URL
  const result = await client.callTool({
    name: 'browser_assert_have_url',
    arguments: {
      expected: server.PREFIX + '/subpath',
    },
  });

  expect(result).toContainTextContent('Expected page URL to be "' + server.PREFIX + '/subpath", but got "' + server.PREFIX + '"');
});
