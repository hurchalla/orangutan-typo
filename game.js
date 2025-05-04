const wordsList = [
  "the", "be", "of", "and", "a", "to", "in", "he", "have", "it",
  "that", "for", "they", "with", "as", "not", "on", "she", "at",
  "by", "this", "we", "you", "do", "but", "from", "or", "which", "one",
  "would", "all", "will", "there", "say", "who", "make", "when", "can", "more",
  "if", "no", "man", "out", "other", "so", "what", "time", "up", "go",
  "about", "than", "into", "could", "state", "only", "new", "year", "some", "take",
  "come", "these", "know", "see", "use", "get", "like", "then", "first", "any",
  "work", "now", "may", "such", "give", "over", "think", "most", "even", "find",
  "day", "also", "after", "way", "many", "must", "look", "before", "great", "back",
  "through", "long", "where", "much", "should", "well", "people", "down", "own", "just",
  "because", "good", "each", "those", "feel", "seem", "how", "high", "too", "place",
  "little", "world", "very", "still", "nation", "hand", "old", "life", "tell", "write",
  "become", "here", "show", "house", "both", "between", "need", "mean", "call", "develop",
  "under", "last", "right", "move", "thing", "general", "school", "never", "same", "another",
  "begin", "while", "number", "part", "turn", "real", "leave", "might", "want", "point",
  "form", "off", "child", "few", "small", "since", "against", "ask", "late", "home",
  "interest", "large", "person", "end", "open", "public", "follow", "during", "present", "without",
  "again", "hold", "govern", "around", "possible", "head", "consider", "word", "program", "problem",
  "however", "lead", "system", "set", "order", "eye", "plan", "run", "keep", "face",
  "fact", "group", "play", "stand", "increase", "early", "course", "change", "help", "line"
];

const displayWords = document.getElementById('words-display');
const wpmDisplay = document.getElementById('wpm');
const timerDisplay = document.getElementById('timer');
const restartBtn = document.getElementById('restart-button');

const finishedMessage = document.getElementById('game-finished');

const backspaceChanceInput = document.getElementById("backspace-slider");
const backspaceValueDisplay = document.getElementById("backspace-slider-value");

// Add references to the new input and label elements
const corruptionChanceInput = document.getElementById('corruption-slider');
const corruptionChanceValueDisplay = document.getElementById('corruption-slider-value');

const backspaceSymbol = "\u232B";
const typoBackspaceSymbol = "\u2190";  // left arrow

let lines = [];
let typedLines = [];
let currentLineIndex = 0;
let currentWordInLine = 0;
let currentCharIndex = 0;
let totalWords = 60;
let startTime = 0;
let firstKeystroke = false;
let timerInterval = null;
let wpmInterval = null;

function splitIntoLines(words, maxLineLength = 45) {
  const result = [];
  let line = [];
  let lineLength = 0;

  const backspaceChance = parseFloat(backspaceChanceInput.value) / 100;

  for (const word of words) {
    let modifiedWord = "";
    let firstBackPosition = -1;
    for (let i = 0; i < word.length; i++) {
      modifiedWord += word[i];

      let j = i;
      let tmpPosition = firstBackPosition;
      while (Math.random() < backspaceChance && j >= 0 && j >= firstBackPosition) {
        tmpPosition = j;
        modifiedWord += backspaceSymbol;
        --j;
      }
      firstBackPosition = tmpPosition;
      while (j < i) {
        ++j;
        modifiedWord += word[j];
      }

      tmpPosition = firstBackPosition;
      while (Math.random() < backspaceChance && j >= 0 && j >= firstBackPosition) {
        tmpPosition = j;
        modifiedWord += backspaceSymbol;
        --j;
      }
      firstBackPosition = tmpPosition;
      while (j < i) {
        ++j;
        modifiedWord += word[j];
      }
    }

    const extra = line.length > 0 ? modifiedWord.length + 1 : modifiedWord.length;
    if (lineLength + extra <= maxLineLength) {
      line.push(modifiedWord);
      lineLength += extra;
    } else {
      result.push(line);
      line = [modifiedWord];
      lineLength = modifiedWord.length;
    }
  }

  if (line.length) result.push(line);
  return result;
}

function countCorrectlyTypedChars() {
  let correctChars = 0;

  for (let i = 0; i <= currentLineIndex; i++) {
    const typedLine = typedLines[i];
    const correctLine = lines[i];

    const wordLimit = (i === currentLineIndex) ? currentWordInLine + 1 : typedLine.length;

    for (let j = 0; j < wordLimit; j++) {
      const typedWord = typedLine[j] || '';
      const correctWord = correctLine[j];

      const maxLen = Math.min(typedWord.length, correctWord.length);
      for (let k = 0; k < maxLen; k++) {
        if (typedWord[k] === correctWord[k]) {
          correctChars++;
        }
      }

      // Count the space after each word, including after the last word in the line
      if (j < currentWordInLine || i < currentLineIndex) {
        correctChars++; // Count space after correctly typed words
      }
    }
  }

  return correctChars;
}

function startGame() {
  const wordsToDisplay = [];
  for (let i = 0; i < totalWords; i++) {
    const randomIndex = Math.floor(Math.random() * wordsList.length);
    wordsToDisplay.push(wordsList[randomIndex]);
  }

  lines = splitIntoLines(wordsToDisplay);

  // Initialize typedLines to match the structure of 'lines'
  typedLines = lines.map(line => line.map(() => ""));  // An array of empty strings for each word in each line

  currentLineIndex = 0;
  currentWordInLine = 0;
  currentCharIndex = 0;
  wpmDisplay.textContent = 'WPM: 0.0';
  timerDisplay.textContent = 'Time: 0s';
  restartBtn.style.display = 'block';
  if (finishedMessage) {
    finishedMessage.style.display = 'none';
  }

  startTime = 0;
  firstKeystroke = false;

  if (timerInterval) clearInterval(timerInterval);
  if (wpmInterval) clearInterval(wpmInterval);
  
  timerInterval = setInterval(updateTimer, 100);
  wpmInterval = setInterval(updateWPM, 1000);
  
  corruptionChanceValueDisplay.textContent = `${corruptionChanceInput.value}%`;
  backspaceValueDisplay.textContent = `${backspaceChanceInput.value}%`;

  updateWordDisplay();
}

function updateTimer() {
  if (firstKeystroke) {
    const elapsed = Math.floor((Date.now() - startTime) / 1000); // Round to nearest whole number
    timerDisplay.textContent = `Time: ${elapsed}s`; // Display without decimal
  }
}

function updateWPM() {
  if (firstKeystroke) {
    // Calculate WPM using the number of correctly typed characters and time elapsed
    const elapsedTime = (Date.now() - startTime) / 1000;
    const correctChars = countCorrectlyTypedChars();
    const wpm = ((12 * correctChars) / elapsedTime).toFixed(1);
    wpmDisplay.textContent = `WPM: ${wpm}`;
  }
}

function handleKeydown(event) {
  const key = event.key;
  const currentWord = lines[currentLineIndex][currentWordInLine];
  const typedWord = typedLines[currentLineIndex][currentWordInLine];

  // Set startTime when the first key is typed
  if (!firstKeystroke && key.length === 1) {
    firstKeystroke = true;
    startTime = Date.now();
  }

  // Handle Ctrl/Command + Backspace or Delete for deleting entire word
  if ((event.ctrlKey || event.metaKey) && (key === 'Backspace' || key === 'Delete')) {
    // If at the start of the first word in a line, move to the last word of the previous line
    if (typedWord.length === 0 && currentWordInLine === 0 && currentLineIndex > 0) {
      // Move to the last word of the previous line
      currentLineIndex--;
      currentWordInLine = lines[currentLineIndex].length - 1;
    } else if (typedWord.length === 0 && currentWordInLine > 0) {
      // Move to the previous word
      currentWordInLine--;
    }
    // Clear the current typed word
    typedLines[currentLineIndex][currentWordInLine] = '';
    updateWordDisplay();
    return; // Prevent further handling of the Backspace/Delete key
  }

  if (key === ' ' && typedWord.length === currentWord.length) {
    // Move to the next word
    currentWordInLine++;
    if (currentWordInLine >= lines[currentLineIndex].length) {
      currentLineIndex++;
      currentWordInLine = 0;
    }
  } else if (key.length === 1 && /^[a-zA-Z]$/.test(key)) {
    // Regular character input
    if (typedWord.length < currentWord.length) {
      let wordHasError = false;
      for (let i = 0; i < typedWord.length; i++) {
        if (typedWord[i] !== currentWord[i]) {
          wordHasError = true;
        }
      }
      const desiredKey = currentWord[typedWord.length];

      // randomly cause a typo if the current word doesn't have any errors yet.
      const corruptionChance = parseFloat(corruptionChanceInput.value) / 100; // Get the corruption chance from the input
      const shouldCorrupt = key === desiredKey && !wordHasError && Math.random() < corruptionChance;
      let charToAdd = shouldCorrupt ? 'X' : key;
      if (key !== desiredKey && desiredKey === backspaceSymbol)
        charToAdd = typoBackspaceSymbol;
      typedLines[currentLineIndex][currentWordInLine] += charToAdd;
    }
    // End the game when the user finishes typing the last word.
    if (currentLineIndex === lines.length - 1 && currentWordInLine === lines[currentLineIndex].length - 1 && typedLines[currentLineIndex][currentWordInLine].length == currentWord.length) {
      updateWordDisplay();
      endGame();
      return;
    }
  } else if (key === 'Backspace') {
    // Handle Backspace
    
    // If at the start of the first word in a line, move to the last word of the previous line
    if (typedWord.length === 0 && currentWordInLine === 0 && currentLineIndex > 0) {
      // Move to the last word of the previous line
      currentLineIndex--;
      currentWordInLine = lines[currentLineIndex].length - 1;
      typedLines[currentLineIndex][currentWordInLine] = typedLines[currentLineIndex][currentWordInLine] || ''; // Ensure the word is defined
      updateWordDisplay();
      return; // Stop further Backspace handling
    }

    // Backspace within a word or if not at the start of the first word
    if (typedWord.length === 0 && currentWordInLine > 0) {
      // Move to the previous word
      currentWordInLine--;
      typedLines[currentLineIndex][currentWordInLine] = typedLines[currentLineIndex][currentWordInLine] || ''; // Ensure it's defined
    } else if (typedWord.length > 0) {
      // handle when the desiredKey is the special backspace symbol
      if (typedWord.length < currentWord.length) {
        let wordHasError = false;
        for (let i = 0; i < typedWord.length; i++) {
          if (typedWord[i] !== currentWord[i]) {
            wordHasError = true;
          }
        }
        const desiredKey = currentWord[typedWord.length];
        if (desiredKey === backspaceSymbol && !wordHasError) {
          typedLines[currentLineIndex][currentWordInLine] += backspaceSymbol;
          updateWordDisplay();
          return; // Stop further Backspace handling
        }
      }
      // Backspace within a word
      typedLines[currentLineIndex][currentWordInLine] = typedWord.slice(0, -1);
    }

    updateWordDisplay();
  }

  updateWordDisplay();
}


function updateWordDisplay() {
  let html = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (let j = 0; j < line.length; j++) {
      const word = line[j];
      const typedWord = typedLines[i][j];  // Get the user's typed word for this position

      if (i < currentLineIndex || (i === currentLineIndex && j <= currentWordInLine)) {
        if (i === currentLineIndex && j === currentWordInLine) {
          html += '<span class="current-word">';
        } else {
          html += '<span class="correct">';
        }
        for (let k = 0; k < word.length; k++) {
          if (k < typedWord.length) {
            const expected = word[k];
            const actual = typedWord[k];
            if (expected === actual) {
              html += `<span class="correct">${actual}</span>`;
            } else {
              html += `<span class="incorrect">${actual}</span>`;
            }
          } else if (k === typedWord.length) {
            html += `<span class="cursor"></span>${word[k]}`;
          } else {
            html += word[k];
          }
        }
        html += '</span>';
      } else {
        html += word;
      }

      if (j !== line.length - 1) {
        const space = ' ';
        if (i === currentLineIndex && j === currentWordInLine && typedWord.length === word.length)
          html += `<span class="cursor"></span>${space}`;
        else
          html += space;
      } else {
        if (i === currentLineIndex && j === currentWordInLine && typedWord.length === word.length)
          html += `<span class="cursor"></span><br>`;
        else
          html += '<br>';
      }
    }
  }
  html += '<br>';

  displayWords.innerHTML = html;
}

function endGame() {
  clearInterval(timerInterval);
  clearInterval(wpmInterval);
  if (finishedMessage) {
    finishedMessage.style.display = 'block';
  }
}

restartBtn.addEventListener('click', () => {
  startGame();
});

document.addEventListener('keydown', handleKeydown);
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    startGame();
  }
});

// Update the displayed corruption chance value when the user changes the slider
corruptionChanceInput.addEventListener('input', () => {
  corruptionChanceValueDisplay.textContent = `${corruptionChanceInput.value}%`;
});

backspaceChanceInput.addEventListener("input", () => {
  backspaceValueDisplay.textContent = `${backspaceChanceInput.value}%`;
});

backspaceChanceInput.addEventListener("change", () => {
  startGame();
});

// Start the game on page load
startGame();
