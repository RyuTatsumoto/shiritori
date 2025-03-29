document.addEventListener('DOMContentLoaded', () => {
    // --- DOM要素の取得 ---
    const initialSetupDiv = document.getElementById('initialSetup');
    const gameWrapper = document.getElementById('gameWrapper');
    const initialCountInput = document.getElementById('initialCount');
    const startButton = document.getElementById('startButton');
    const inputArea = document.getElementById('inputArea');
    const backspaceButton = document.getElementById('backspaceButton');
    const keyboardDiv = document.getElementById('keyboard');
    const confirmButton = document.getElementById('confirmButton');
    const logListUl = document.getElementById('logList');
    const passButton = document.getElementById('passButton');
    const passCountSpan = document.getElementById('passCount');
    // ★★★ totalPointsSpan を確実に取得 ★★★
    const totalPointsSpan = document.getElementById('totalPoints');

    // --- 管理対象の文字リスト (変更なし) ---
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
    let totalPoints = 0; // ★★★ totalPoints を復活 ★★★

    // --- 関数定義 ---

    // ★★★ updateKeyDisplay (色分け処理を復活) ★★★
    function updateKeyDisplay(char) {
        if (char === '') return;
        const keyElement = keyElements[char];
        if (!keyElement) return;

        const countSpan = keyElement.querySelector('.count');
        const currentCount = charCounts[char];

        if (countSpan) countSpan.textContent = currentCount;

        // クラスの付け替え
        keyElement.classList.remove('disabled', 'low-count', 'medium-count'); // 一旦全て削除
        keyElement.disabled = false; // 一旦有効化

        if (currentCount <= 0) {
            keyElement.classList.add('disabled');
            keyElement.disabled = true;
        } else if (currentCount === 1) {
            keyElement.classList.add('low-count'); // 残り1
        } else if (currentCount === 2) {
            keyElement.classList.add('medium-count'); // 残り2
        }
        // currentCount > 2 の場合はクラスなし
    }

    // createKeyboard (変更なし)
    function createKeyboard() { keyboardDiv.innerHTML = ''; keyElements = {}; const seionGroupDiv = document.createElement('div'); seionGroupDiv.classList.add('keyboard-group'); characterColumnsData.slice(0, dakutenStartIndex).forEach(col => { const colDiv = document.createElement('div'); colDiv.classList.add('key-column'); col.forEach(char => colDiv.appendChild(createKeyElement(char))); seionGroupDiv.appendChild(colDiv); }); keyboardDiv.appendChild(seionGroupDiv); const separator = document.createElement('hr'); separator.classList.add('keyboard-hr-separator'); keyboardDiv.appendChild(separator); const dakutenGroupDiv = document.createElement('div'); dakutenGroupDiv.classList.add('keyboard-group'); characterColumnsData.slice(dakutenStartIndex).forEach(col => { const colDiv = document.createElement('div'); colDiv.classList.add('key-column'); col.forEach(char => colDiv.appendChild(createKeyElement(char))); dakutenGroupDiv.appendChild(colDiv); }); keyboardDiv.appendChild(dakutenGroupDiv); Object.keys(keyElements).forEach(char => { if (char !== '') updateKeyDisplay(char); }); }
    // createKeyElement (変更なし)
    function createKeyElement(char) { const key = document.createElement('button'); key.classList.add('key'); if (char === '') { key.classList.add('empty'); key.disabled = true; } else { key.dataset.char = char; key.textContent = char; const countSpan = document.createElement('span'); countSpan.classList.add('count'); countSpan.textContent = charCounts[char] !== undefined ? charCounts[char] : '?'; key.appendChild(countSpan); key.addEventListener('click', () => handleKeyPress(char)); keyElements[char] = key; } return key; }
    // handleKeyPress (変更なし)
    function handleKeyPress(char) { if (charCounts[char] > 0) { inputArea.value += char; charCounts[char]--; updateKeyDisplay(char); } }
    // handleBackspace (変更なし)
    function handleBackspace() { const currentText = inputArea.value; if (currentText.length > 0) { const lastChar = currentText.slice(-1); if (allValidCharsList.includes(lastChar)) { inputArea.value = currentText.slice(0, -1); charCounts[lastChar]++; updateKeyDisplay(lastChar); } else { inputArea.value = currentText.slice(0, -1); } } }

    // ★★★ handleConfirm (ポイント加算処理を復活) ★★★
    function handleConfirm() {
        const word = inputArea.value;
        if (word.length > 0) {
            const wordLength = word.length;
            addLogEntry(word, false, wordLength);

            totalPoints += wordLength;
            // ★ totalPointsSpan が存在するか確認してから更新
            if (totalPointsSpan) {
                totalPointsSpan.textContent = totalPoints;
            } else {
                console.error("Error: totalPointsSpan element not found!"); // エラーログ
            }
        }
        inputArea.value = '';
    }

    // handlePass (変更なし)
    function handlePass() { const currentText = inputArea.value; if (currentText.length > 0) { for (const char of currentText) { if (allValidCharsList.includes(char)) { charCounts[char]++; updateKeyDisplay(char); } } } passCounter++; passCountSpan.textContent = passCounter; addLogEntry("(パス)", true, 0); inputArea.value = ''; }
    // addLogEntry (変更なし)
    function addLogEntry(text, isPass, length) { const firstLogItem = logListUl.firstChild; if (firstLogItem) { const oldButton = firstLogItem.querySelector('.cancel-log-button'); if (oldButton) { oldButton.classList.add('hidden'); } } const listItem = document.createElement('li'); const wordSpan = document.createElement('span'); wordSpan.classList.add('log-word'); if (!isPass) { wordSpan.textContent = text; const lengthSpan = document.createElement('span'); lengthSpan.classList.add('log-length'); lengthSpan.textContent = `(${length})`; wordSpan.appendChild(lengthSpan); } else { wordSpan.textContent = text; } listItem.appendChild(wordSpan); const cancelButton = document.createElement('button'); cancelButton.textContent = '取消'; cancelButton.classList.add('cancel-log-button'); cancelButton.addEventListener('click', handleCancelLog); listItem.appendChild(cancelButton); if (isPass) { listItem.classList.add('pass-log'); cancelButton.dataset.isPass = 'true'; cancelButton.dataset.word = ''; } else { cancelButton.dataset.isPass = 'false'; cancelButton.dataset.word = text; } logListUl.insertBefore(listItem, logListUl.firstChild); }

    // ★★★ handleCancelLog (ポイント減算処理を復活) ★★★
    function handleCancelLog(event) {
        const button = event.target;
        const listItem = button.closest('li');
        if (!listItem) return;

        const isPass = button.dataset.isPass === 'true';
        const wordToCancel = button.dataset.word;

        if (isPass) {
            if (passCounter > 0) { passCounter--; passCountSpan.textContent = passCounter; }
        } else {
            if (wordToCancel) {
                const wordLength = wordToCancel.length; // 文字数を取得
                for (const char of wordToCancel) {
                    if (allValidCharsList.includes(char)) { charCounts[char]++; updateKeyDisplay(char); }
                }
                totalPoints -= wordLength; // ポイントを減算
                // ★ totalPointsSpan が存在するか確認してから更新
                if (totalPointsSpan) {
                    totalPointsSpan.textContent = totalPoints;
                } else {
                    console.error("Error: totalPointsSpan element not found!");
                }
            }
        }

        logListUl.removeChild(listItem);
        const newFirstLogItem = logListUl.firstChild;
        if (newFirstLogItem) { const newButton = newFirstLogItem.querySelector('.cancel-log-button'); if (newButton) { newButton.classList.remove('hidden'); } }
    }

    // ★★★ startGame (ポイントリセット処理を復活) ★★★
    function startGame() {
        const count = parseInt(initialCountInput.value, 10);
        if (isNaN(count) || count < 1) { alert('正しい初期個数を入力してください（1以上）。'); return; }
        allValidCharsList.forEach(char => { charCounts[char] = count; });
        passCounter = 0; passCountSpan.textContent = '0';
        totalPoints = 0; // ポイントをリセット
        // ★ totalPointsSpan が存在するか確認してから更新
        if (totalPointsSpan) {
            totalPointsSpan.textContent = '0';
        } else {
             console.error("Error: totalPointsSpan element not found!");
        }
        logListUl.innerHTML = '';
        createKeyboard();
        initialSetupDiv.style.display = 'none';
        gameWrapper.style.display = 'flex';
    }

    // --- イベントリスナーの設定 (変更なし) ---
    startButton.addEventListener('click', startGame);
    backspaceButton.addEventListener('click', handleBackspace);
    confirmButton.addEventListener('click', handleConfirm);
    passButton.addEventListener('click', handlePass);
});