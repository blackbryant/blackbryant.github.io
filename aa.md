# 這是 H1 主標題 (通常是一篇文章的標題)

這是一段普通的內文。Markdown 的設計初衷就是讓寫作變得像純文字一樣簡單，同時又能轉換成結構清晰的網頁。

## 1. 文字格式化 (H2)

你可以輕鬆地為文字加上**粗體**、*斜體*、或是 ~~刪除線~~。
如果需要強烈強調，也可以結合使用 **_粗斜體_**。

## 2. 列表展現

### 無序列表 (H3)
* 前端基礎核心
  * HTML 結構
  * CSS 樣式
  * JavaScript 邏輯
* 現代框架
  * React
  * Vue

### 有序列表
1. 步驟一：安裝 Node.js 環境
2. 步驟二：初始化專案資料夾
3. 步驟三：啟動本地伺服器

### 待辦清單 (Task List)
- [x] 了解 Markdown 基礎語法
- [ ] 實作動態渲染的部落格
- [ ] 將網站部署上線

## 3. 引用與提示 (Blockquote)

> 💡 **提示：** 
> 良好的註解與文件，能大幅降低團隊的溝通成本。
> 「程式碼是寫給機器執行的，但更是寫給其他人閱讀的。」

## 4. 程式碼區塊 (Code Block)

在文章中提到特定變數時可以使用行內程式碼，例如 `const isReady = true;`。

底下是多行程式碼區塊，只要標註語言名稱 (如 javascript)，Prism.js 就能自動加上語法高亮：

```javascript
// 一個簡單的計時器範例
class Timer {
    constructor() {
        this.startTime = Date.now();
    }
    
    getElapsedTime() {
        return Math.floor((Date.now() - this.startTime) / 1000);
    }
}

const myTimer = new Timer();
