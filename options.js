document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('saveBtn').addEventListener('click', saveOptions);

function saveOptions() {
  const targetLang = document.getElementById('targetLang').value;
  const apiUrl = document.getElementById('apiUrl').value;
  const modelName = document.getElementById('modelName').value;

  browser.storage.local.set({
    targetLang: targetLang,
    apiUrl: apiUrl,
    modelName: modelName
  }).then(() => {
    const status = document.getElementById('status');
    status.textContent = '設定を保存しました。';
    setTimeout(() => { status.textContent = ''; }, 3000);
  });
}

function restoreOptions() {
  browser.storage.local.get({
    targetLang: '日本語',
    apiUrl: 'http://127.0.0.1:8000/v1/chat/completions',
    modelName: 'unsloth/gemma-4-12b-it-NVFP4'
  }).then((result) => {
    document.getElementById('targetLang').value = result.targetLang;
    document.getElementById('apiUrl').value = result.apiUrl;
    document.getElementById('modelName').value = result.modelName;
  });
}
