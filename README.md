# chrome_autofill

Lightning Autofill Lite is a simple Chrome extension that captures fields from any page and replays them to autofill forms later.

## How to install (development)

1. Open `chrome://extensions` in Chrome.
2. Enable **Developer mode**.
3. Click **Load unpacked** and select this repository folder.

## How to use

1. Navigate to a page with a form and fill in the fields you want to reuse (text fields, dropdowns, radio buttons, etc.).
2. Click the extension icon and choose **Save fields from page**.
3. Visit another page with matching fields and click **Autofill page**.

The extension stores a map of field identifiers (labels, placeholders, names, and ids) so it can match and fill similar forms later.
