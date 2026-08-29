# Local LLM Translator for Firefox

ローカルで稼働しているLLM（大規模言語モデル）を利用して、Firefox上で表示中のWebページや選択したテキストを指定言語に翻訳するブラウザ拡張機能（WebExtensions / Manifest V3）です。

外部の翻訳APIに依存せず、自身のローカルネットワーク内でセキュアに翻訳処理を完結させることができます。

## 特徴

- **選択範囲の翻訳**: ページ内のテキストを選択した状態で実行すると、その部分だけをインラインで翻訳して置き換えます。
- **ページ全体の翻訳**: 何も選択せずに実行すると、ページ内の主要なテキストブロック（段落、見出し等）を順次抽出し、DOMを直接書き換えます。
- **カスタマイズ可能**: 翻訳先言語、APIエンドポイント、モデル名を設定画面から自由に変更可能です（OpenAI API互換フォーマット対応）。

## 前提条件

- Firefoxブラウザ
- OpenAI API互換のローカルLLMサーバー（vLLM, Ollama, OpenClawなど）
  - デフォルト設定では `unsloth/gemma-4-12b-it-NVFP4` を想定していますが、オプションから任意のモデルに変更可能です。

## インストール方法（デバッグモード）

現在、このアドオンは開発中のため、Firefoxの一時的なアドオンとして読み込みます。

1. このリポジトリをクローンまたはダウンロードします。
2. Firefoxのアドレスバーに `about:debugging#/runtime/this-firefox` を入力して開きます。
3. **「一時的なアドオンを読み込む... (Load Temporary Add-on...)」** ボタンをクリックします。
4. ダウンロードしたフォルダ内の `manifest.json` を選択します。
5. ツールバーにアドオンのアイコンが追加されます。

## 使い方

1. Firefoxの拡張機能メニュー（または `about:addons`）から、本アドオンの「オプション」を開きます。
2. 以下の設定項目をお使いの環境に合わせて入力し、「保存」します。
   - **翻訳先言語**: 例 `日本語`
   - **API URL**: 例 `http://127.0.0.1:8000/v1/chat/completions` （※後述のネットワーク設定を参照）
   - **モデル名**: 例 `unsloth/gemma-4-12b-it-NVFP4`
3. 翻訳したいページを開き、テキストを選択（または未選択のまま）してツールバーのアドオンアイコンをクリックします。

---

## ⚠️ 重要なネットワーク設定（Firefox特有の制限回避）

Firefoxはセキュリティの観点から、ローカルネットワーク内のIPアドレスや `.local` ドメインに対する HTTP (平文) 通信に介入し、HTTPSやHTTP/2への暗号化通信を強制的に試みる場合があります。
これにより、vLLM (uvicorn) 側で `Invalid HTTP request received` などのエラーが発生し、通信が遮断されることがあります。

これを回避するため、以下の**いずれかの方法**で通信経路を構築してください。

### 方法1: SSHポートフォワーディングを利用する（推奨）

ブラウザは `127.0.0.1` (localhost) への通信を例外的に「安全なコンテキスト」として扱うため、SSHトンネルを経由させるのが最も確実で簡単です。

1. クライアント側（ブラウザを動かすPC）の `~/.ssh/config` に以下を追記します。
   ```ssh-config
   Host llm-server
     HostName ubuntupgx.local # 実際のサーバー名またはIP
     LocalForward 8000 127.0.0.1:8000
   ```

2. ターミナルからSSH接続してトンネルを開通させます。
   ```bash
   ssh llm-server
   ```

3. アドオンのオプション画面で、API URLを以下のように設定します。
ローカルネットワーク内のサーバーに直接アクセスしたい場合は、サーバー側で自己署名証明書を作成し、HTTPSで待ち受けるように設定します。  

### 方法2: vLLM側をHTTPS化する（自己署名証明書）
ローカルネットワーク内のサーバーに直接アクセスしたい場合は、サーバー側で自己署名証明書を作成し、HTTPSで待ち受けるように設定します。  

1. LLMサーバー上で秘密鍵と証明書を生成します。
   ```bash
   openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -sha256 -days 3650 -nodes -subj "/CN=xxx.local"
   ```

2. vLLMを証明書指定で起動します。
   ```bash
   vllm serve unsloth/gemma-4-12b-it-NVFP4 --port 8000 --ssl-keyfile key.pem --ssl-certfile cert.pem
   ```

3. 【重要】ブラウザで証明書の例外を許可する
アドオンから通信する前に、Firefoxのアドレスバーに https://xxx.local:8000/v1/models （※ご自身のサーバー名）を入力し、「危険性を承知で続行」をクリックして証明書をブラウザに記憶させます。

4. アドオンのオプション画面で、API URLを以下のように https で設定します。
https://xxx.local:8000/v1/chat/completions


### License
MIT License
