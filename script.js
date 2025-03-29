document.addEventListener('DOMContentLoaded', () => {
    // --- DOM要素の取得 (変更なし) ---
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

    // --- 状態変数 (変更なし) ---
    let charCounts = {};
    let keyElements = {};
    let passCounter = 0;

    // --- 関数定義 ---

    // updateKeyDisplay (変更なし)
    function updateKeyDisplay(char) { if (char === '') return; const keyElement = keyElements[char]; if (!keyElement) return; const countSpan = keyElement.querySelector('.count'); const currentCount = charCounts[char]; if (countSpan) countSpan.textContent = currentCount; if (currentCount <= 0) { keyElement.classList.add('disabled'); keyElement.classList.remove('low-count'); keyElement.disabled = true; } else if (currentCount === 1) { keyElement.classList.add('low-count'); keyElement.classList.remove('disabled'); keyElement.disabled = false; } else { keyElement.classList.remove('disabled'); keyElement.classList.remove('low-count'); keyElement.disabled = false; } }
    // createKeyboard (変更なし)
    function createKeyboard() { keyboardDiv.innerHTML = ''; keyElements = {}; const seionGroupDiv = document.createElement('div'); seionGroupDiv.classList.add('keyboard-group'); characterColumnsData.slice(0, dakutenStartIndex).forEach(col => { const colDiv = document.createElement('div'); colDiv.classList.add('key-column'); col.forEach(char => colDiv.appendChild(createKeyElement(char))); seionGroupDiv.appendChild(colDiv); }); keyboardDiv.appendChild(seionGroupDiv); const separator = document.createElement('hr'); separator.classList.add('keyboard-hr-separator'); keyboardDiv.appendChild(separator); const dakutenGroupDiv = document.createElement('div'); dakutenGroupDiv.classList.add('keyboard-group'); characterColumnsData.slice(dakutenStartIndex).forEach(col => { const colDiv = document.createElement('div'); colDiv.classList.add('key-column'); col.forEach(char => colDiv.appendChild(createKeyElement(char))); dakutenGroupDiv.appendChild(colDiv); }); keyboardDiv.appendChild(dakutenGroupDiv); Object.keys(keyElements).forEach(char => { if (char !== '') updateKeyDisplay(char); }); }
    // createKeyElement (変更なし)
    function createKeyElement(char) { const key = document.createElement('button'); key.classList.add('key'); if (char === '') { key.classList.add('empty'); key.disabled = true; } else { key.dataset.char = char; key.textContent = char; const countSpan = document.createElement('span'); countSpan.classList.add('count'); countSpan.textContent = charCounts[char] !== undefined ? charCounts[char] : '?'; key.appendChild(countSpan); key.addEventListener('click', () => handleKeyPress(char)); keyElements[char] = key; } return key; }
    // handleKeyPress (変更なし)
    function handleKeyPress(char) { if (charCounts[char] > 0) { inputArea.value += char; charCounts[char]--; updateKeyDisplay(char); } }
    // handleBackspace (変更なし)
    function handleBackspace() { const currentText = inputArea.value; if (currentText.length > 0) { const lastChar = currentText.slice(-1); if (allValidCharsList.includes(lastChar)) { inputArea.value = currentText.slice(0, -1); charCounts[lastChar]++; updateKeyDisplay(lastChar); } else { inputArea.value = currentText.slice(0, -1); } } }
    // handleConfirm (変更なし)
    function handleConfirm() { const word = inputArea.value; if (word.length > 0) { addLogEntry(word, false); } inputArea.value = ''; }
    // handlePass (変更なし)
    function handlePass() { const currentText = inputArea.value; if (currentText.length > 0) { for (const char of currentText) { if (allValidCharsList.includes(char)) { charCounts[char]++; updateKeyDisplay(char); } } } passCounter++; passCountSpan.textContent = passCounter; addLogEntry("(パス)", true); inputArea.value = ''; }


    // ★★★ ログにエントリーを追加する関数 (パスにもボタン追加、ボタン表示制御) ★★★
    function addLogEntry(text, isPass) {
        // --- 以前の先頭ログの取り消しボタンを非表示にする ---
        const firstLogItem = logListUl.firstChild;
        if (firstLogItem) {
            const oldButton = firstLogItem.querySelector('.cancel-log-button');
            if (oldButton) {
                oldButton.classList.add('hidden'); // 古いボタンは隠す
            }
        }

        // --- 新しいログアイテムを作成 ---
        const listItem = document.createElement('li');
        const wordSpan = document.createElement('span');
        wordSpan.classList.add('log-word');
        wordSpan.textContent = text;
        listItem.appendChild(wordSpan);

        // --- 取り消しボタンを必ず追加 ---
        const cancelButton = document.createElement('button');
        cancelButton.textContent = '取消';
        cancelButton.classList.add('cancel-log-button'); // ★ hidden は付けない (デフォルト表示)
        cancelButton.addEventListener('click', handleCancelLog);
        listItem.appendChild(cancelButton); // 先にボタンを追加しておく

        // --- パスかどうかの情報を設定 ---
        if (isPass) {
            listItem.classList.add('pass-log');
            cancelButton.dataset.isPass = 'true'; // ★ パスであることを示す
            cancelButton.dataset.word = ''; // パスの単語は空
        } else {
            cancelButton.dataset.isPass = 'false'; // ★ 単語であることを示す
            cancelButton.dataset.word = text; // ★ 単語を保持
        }

        // リストの先頭に追加
        logListUl.insertBefore(listItem, logListUl.firstChild);
    }

    // ★★★ 取り消しボタンがクリックされた時の処理 (パス判定、カウンター処理追加) ★★★
    function handleCancelLog(event) {
        const button = event.target;
        const listItem = button.closest('li');
        if (!listItem) return;

        const isPass = button.dataset.isPass === 'true'; // ★ data-is-pass を見て判定
        const wordToCancel = button.dataset.word;

        // --- 取り消し処理 ---
        if (isPass) {
            // パスの取り消し
            if (passCounter > 0) { // 念のためカウンターが0より大きいか確認
                passCounter--;
                passCountSpan.textContent = passCounter;
            }
        } else {
            // 単語の取り消し (文字を戻す)
            if (wordToCancel) {
                for (const char of wordToCancel) {
                    if (allValidCharsList.includes(char)) {
                        charCounts[char]++;
                        updateKeyDisplay(char);
                    }
                }
            }
        }

        // --- ログから削除 ---
        logListUl.removeChild(listItem);

        // --- 新しい先頭ログのボタンを表示状態にする ---
        const newFirstLogItem = logListUl.firstChild;
        if (newFirstLogItem) {
            const newButton = newFirstLogItem.querySelector('.cancel-log-button');
            if (newButton) {
                newButton.classList.remove('hidden'); // ★ 新しい先頭のボタンを表示
            }
        }
    }

    // startGame (変更なし)
    function startGame() { const count = parseInt(initialCountInput.value, 10); if (isNaN(count) || count < 1) { alert('正しい初期個数を入力してください（1以上）。'); return; } allValidCharsList.forEach(char => { charCounts[char] = count; }); passCounter = 0; passCountSpan.textContent = '0'; logListUl.innerHTML = ''; createKeyboard(); initialSetupDiv.style.display = 'none'; gameWrapper.style.display = 'flex'; }

    // --- イベントリスナーの設定 (変更なし) ---
    startButton.addEventListener('click', startGame);
    backspaceButton.addEventListener('click', handleBackspace);
    confirmButton.addEventListener('click', handleConfirm);
    passButton.addEventListener('click', handlePass);

});