// ★★★ 枯渇文字判定 取り消し考慮版 (省略なし) ★★★
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded: イベント発火");

    // --- DOM要素の取得 ---
    const initialSetupDiv = document.getElementById('initialSetup');
    const gameWrapper = document.getElementById('gameWrapper');
    const initialCountInput = document.getElementById('initialCount');
    const startButton = document.getElementById('startButton');
    const inputArea = document.getElementById('inputArea');
    const backspaceButton = document.getElementById('backspaceButton');
    const copyButton = document.getElementById('copyButton');
    const keyboardDiv = document.getElementById('keyboard');
    const confirmButton = document.getElementById('confirmButton');
    const logListUl = document.getElementById('logList');
    const passButton = document.getElementById('passButton');
    const passCountSpan = document.getElementById('passCount');
    const totalPointsSpan = document.getElementById('totalPoints');
    const copyMessageDiv = document.getElementById('copyMessage');
    const pointChangePopup = document.getElementById('pointChangePopup');
    const popupBonusText = pointChangePopup ? pointChangePopup.querySelector('.bonus-text') : null;
    const popupPointValue = pointChangePopup ? pointChangePopup.querySelector('.point-value') : null;
    const endGameButton = document.getElementById('endGameButton');
    const statsPopup = document.getElementById('statsPopup');
    const finalPointsSpan = document.getElementById('finalPoints');
    const finalPassCountSpan = document.getElementById('finalPassCount');
    const longestWordTextSpan = document.getElementById('longestWordText');
    const longestWordLengthSpan = document.getElementById('longestWordLength');
    const zeroCharsListSpan = document.getElementById('zeroCharsList');
    const closeStatsButton = document.getElementById('closeStatsButton');
    const restartButton = document.getElementById('restartButton');
    const overlay = document.getElementById('overlay');

    // 必須要素チェック
    if (!initialSetupDiv || !gameWrapper || !startButton || !inputArea || !keyboardDiv || !confirmButton || !logListUl || !passButton || !passCountSpan || !totalPointsSpan || !endGameButton || !statsPopup || !finalPointsSpan || !finalPassCountSpan || !closeStatsButton || !overlay || !restartButton || !longestWordTextSpan || !longestWordLengthSpan || !zeroCharsListSpan ) {
        console.error("必須DOM要素の取得に失敗しました。HTMLのIDを確認してください。");
        alert("アプリの初期化に必要な要素が見つかりません。HTMLを確認してください。");
        return; // 処理中断
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
    let pointChangeTimeout = null;
    let firstZeroChars = []; // 最初に枯渇した文字リスト

    // --- 関数定義 ---

    // キーの表示を更新
    function updateKeyDisplay(char) {
        if (char === '') return;
        const keyElement = keyElements[char];
        if (!keyElement) { console.warn(`updateKeyDisplay: キー要素"${char}"なし`); return; }
        const countSpan = keyElement.querySelector('.count');
        const currentCount = charCounts[char]; // 更新後のカウント
        if (countSpan) { countSpan.textContent = currentCount; } else { console.warn(`updateKeyDisplay: countSpanなし for "${char}"`); }

        // ★★★ 枯渇文字リストからの削除ロジックは handleCancelLog に移動 ★★★
        // ★★★ 枯渇文字リストへの追加ロジックは handleConfirm に移動 ★★★

        keyElement.classList.remove('disabled', 'low-count', 'medium-count');
        keyElement.disabled = false;
        if (currentCount <= 0) {
            keyElement.classList.add('disabled');
            keyElement.disabled = true;
        } else if (currentCount === 1) {
            keyElement.classList.add('low-count');
        } else if (currentCount === 2) {
            keyElement.classList.add('medium-count');
        }
    } // updateKeyDisplay 関数の閉じ括弧

    // キーボードを生成
    function createKeyboard() {
        console.log("  createKeyboard: 開始");
        keyboardDiv.innerHTML = ''; keyElements = {}; let generatedKeyCount = 0;
        try {
            const seionGroupDiv = document.createElement('div'); seionGroupDiv.classList.add('keyboard-group');
            characterColumnsData.slice(0, dakutenStartIndex).forEach(col => { const colDiv = document.createElement('div'); colDiv.classList.add('key-column'); col.forEach(char => { const key = createKeyElement(char); colDiv.appendChild(key); if (char !== '') generatedKeyCount++; }); seionGroupDiv.appendChild(colDiv); });
            keyboardDiv.appendChild(seionGroupDiv);
            const separator = document.createElement('hr'); separator.classList.add('keyboard-hr-separator');
            keyboardDiv.appendChild(separator);
            const dakutenGroupDiv = document.createElement('div'); dakutenGroupDiv.classList.add('keyboard-group');
            characterColumnsData.slice(dakutenStartIndex).forEach(col => { const colDiv = document.createElement('div'); colDiv.classList.add('key-column'); col.forEach(char => { const key = createKeyElement(char); colDiv.appendChild(key); if (char !== '') generatedKeyCount++; }); dakutenGroupDiv.appendChild(colDiv); });
            keyboardDiv.appendChild(dakutenGroupDiv);
            console.log(`  createKeyboard: ${generatedKeyCount}個生成試行完了`);
            Object.keys(keyElements).forEach(char => { if (char !== '') updateKeyDisplay(char); });
            console.log("  createKeyboard: 初期状態反映 完了");
        } catch (error) { console.error("createKeyboard 中エラー:", error); }
    } // createKeyboard 関数の閉じ括弧

    // 個々のキー要素を作成
    function createKeyElement(char) {
        const key = document.createElement('button'); key.classList.add('key');
        if (char === '') { key.classList.add('empty'); key.disabled = true; }
        else {
            try {
                key.dataset.char = char; key.textContent = char;
                const countSpan = document.createElement('span'); countSpan.classList.add('count');
                if (charCounts[char] !== undefined) { countSpan.textContent = charCounts[char]; } else { console.warn(`createKeyElement: charCounts["${char}"] 未定義`); countSpan.textContent = '?'; }
                key.appendChild(countSpan);
                key.addEventListener('click', () => handleKeyPress(char));
                keyElements[char] = key;
            } catch (error) { console.error(`createKeyElement("${char}")エラー:`, error); }
        } return key;
    } // createKeyElement 関数の閉じ括弧

    // キー入力処理
    function handleKeyPress(char) {
        console.log(`handleKeyPress: "${char}" クリック。残り:`, charCounts[char]);
        if (charCounts[char] > 0) {
            console.log(`  > 処理実行`); inputArea.value += char; charCounts[char]--; updateKeyDisplay(char); console.log(`  > 処理完了。残り:`, charCounts[char]);
        } else { console.log(`  > 処理スキップ (残り0)`); }
    } // handleKeyPress 関数の閉じ括弧

    // 1文字削除処理
    function handleBackspace() {
        const currentText = inputArea.value;
        if (currentText.length > 0) {
            const lastChar = currentText.slice(-1);
            if (allValidCharsList.includes(lastChar)) { inputArea.value = currentText.slice(0, -1); charCounts[lastChar]++; updateKeyDisplay(lastChar); }
            else { inputArea.value = currentText.slice(0, -1); }
        }
    } // handleBackspace 関数の閉じ括弧

    // ポイント変動ポップアップ表示
    function displayPointChangePopup(change, bonusType = null) { if (!pointChangePopup || !popupBonusText || !popupPointValue) { console.warn("ポップアップ要素見つからず"); return; } let pointText = ""; let bonusMessage = ""; pointChangePopup.classList.remove('plus', 'minus', 'show', 'has-bonus'); if (change > 0) { pointText = `+${change}`; pointChangePopup.classList.add('plus'); } else if (change < 0) { pointText = `${change}`; pointChangePopup.classList.add('minus'); } else { return; } if (bonusType === "LONG") { bonusMessage = "LONG WORD !"; pointChangePopup.classList.add('has-bonus'); } else if (bonusType === "VERY LONG") { bonusMessage = "VERY LONG WORD !!"; pointChangePopup.classList.add('has-bonus'); } popupBonusText.textContent = bonusMessage; popupPointValue.textContent = pointText; requestAnimationFrame(() => { pointChangePopup.classList.add('show'); }); if (pointChangeTimeout) { clearTimeout(pointChangeTimeout); } pointChangeTimeout = setTimeout(() => { pointChangePopup.classList.remove('show'); }, 1700); }

    // 確定ボタン処理 (枯渇文字記録含む)
    function handleConfirm() {
        const word = inputArea.value;
        console.log("handleConfirm: 実行, word=", word);
        if (word.length > 0) {
            const wordLength = word.length; let bonusPoints = 0; let bonusType = null;
            if (wordLength >= 10) { bonusPoints = 2; bonusType = "VERY LONG"; }
            else if (wordLength >= 7) { bonusPoints = 1; bonusType = "LONG"; }
            const pointChange = wordLength + bonusPoints;

            // ★ 確定された単語の文字で枯渇したものを記録
            // （handleKeyPressでカウントは減っているので、ここで0なら枯渇）
            for (const char of word) {
                if (allValidCharsList.includes(char) && charCounts[char] === 0 && !firstZeroChars.includes(char)) {
                    firstZeroChars.push(char);
                    console.log("枯渇文字追加 (確定時):", char, "現在のリスト:", firstZeroChars);
                }
            }

            addLogEntry(word, false); // ログ追加
            try {
                totalPoints += pointChange; // ポイント加算
                console.log(`  ポイント変動: +${wordLength} (+${bonusPoints}), 合計:`, totalPoints);
                if (totalPointsSpan) { totalPointsSpan.textContent = totalPoints; displayPointChangePopup(pointChange, bonusType); } else { console.error("Error: totalPointsSpan not found!"); }
            } catch (error) { console.error("handleConfirm ポイント処理エラー:", error); }
        }
        inputArea.value = '';
        console.log("handleConfirm: 完了");
    } // handleConfirm 関数の閉じ括弧

    // パスボタン処理
    function handlePass() {
        const currentText = inputArea.value; if (currentText.length > 0) { for (const char of currentText) { if (allValidCharsList.includes(char)) { charCounts[char]++; updateKeyDisplay(char); } } }
        passCounter++; passCountSpan.textContent = passCounter; addLogEntry("(パス)", true);
        totalPoints--; console.log("  パスによりポイント減算後:", totalPoints);
        if (totalPointsSpan) { totalPointsSpan.textContent = totalPoints; displayPointChangePopup(-1, null); } else { console.error("Error: totalPointsSpan not found in handlePass!"); }
        inputArea.value = '';
    } // handlePass 関数の閉じ括弧

    // ログエントリー追加
    function addLogEntry(text, isPass) { const firstLogItem = logListUl.firstChild; if (firstLogItem) { const oldButton = firstLogItem.querySelector('.cancel-log-button'); if (oldButton) { oldButton.classList.add('hidden'); } } const listItem = document.createElement('li'); const wordSpan = document.createElement('span'); wordSpan.classList.add('log-word'); wordSpan.textContent = text; listItem.appendChild(wordSpan); const pointSpan = document.createElement('span'); pointSpan.classList.add('log-point'); const cancelButton = document.createElement('button'); cancelButton.textContent = '取消'; cancelButton.classList.add('cancel-log-button'); cancelButton.addEventListener('click', handleCancelLog); if (isPass) { pointSpan.textContent = '(-1)'; pointSpan.classList.add('minus'); cancelButton.dataset.isPass = 'true'; cancelButton.dataset.word = ''; wordSpan.appendChild(pointSpan); } else { const wordLength = text.length; let bonusPoints = 0; if (wordLength >= 10) { bonusPoints = 2; } else if (wordLength >= 7) { bonusPoints = 1; } const basePointSpan = document.createElement('span'); basePointSpan.classList.add('log-point', 'plus'); basePointSpan.textContent = `(+${wordLength})`; wordSpan.appendChild(basePointSpan); if (bonusPoints > 0) { const bonusPointSpan = document.createElement('span'); bonusPointSpan.classList.add('log-point', 'bonus'); bonusPointSpan.textContent = `(+${bonusPoints})`; wordSpan.appendChild(bonusPointSpan); } cancelButton.dataset.isPass = 'false'; cancelButton.dataset.word = text; } listItem.appendChild(cancelButton); logListUl.insertBefore(listItem, logListUl.firstChild); }

    // ★★★ ログ取り消し処理 (枯渇リストからの削除処理を追加) ★★★
    function handleCancelLog(event) {
        const button = event.target; const listItem = button.closest('li'); if (!listItem) return; const isPass = button.dataset.isPass === 'true'; const wordToCancel = button.dataset.word; console.log("handleCancelLog: 実行, isPass=", isPass, "word=", wordToCancel);
        if (isPass) { if (passCounter > 0) { passCounter--; passCountSpan.textContent = passCounter; totalPoints++; console.log("  パス取消、カウンター:", passCounter, "ポイント:", totalPoints); if (totalPointsSpan) { totalPointsSpan.textContent = totalPoints; } else { console.error("Error: totalPointsSpan not found!"); } } }
        else {
            if (wordToCancel) {
                const wordLength = wordToCancel.length; let bonusPoints = 0; if (wordLength >= 10) { bonusPoints = 2; } else if (wordLength >= 7) { bonusPoints = 1; } const pointChange = wordLength + bonusPoints; console.log("  単語取り消し, wordLength=", wordLength, "bonus=", bonusPoints);
                for (const char of wordToCancel) {
                    if (allValidCharsList.includes(char)) {
                        // ★ カウントを戻す前に、現在のカウントが0なら枯渇リストから削除対象かチェック
                        const shouldRemoveFromZeroList = (charCounts[char] === 0);

                        charCounts[char]++; // カウントを戻す
                        updateKeyDisplay(char); // 表示更新

                        // ★ カウントが0から1に戻った場合、枯渇リストから削除
                        if (shouldRemoveFromZeroList) {
                            const index = firstZeroChars.indexOf(char);
                            if (index > -1) {
                                firstZeroChars.splice(index, 1);
                                console.log("枯渇文字リストから削除:", char, "現在のリスト:", firstZeroChars);
                            }
                        }
                    }
                } // for ループの閉じ括弧
                totalPoints -= pointChange; console.log("  ポイント減算後:", totalPoints); if (totalPointsSpan) { totalPointsSpan.textContent = totalPoints; } else { console.error("Error: totalPointsSpan not found!"); }
            } // if (wordToCancel) の閉じ括弧
        } // else の閉じ括弧
        logListUl.removeChild(listItem); const newFirstLogItem = logListUl.firstChild; if (newFirstLogItem) { const newButton = newFirstLogItem.querySelector('.cancel-log-button'); if (newButton) { newButton.classList.remove('hidden'); console.log("  新しい先頭ログのボタンを表示"); } }
        console.log("handleCancelLog: 完了");
    } // handleCancelLog 関数の閉じ括弧

    // コピーボタン処理
    function handleCopy() { const textToCopy = inputArea.value; console.log("handleCopy: 実行, text=", textToCopy); if (textToCopy.length === 0) { showCopyMessage("入力欄が空です"); return; } navigator.clipboard.writeText(textToCopy) .then(() => { console.log("  コピー成功"); showCopyMessage("コピーしました！"); }) .catch(err => { console.error('クリップボードコピー失敗:', err); showCopyMessage("コピー失敗"); }); }
    // コピーメッセージ表示
    function showCopyMessage(message) { console.log("showCopyMessage:", message); if (!copyMessageDiv) { console.warn("copyMessageDiv 見つからず"); return; } copyMessageDiv.textContent = message; copyMessageDiv.classList.add('show'); if (copyMessageTimeout) { clearTimeout(copyMessageTimeout); } copyMessageTimeout = setTimeout(() => { copyMessageDiv.classList.remove('show'); }, 1500); }

    // ゲーム終了処理
    function handleEndGame() { if (!confirm("本当にゲームを終了しますか？")) { return; } console.log("ゲーム終了処理 開始"); let longestWord = "-"; let longestLength = 0; const logItems = logListUl.querySelectorAll('li:not(.pass-log)'); logItems.forEach(item => { const button = item.querySelector('.cancel-log-button'); if (button && button.dataset.word) { const word = button.dataset.word; if (word.length > longestLength) { longestLength = word.length; longestWord = word; } } }); const zeroCharsText = firstZeroChars.slice(0, 3).join(', ') || "-"; finalPointsSpan.textContent = totalPoints; finalPassCountSpan.textContent = passCounter; longestWordTextSpan.textContent = longestWord; longestWordLengthSpan.textContent = longestLength; zeroCharsListSpan.textContent = zeroCharsText; statsPopup.style.display = 'block'; overlay.style.display = 'block'; console.log("ゲーム終了処理 完了"); }
    // 統計ポップアップ閉じる
    function closeStatsPopup() { statsPopup.style.display = 'none'; overlay.style.display = 'none'; }
    // リスタート処理
    function handleRestartGame() { console.log("ゲームリスタート -> 初期設定画面へ"); closeStatsPopup(); gameWrapper.style.display = 'none'; initialSetupDiv.style.display = 'block'; }

    // ゲーム開始処理 (firstZeroChars リセット含む)
    function startGame() {
        console.log("startGame: 開始");
        try {
            const countValue = initialCountInput ? initialCountInput.value : "5"; const count = parseInt(countValue, 10); console.log("  パース後カウント:", count); if (isNaN(count) || count < 1) { alert('正しい初期個数を入力してください（1以上）。'); console.warn("startGame: 不正カウント中断"); return; }
            console.log("  charCounts初期化開始"); allValidCharsList.forEach(char => { charCounts[char] = count; }); console.log("  charCounts初期化完了");
            console.log("  カウンターと統計リセット開始"); passCounter = 0; if (passCountSpan) passCountSpan.textContent = '0'; else console.error("Error: passCountSpan not found!"); totalPoints = 0; if (totalPointsSpan) totalPointsSpan.textContent = '0'; else console.error("Error: totalPointsSpan not found!"); firstZeroChars = []; if (pointChangePopup) pointChangePopup.classList.remove('show'); console.log("  カウンターと統計リセット完了");
            console.log("  ログクリア開始"); if (logListUl) logListUl.innerHTML = ''; else console.error("Error: logListUl not found!"); console.log("  ログクリア完了");
            console.log("  createKeyboard 呼出"); if (keyboardDiv) { createKeyboard(); console.log("  createKeyboard 完了"); } else { console.error("Error: keyboardDiv not found!"); alert("キーボード表示エリアなし"); return; }
            confirmButton.disabled = false; passButton.disabled = false; backspaceButton.disabled = false; copyButton.disabled = false; endGameButton.disabled = false;
            console.log("  画面表示切替開始"); if (initialSetupDiv) initialSetupDiv.style.display = 'none'; else console.error("Error: initialSetupDiv not found!"); if (gameWrapper) gameWrapper.style.display = 'flex'; else console.error("Error: gameWrapper not found!"); console.log("  画面表示切替完了");
            console.log("startGame: 正常終了");
        } catch (error) { console.error("startGameエラー:", error); alert("ゲーム開始エラー"); }
    } // startGame 関数の閉じ括弧

    // --- イベントリスナーの設定 ---
    console.log("イベントリスナー設定 開始");
    if (startButton) { startButton.addEventListener('click', startGame); console.log("startButtonリスナー設定完了"); } else { console.error("Error: startButton not found!"); alert("開始ボタンなし"); return; }
    if (backspaceButton) backspaceButton.addEventListener('click', handleBackspace); else console.warn("backspaceButton not found");
    if (confirmButton) confirmButton.addEventListener('click', handleConfirm); else console.warn("confirmButton not found");
    if (passButton) passButton.addEventListener('click', handlePass); else console.warn("passButton not found");
    if (copyButton) { copyButton.addEventListener('click', handleCopy); console.log("copyButtonリスナー設定完了"); } else { console.warn("copyButton not found!"); }
    if (endGameButton) { endGameButton.addEventListener('click', handleEndGame); console.log("endGameButtonリスナー設定完了"); } else { console.warn("endGameButton not found!"); }
    if (closeStatsButton) { closeStatsButton.addEventListener('click', closeStatsPopup); console.log("closeStatsButtonリスナー設定完了"); } else { console.warn("closeStatsButton not found!"); }
    if (restartButton) { restartButton.addEventListener('click', handleRestartGame); console.log("restartButtonリスナー設定完了"); } else { console.warn("restartButton not found!"); }
    if (overlay) { overlay.addEventListener('click', closeStatsPopup); }
    console.log("イベントリスナー設定 完了");

}); // DOMContentLoaded end