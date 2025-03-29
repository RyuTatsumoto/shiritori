// ★★★ ポイント減算・コピー機能両方あり、リスナー修正版 ★★★
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded: イベント発火");

    // --- DOM要素の取得 ---
    const initialSetupDiv = document.getElementById('initialSetup');
    const gameWrapper = document.getElementById('gameWrapper');
    const initialCountInput = document.getElementById('initialCount');
    const startButton = document.getElementById('startButton');
    const inputArea = document.getElementById('inputArea');
    const backspaceButton = document.getElementById('backspaceButton');
    const copyButton = document.getElementById('copyButton'); // ★ コピーボタン
    const keyboardDiv = document.getElementById('keyboard');
    const confirmButton = document.getElementById('confirmButton');
    const logListUl = document.getElementById('logList');
    const passButton = document.getElementById('passButton');
    const passCountSpan = document.getElementById('passCount');
    const totalPointsSpan = document.getElementById('totalPoints');
    const copyMessageDiv = document.getElementById('copyMessage'); // ★ コピーメッセージ
    console.log("totalPointsSpan (初期取得):", totalPointsSpan ? "OK" : "失敗(null)");
    console.log("copyButton:", copyButton ? "取得OK" : "失敗 (null)");
    console.log("copyMessageDiv:", copyMessageDiv ? "取得OK" : "取得失敗 (null)");

    if (!initialSetupDiv || !gameWrapper || !startButton || !inputArea || !keyboardDiv || !confirmButton || !logListUl || !passButton || !passCountSpan ) {
        console.error("必須DOM要素取得失敗。HTML確認要。"); alert("アプリ初期化エラー。HTML確認要。"); return;
    }

    // --- 管理対象の文字リスト ---
    const characterColumnsData = [
        ['あ', 'い', 'う', 'え', 'お'], ['か', 'き', 'く', 'け', 'こ'], ['さ', 'し', 'す', 'せ', 'そ'],
        ['た', 'ち', 'つ', 'て', 'と'], ['な', 'に', 'ぬ', 'ね', 'の'], ['は', 'ひ', 'ふ', 'へ', 'ほ'],
        ['ま', 'み', 'む', 'め', 'も'], ['や', '', 'ゆ', '', 'よ'], ['ら', 'り', 'る', 'れ', 'ろ'],
        ['わ', '', 'を', '', 'ん'],
        ['が', 'ぎ', 'ぐ', 'げ', 'ご'], ['ざ', 'じ', 'ず', 'ぜ', 'ぞ'], ['だ', 'ぢ', 'づ', 'で', 'ど'],
        ['ば', 'び', 'ぶ', 'べ', 'ぼ'], ['ぱ', 'ぴ', 'ぷ', 'ぺ', 'ぽ'], ['ぁ', 'ぃ', 'ぅ', 'ぇ', 'ぉ'],
        ['ゃ', 'ゅ', 'ょ', 'っ', 'ー', 'ヴ']
    ];
    const dakutenStartIndex = 10;
    const allValidCharsList = characterColumnsData.flat().filter(c => c !== '');

    // --- 状態変数 ---
    let charCounts = {};
    let keyElements = {};
    let passCounter = 0;
    let totalPoints = 0;
    let copyMessageTimeout = null;

    // --- 関数定義 ---
    function updateKeyDisplay(char) { if (char === '') return; const keyElement = keyElements[char]; if (!keyElement) { console.warn(`updateKeyDisplay: キー要素"${char}"なし`); return; } const countSpan = keyElement.querySelector('.count'); const currentCount = charCounts[char]; if (countSpan) { countSpan.textContent = currentCount; } else { console.warn(`updateKeyDisplay: countSpanなし for "${char}"`); } keyElement.classList.remove('disabled', 'low-count', 'medium-count'); keyElement.disabled = false; if (currentCount <= 0) { keyElement.classList.add('disabled'); keyElement.disabled = true; } else if (currentCount === 1) { keyElement.classList.add('low-count'); } else if (currentCount === 2) { keyElement.classList.add('medium-count'); } }
    function createKeyboard() { console.log("  createKeyboard: 開始"); keyboardDiv.innerHTML = ''; keyElements = {}; let generatedKeyCount = 0; try { const seionGroupDiv = document.createElement('div'); seionGroupDiv.classList.add('keyboard-group'); characterColumnsData.slice(0, dakutenStartIndex).forEach(col => { const colDiv = document.createElement('div'); colDiv.classList.add('key-column'); col.forEach(char => { const key = createKeyElement(char); colDiv.appendChild(key); if (char !== '') generatedKeyCount++; }); seionGroupDiv.appendChild(colDiv); }); keyboardDiv.appendChild(seionGroupDiv); const separator = document.createElement('hr'); separator.classList.add('keyboard-hr-separator'); keyboardDiv.appendChild(separator); const dakutenGroupDiv = document.createElement('div'); dakutenGroupDiv.classList.add('keyboard-group'); characterColumnsData.slice(dakutenStartIndex).forEach(col => { const colDiv = document.createElement('div'); colDiv.classList.add('key-column'); col.forEach(char => { const key = createKeyElement(char); colDiv.appendChild(key); if (char !== '') generatedKeyCount++; }); dakutenGroupDiv.appendChild(colDiv); }); keyboardDiv.appendChild(dakutenGroupDiv); console.log(`  createKeyboard: ${generatedKeyCount}個生成試行完了`); Object.keys(keyElements).forEach(char => { if (char !== '') updateKeyDisplay(char); }); console.log("  createKeyboard: 初期状態反映 完了"); } catch (error) { console.error("createKeyboard 中エラー:", error); } }
    function createKeyElement(char) { const key = document.createElement('button'); key.classList.add('key'); if (char === '') { key.classList.add('empty'); key.disabled = true; } else { try { key.dataset.char = char; key.textContent = char; const countSpan = document.createElement('span'); countSpan.classList.add('count'); if (charCounts[char] !== undefined) { countSpan.textContent = charCounts[char]; } else { console.warn(`createKeyElement: charCounts["${char}"] 未定義`); countSpan.textContent = '?'; } key.appendChild(countSpan); key.addEventListener('click', () => handleKeyPress(char)); keyElements[char] = key; } catch (error) { console.error(`createKeyElement("${char}")エラー:`, error); } } return key; }
    function handleKeyPress(char) { console.log(`handleKeyPress: "${char}" クリック。残り:`, charCounts[char]); if (charCounts[char] > 0) { console.log(`  > 処理実行`); inputArea.value += char; charCounts[char]--; updateKeyDisplay(char); console.log(`  > 処理完了。残り:`, charCounts[char]); } else { console.log(`  > 処理スキップ (残り0)`); } }
    function handleBackspace() { const currentText = inputArea.value; if (currentText.length > 0) { const lastChar = currentText.slice(-1); if (allValidCharsList.includes(lastChar)) { inputArea.value = currentText.slice(0, -1); charCounts[lastChar]++; updateKeyDisplay(lastChar); } else { inputArea.value = currentText.slice(0, -1); } } }
    function handleConfirm() { const word = inputArea.value; console.log("handleConfirm: 実行, word=", word); if (word.length > 0) { const wordLength = word.length; addLogEntry(word, false, wordLength); try { totalPoints += wordLength; console.log("  ポイント加算後:", totalPoints); const currentTotalPointsSpan = document.getElementById('totalPoints'); if (currentTotalPointsSpan) { currentTotalPointsSpan.textContent = totalPoints; } else { console.error("Error: totalPointsSpan not found!"); } } catch (error) { console.error("handleConfirm ポイント処理エラー:", error); } } inputArea.value = ''; console.log("handleConfirm: 完了"); }
    function handlePass() { const currentText = inputArea.value; if (currentText.length > 0) { for (const char of currentText) { if (allValidCharsList.includes(char)) { charCounts[char]++; updateKeyDisplay(char); } } } passCounter++; passCountSpan.textContent = passCounter; addLogEntry("(パス)", true, 0); inputArea.value = ''; }
    function addLogEntry(text, isPass, length) { const firstLogItem = logListUl.firstChild; if (firstLogItem) { const oldButton = firstLogItem.querySelector('.cancel-log-button'); if (oldButton) { oldButton.classList.add('hidden'); } } const listItem = document.createElement('li'); const wordSpan = document.createElement('span'); wordSpan.classList.add('log-word'); if (!isPass) { wordSpan.textContent = text; const lengthSpan = document.createElement('span'); lengthSpan.classList.add('log-length'); lengthSpan.textContent = `(${length})`; wordSpan.appendChild(lengthSpan); } else { wordSpan.textContent = text; } listItem.appendChild(wordSpan); const cancelButton = document.createElement('button'); cancelButton.textContent = '取消'; cancelButton.classList.add('cancel-log-button'); cancelButton.addEventListener('click', handleCancelLog); listItem.appendChild(cancelButton); if (isPass) { listItem.classList.add('pass-log'); cancelButton.dataset.isPass = 'true'; cancelButton.dataset.word = ''; } else { cancelButton.dataset.isPass = 'false'; cancelButton.dataset.word = text; } logListUl.insertBefore(listItem, logListUl.firstChild); }
    function handleCancelLog(event) { const button = event.target; const listItem = button.closest('li'); if (!listItem) return; const isPass = button.dataset.isPass === 'true'; const wordToCancel = button.dataset.word; console.log("handleCancelLog: 実行, isPass=", isPass, "word=", wordToCancel); if (isPass) { if (passCounter > 0) { passCounter--; passCountSpan.textContent = passCounter; console.log("  パス取消、カウンター:", passCounter); } } else { if (wordToCancel) { const wordLength = wordToCancel.length; console.log("  単語取り消し, wordLength=", wordLength); for (const char of wordToCancel) { if (allValidCharsList.includes(char)) { charCounts[char]++; updateKeyDisplay(char); } } totalPoints -= wordLength; console.log("  ポイント減算後:", totalPoints); const currentTotalPointsSpan = document.getElementById('totalPoints'); if (currentTotalPointsSpan) { currentTotalPointsSpan.textContent = totalPoints; } else { console.error("Error: totalPointsSpan not found!"); } } } logListUl.removeChild(listItem); const newFirstLogItem = logListUl.firstChild; if (newFirstLogItem) { const newButton = newFirstLogItem.querySelector('.cancel-log-button'); if (newButton) { newButton.classList.remove('hidden'); console.log("  新しい先頭ログのボタンを表示"); } } console.log("handleCancelLog: 完了"); }
    function handleCopy() { const textToCopy = inputArea.value; console.log("handleCopy: 実行, text=", textToCopy); if (textToCopy.length === 0) { showCopyMessage("入力欄が空です"); return; } navigator.clipboard.writeText(textToCopy) .then(() => { console.log("  コピー成功"); showCopyMessage("コピーしました！"); }) .catch(err => { console.error('クリップボードへのコピー失敗:', err); showCopyMessage("コピーに失敗しました"); }); }
    function showCopyMessage(message) { console.log("showCopyMessage:", message); if (!copyMessageDiv) { console.warn("copyMessageDiv 見つからず"); return; } copyMessageDiv.textContent = message; copyMessageDiv.classList.add('show'); if (copyMessageTimeout) { clearTimeout(copyMessageTimeout); } copyMessageTimeout = setTimeout(() => { copyMessageDiv.classList.remove('show'); }, 1500); }
    function startGame() { console.log("startGame: 開始"); try { const countValue = initialCountInput ? initialCountInput.value : "5"; const count = parseInt(countValue, 10); console.log("  パース後カウント:", count); if (isNaN(count) || count < 1) { alert('正しい初期個数を入力してください（1以上）。'); console.warn("startGame: 不正カウント中断"); return; } console.log("  charCounts初期化開始"); allValidCharsList.forEach(char => { charCounts[char] = count; }); console.log("  charCounts初期化完了"); console.log("  カウンターリセット開始"); passCounter = 0; if (passCountSpan) passCountSpan.textContent = '0'; else console.error("Error: passCountSpan not found!"); totalPoints = 0; if (totalPointsSpan) totalPointsSpan.textContent = '0'; else console.error("Error: totalPointsSpan not found!"); console.log("  カウンターリセット完了"); console.log("  ログクリア開始"); if (logListUl) logListUl.innerHTML = ''; else console.error("Error: logListUl not found!"); console.log("  ログクリア完了"); console.log("  createKeyboard 呼出"); if (keyboardDiv) { createKeyboard(); console.log("  createKeyboard 完了"); } else { console.error("Error: keyboardDiv not found!"); alert("キーボード表示エリアなし"); return; } console.log("  画面表示切替開始"); if (initialSetupDiv) initialSetupDiv.style.display = 'none'; else console.error("Error: initialSetupDiv not found!"); if (gameWrapper) gameWrapper.style.display = 'flex'; else console.error("Error: gameWrapper not found!"); console.log("  画面表示切替完了"); console.log("startGame: 正常終了"); } catch (error) { console.error("startGameエラー:", error); alert("ゲーム開始エラー"); } }

    // --- イベントリスナーの設定 ---
    console.log("イベントリスナー設定 開始");
    if (startButton) { startButton.addEventListener('click', startGame); console.log("startButtonリスナー設定完了"); } else { console.error("Error: startButton not found!"); alert("開始ボタンなし"); return; }
    if (backspaceButton) backspaceButton.addEventListener('click', handleBackspace); else console.warn("backspaceButton not found");
    if (confirmButton) confirmButton.addEventListener('click', handleConfirm); else console.warn("confirmButton not found");
    if (passButton) passButton.addEventListener('click', handlePass); else console.warn("passButton not found");
    // ★★★ コピーボタンのリスナー設定を再追加 ★★★
    if (copyButton) {
        copyButton.addEventListener('click', handleCopy);
        console.log("copyButtonリスナー設定完了");
    } else {
        console.warn("copyButton not found!");
    }
    console.log("イベントリスナー設定 完了");

});