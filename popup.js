const status = document.getElementById('status');
const captureButton = document.getElementById('capture');
const fillButton = document.getElementById('fill');
const clearButton = document.getElementById('clear');
const profileCount = document.getElementById('profile-count');

const setStatus = (message, timeout = 2000) => {
  status.textContent = message;
  if (timeout) {
    window.clearTimeout(setStatus.timeoutId);
    setStatus.timeoutId = window.setTimeout(() => {
      status.textContent = '';
    }, timeout);
  }
};

const updateCount = (profile) => {
  const count = profile?.entries ? Object.keys(profile.entries).length : 0;
  profileCount.textContent = `${count} field${count === 1 ? '' : 's'}`;
};

const loadProfile = async () => {
  const { profile } = await chrome.storage.sync.get('profile');
  updateCount(profile);
  return profile;
};

const saveProfile = async (profile) => {
  await chrome.storage.sync.set({ profile });
  updateCount(profile);
};

const clearProfile = async () => {
  await chrome.storage.sync.remove('profile');
  updateCount(null);
  setStatus('Saved fields cleared');
};

const sendMessage = (tabId, message) =>
  new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(response);
    });
  });

const getActiveTabId = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab?.id;
};

captureButton.addEventListener('click', async () => {
  try {
    const tabId = await getActiveTabId();
    if (!tabId) {
      setStatus('No active tab found');
      return;
    }
    const response = await sendMessage(tabId, { type: 'LIGHTNING_CAPTURE' });
    if (!response?.profile) {
      setStatus('No filled fields found');
      return;
    }
    await saveProfile(response.profile);
    setStatus('Fields saved from page!');
  } catch (error) {
    setStatus('Unable to capture fields');
  }
});

fillButton.addEventListener('click', async () => {
  try {
    const tabId = await getActiveTabId();
    if (!tabId) {
      setStatus('No active tab found');
      return;
    }
    const profile = await loadProfile();
    if (!profile || !profile.entries || Object.keys(profile.entries).length === 0) {
      setStatus('Save fields first');
      return;
    }
    await sendMessage(tabId, { type: 'LIGHTNING_AUTOFILL', profile });
    setStatus('Autofill sent!');
  } catch (error) {
    setStatus('Unable to autofill page');
  }
});

clearButton.addEventListener('click', () => {
  clearProfile().catch(() => setStatus('Unable to clear saved fields'));
});

loadProfile().catch(() => setStatus('Unable to load profile', 3000));
