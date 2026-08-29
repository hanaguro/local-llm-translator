browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "startTranslation") {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    if (selectedText.length > 0) {
      // テキストが選択されている場合は、選択範囲のみを翻訳
      translateSelectedText(selection, selectedText);
    } else {
      // 選択されていない場合は、これまで通りページ全体を翻訳
      translatePageNodes();
    }
  }
});

async function translateSelectedText(selection, text) {
  if (selection.rangeCount === 0) return;
  
  // 選択範囲のDOM構造を取得
  const range = selection.getRangeAt(0);

  // 翻訳結果を挿入するためのspan要素を作成（翻訳中は黄色ハイライト）
  const span = document.createElement('span');
  span.style.backgroundColor = '#fdfd96';
  span.textContent = text;
  
  // 元の選択範囲のテキストを削除し、作成したspanに置き換える
  range.deleteContents();
  range.insertNode(span);
  
  // ハイライト状態を解除して操作しやすくする
  window.getSelection().removeAllRanges();

  try {
    const response = await browser.runtime.sendMessage({
      action: "translateText",
      text: text
    });

    if (response && response.translatedText) {
      // 翻訳結果を反映し、背景色を透明に戻す
      span.textContent = response.translatedText;
      span.style.backgroundColor = 'transparent';
    } else if (response && response.error) {
      console.error("Translation error:", response.error);
      span.style.backgroundColor = '#ffcccb'; // エラー時は薄い赤色に
    }
  } catch (error) {
    console.error("Message passing failed:", error);
    span.style.backgroundColor = '#ffcccb';
  }
}

// 既存のページ全体翻訳機能（そのまま）
async function translatePageNodes() {
  const selectors = 'p, h1, h2, h3, h4, h5, h6, li, blockquote, th, td';
  const elements = document.querySelectorAll(selectors);

  for (let el of elements) {
    const text = el.innerText.trim();
    
    if (text.length > 1 && !el.hasAttribute('data-llm-translated')) {
      const originalBg = el.style.backgroundColor;
      el.style.backgroundColor = '#fdfd96';

      try {
        const response = await browser.runtime.sendMessage({
          action: "translateText",
          text: text
        });

        if (response && response.translatedText) {
          el.innerText = response.translatedText;
          el.setAttribute('data-llm-translated', 'true');
        } else if (response && response.error) {
          console.error("Translation error for block:", response.error);
        }
      } catch (error) {
        console.error("Message passing failed:", error);
      } finally {
        el.style.backgroundColor = originalBg;
      }
    }
  }
  console.log("Page translation completed.");
}
