// scripts/clipboard.js
// Copy/Paste Feature für Tabellenzellen

(function(window) {
  'use strict';

  let selectedCells = [];
  let copiedData = null;
  let isSelecting = false;
  let lastSelectedCell = null;

  function initClipboard() {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('click', handleCellClick);
    console.log('✅ Clipboard System initialisiert');
  }

  function handleKeyDown(e) {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        copySelectedCells();
      } else if (e.key === 'v' || e.key === 'V') {
        e.preventDefault();
        pasteToSelectedCells();
      }
    }

    if (e.key === 'Escape') {
      clearSelection();
    }
  }

  function handleCellClick(e) {
    const cell = e.target.closest('td');
    if (!cell) {
      if (!e.target.closest('.toast')) {
        clearSelection();
      }
      return;
    }

    const table = cell.closest('table');
    if (!table || table.id !== 'tracker') {
      return;
    }

    const input = cell.querySelector('input[type="number"]');
    if (!input) {
      return;
    }

    if (e.shiftKey && lastSelectedCell) {
      selectRange(lastSelectedCell, cell);
    } else {
      if (!e.ctrlKey && !e.metaKey) {
        clearSelection();
      }
      toggleCellSelection(cell);
      lastSelectedCell = cell;
    }
  }

  function toggleCellSelection(cell) {
    const index = selectedCells.indexOf(cell);
    if (index > -1) {
      selectedCells.splice(index, 1);
      cell.classList.remove('cell-selected');
    } else {
      selectedCells.push(cell);
      cell.classList.add('cell-selected');
    }
  }

  function selectRange(startCell, endCell) {
    const table = startCell.closest('table');
    const allCells = Array.from(table.querySelectorAll('td'));

    const startIndex = allCells.indexOf(startCell);
    const endIndex = allCells.indexOf(endCell);

    const minIndex = Math.min(startIndex, endIndex);
    const maxIndex = Math.max(startIndex, endIndex);

    clearSelection();

    for (let i = minIndex; i <= maxIndex; i++) {
      const cell = allCells[i];
      const input = cell.querySelector('input[type="number"]');
      if (input) {
        selectedCells.push(cell);
        cell.classList.add('cell-selected');
      }
    }
  }

  function clearSelection() {
    selectedCells.forEach(cell => {
      cell.classList.remove('cell-selected');
      cell.classList.remove('cell-copying');
    });
    selectedCells = [];
    lastSelectedCell = null;
  }

  function copySelectedCells() {
    if (selectedCells.length === 0) {
      if (window.Toast) {
        window.Toast.info('Keine Zellen ausgewählt');
      }
      return;
    }

    copiedData = [];

    selectedCells.forEach(cell => {
      const input = cell.querySelector('input[type="number"]');
      if (input) {
        const value = input.value.trim();
        copiedData.push(value !== '' ? parseFloat(value) : null);
        cell.classList.add('cell-copying');
      }
    });

    setTimeout(() => {
      selectedCells.forEach(cell => {
        cell.classList.remove('cell-copying');
      });
    }, 800);

    if (window.Toast) {
      window.Toast.success(`${copiedData.length} Zellen kopiert`);
    }

    console.log('📋 Kopiert:', copiedData);
  }

  function pasteToSelectedCells() {
    if (!copiedData || copiedData.length === 0) {
      if (window.Toast) {
        window.Toast.warning('Keine Daten zum Einfügen vorhanden');
      }
      return;
    }

    if (selectedCells.length === 0) {
      if (window.Toast) {
        window.Toast.warning('Keine Zellen ausgewählt');
      }
      return;
    }

    let pastedCount = 0;

    const minLength = Math.min(selectedCells.length, copiedData.length);

    for (let i = 0; i < minLength; i++) {
      const cell = selectedCells[i];
      const input = cell.querySelector('input[type="number"]');

      if (input && copiedData[i] !== null) {
        input.value = copiedData[i];

        const event = new Event('input', { bubbles: true });
        input.dispatchEvent(event);

        pastedCount++;
      }
    }

    if (window.Toast) {
      window.Toast.success(`${pastedCount} Werte eingefügt`);
    }

    clearSelection();

    console.log('📋 Eingefügt:', pastedCount, 'Werte');
  }

  window.Clipboard = {
    init: initClipboard,
    copy: copySelectedCells,
    paste: pasteToSelectedCells,
    clear: clearSelection
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initClipboard);
  } else {
    initClipboard();
  }

})(window);
