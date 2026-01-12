const normalizeKey = (value) => value.trim().toLowerCase();

const getLabelText = (element) => {
  const labels = element.labels ? Array.from(element.labels) : [];
  const labelText = labels.map((label) => label.innerText).join(' ');
  return labelText.trim();
};

const getFieldSignature = (element) => {
  const parts = [
    getLabelText(element),
    element.getAttribute('aria-label') || '',
    element.getAttribute('placeholder') || '',
    element.name || '',
    element.id || '',
  ];
  return normalizeKey(parts.join(' '));
};

const getFieldKeys = (element) => {
  const keys = [getFieldSignature(element)];
  if (element.name) {
    keys.push(normalizeKey(element.name));
  }
  if (element.id) {
    keys.push(normalizeKey(element.id));
  }
  return Array.from(new Set(keys)).filter(Boolean);
};

const addEntry = (entries, element, value, type) => {
  const keys = getFieldKeys(element);
  keys.forEach((key) => {
    entries[key] = { value, type };
  });
};

const collectFields = () => {
  const entries = {};
  const elements = Array.from(document.querySelectorAll('input, select, textarea'));

  elements.forEach((element) => {
    if (element.disabled) {
      return;
    }

    if (element.tagName.toLowerCase() === 'select') {
      if (element.value) {
        addEntry(entries, element, element.value, 'select');
      }
      return;
    }

    const type = (element.getAttribute('type') || 'text').toLowerCase();

    if (type === 'checkbox') {
      if (element.checked) {
        addEntry(entries, element, true, 'checkbox');
      }
      return;
    }

    if (type === 'radio') {
      if (element.checked) {
        addEntry(entries, element, element.value, 'radio');
      }
      return;
    }

    const value = element.value?.trim();
    if (value) {
      addEntry(entries, element, value, 'text');
    }
  });

  return { entries };
};

const setSelectValue = (element, entry) => {
  if (!entry?.value) {
    return;
  }
  const optionMatch = Array.from(element.options).find(
    (option) => option.value === entry.value || option.textContent.trim() === entry.value
  );
  if (optionMatch) {
    element.value = optionMatch.value;
  }
};

const applyEntry = (element, entry) => {
  const tag = element.tagName.toLowerCase();
  if (tag === 'select') {
    if (!element.value || element.value === element.defaultValue) {
      setSelectValue(element, entry);
    }
    return;
  }

  const type = (element.getAttribute('type') || 'text').toLowerCase();

  if (type === 'checkbox') {
    if (!element.checked && entry.value === true) {
      element.checked = true;
    }
    return;
  }

  if (type === 'radio') {
    if (entry.value && element.value === entry.value) {
      element.checked = true;
    }
    return;
  }

  if (!element.value) {
    element.value = entry.value || '';
  }
};

const fillInputs = (profile) => {
  if (!profile?.entries) {
    return;
  }

  const elements = Array.from(document.querySelectorAll('input, select, textarea'));

  elements.forEach((element) => {
    if (element.disabled || element.readOnly) {
      return;
    }

    const keys = getFieldKeys(element);
    const entry = keys.map((key) => profile.entries[key]).find(Boolean);
    if (!entry) {
      return;
    }

    applyEntry(element, entry);

    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  });
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === 'LIGHTNING_AUTOFILL' && message.profile) {
    fillInputs(message.profile);
  }

  if (message?.type === 'LIGHTNING_CAPTURE') {
    sendResponse({ profile: collectFields() });
    return true;
  }
});
