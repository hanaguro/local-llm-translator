// 拡張機能アイコンがクリックされたら、現在のタブに翻訳開始メッセージを送信
browser.action.onClicked.addListener((tab) => {
  browser.tabs.sendMessage(tab.id, { action: "startTranslation" }).catch(err => {
    console.error("Content scriptと通信できません。ページをリロードしてください。", err);
  });
});

// コンテンツスクリプトからの翻訳リクエストを処理
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "translateText") {
    // 非同期でAPIを叩き、結果を返す
    handleTranslation(request.text).then(sendResponse);
    return true; // 非同期応答を示すために必須
  }
});

async function handleTranslation(text) {
  const config = await browser.storage.local.get({
    targetLang: '日本語',
    apiUrl: 'http://127.0.0.1:8000/v1/chat/completions',
    modelName: 'unsloth/gemma-4-12b-it-NVFP4'
  });

  const systemPrompt = `You are a professional translator. Translate the given text into ${config.targetLang}. Return ONLY the translated text. Do not add any explanations, quotes, or conversational filler.`;

  try {
    const response = await fetch(config.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: config.modelName,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text }
        ],
        temperature: 0.1, // 翻訳タスクのため低めに設定
        max_tokens: 2048
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { translatedText: data.choices[0].message.content.trim() };
  } catch (error) {
    console.error("LLM API request failed:", error);
    return { error: error.message };
  }
}
