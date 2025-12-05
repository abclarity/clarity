// scripts/cell-selection.js
// Google Sheets-style Cell Selection & Editing

(function(window) {
  'use strict';

  let selectedCell = null;
  let editingCell = null;
  let copiedValue = null;
  let copiedCell = null;

  // === State Management ===
  function clearSelection() {
    if (selectedCell) {
      selectedCell.classList.remove('cell-selected');
      selectedCell = null;
    }
  }

  function clearEditing() {
    if (editingCell) {
      editingCell.classList.remove('cell-editing');
      const input = editingCell.querySelector('input');
      if (input) {
        input.blur();
      }
      editingCell = null;
    }
  }

  function clearCopyState() {
    if (copiedCell) {
      copiedCell.classList.remove('cell-copying');
      copiedCell = null;
    }
  }

  function selectCell(td) {
    if (!td || td.classList.contains('calc') || td.classList.contains('weekday') || !td.querySelector('input')) {
      return;
    }

    clearEditing();
    clearSelection();

    selectedCell = td;
    td.classList.add('cell-selected');
  }

  function enterEditMode(td) {
    if (!td || td.classList.contains('calc') || td.classList.contains('weekday')) {
      return;
    }

    const input = td.querySelector('input');
    if (!input) return;

    clearSelection();
    clearEditing();

    editingCell = td;
    td.classList.add('cell-editing');

    // Enable input interaction
    input.style.pointerEvents = 'auto';
    input.focus();

    // Select all text for easy editing
    if (input.value) {
      setTimeout(() => input.select(), 0);
    }
  }

  function exitEditMode(save = true) {
    if (!editingCell) return;

    const input = editingCell.querySelector('input');
    if (input && save) {
      input.blur();
    }

    editingCell.classList.remove('cell-editing');
    editingCell = null;
  }

  // === Navigation ===
  function getInputCells() {
    const tbody = document.querySelector('#tracker tbody');
    if (!tbody) return [];

    return Array.from(tbody.querySelectorAll('td')).filter(td =>
      td.querySelector('input') && !td.classList.contains('calc')
    );
  }

  function getAdjacentCell(td, direction) {
    const cells = getInputCells();
    const currentIndex = cells.indexOf(td);

    if (currentIndex === -1) return null;

    switch (direction) {
      case 'up':
        // Find cell in same column, previous row
        const currentCol = Array.from(td.parentElement.children).indexOf(td);
        let prevRow = td.parentElement.previousElementSibling;
        while (prevRow && !prevRow.dataset.day) {
          prevRow = prevRow.previousElementSibling;
        }
        return prevRow ? prevRow.children[currentCol] : null;

      case 'down':
        // Find cell in same column, next row
        const colIndex = Array.from(td.parentElement.children).indexOf(td);
        let nextRow = td.parentElement.nextElementSibling;
        while (nextRow && !nextRow.dataset.day) {
          nextRow = nextRow.nextElementSibling;
        }
        return nextRow ? nextRow.children[colIndex] : null;

      case 'left':
        return currentIndex > 0 ? cells[currentIndex - 1] : null;

      case 'right':
        return currentIndex < cells.length - 1 ? cells[currentIndex + 1] : null;

      case 'next':
        // Tab behavior: next cell, wrapping to next row
        return currentIndex < cells.length - 1 ? cells[currentIndex + 1] : null;

      case 'prev':
        // Shift+Tab: previous cell
        return currentIndex > 0 ? cells[currentIndex - 1] : null;

      default:
        return null;
    }
  }

  function navigateToCell(direction) {
    const current = editingCell || selectedCell;
    if (!current) return;

    const nextCell = getAdjacentCell(current, direction);
    if (nextCell) {
      selectCell(nextCell);
    }
  }

  // === Copy/Paste ===
  function copyCell() {
    const current = selectedCell || editingCell;
    if (!current) return;

    const input = current.querySelector('input');
    if (!input) return;

    copiedValue = input.dataset.key;
    const data = getCurrentMonthData();
    const value = data[copiedValue];

    if (value !== undefined) {
      clearCopyState();
      copiedCell = current;
      current.classList.add('cell-copying');

      if (window.Toast) {
        window.Toast.success('Wert kopiert');
      }
    }
  }

  function pasteCell() {
    const current = selectedCell || editingCell;
    if (!current || !copiedValue) return;

    const input = current.querySelector('input');
    if (!input) return;

    const data = getCurrentMonthData();
    const valueToCopy = data[copiedValue];

    if (valueToCopy === undefined) return;

    const targetKey = input.dataset.key;
    data[targetKey] = valueToCopy;

    // Save to storage
    const [y, mIdx] = getCurrentMonthParams();
    const activeFunnelId = FunnelAPI.getActiveFunnel();
    StorageAPI.saveMonthDataForFunnel(activeFunnelId, y, mIdx, data);

    // Update display
    const col = targetKey.split('_')[0];
    const isEuro = ['Adspend', 'Revenue', 'Cash'].includes(col);
    input.value = isEuro ? ClarityFormat.euro.format(valueToCopy) : ClarityFormat.int0.format(valueToCopy);

    // Trigger recalculation
    if (window.MonthView && window.MonthView.recalculate) {
      window.MonthView.recalculate();
    }

    if (window.Toast) {
      window.Toast.success('Wert eingefügt');
    }

    clearCopyState();
  }

  // === Helper: Get current month data ===
  function getCurrentMonthData() {
    const activeFunnelId = FunnelAPI.getActiveFunnel();
    const [y, mIdx] = getCurrentMonthParams();
    return StorageAPI.loadMonthDataForFunnel(activeFunnelId, y, mIdx);
  }

  function getCurrentMonthParams() {
    // Parse from first row's date
    const firstRow = document.querySelector('#tracker tbody tr[data-day]');
    if (!firstRow) return [2025, 0];

    const dateSpan = firstRow.querySelector('.date');
    if (!dateSpan) return [2025, 0];

    const dateText = dateSpan.textContent; // "01.12.25"
    const [d, m, y] = dateText.split('.');
    const fullYear = 2000 + parseInt(y);
    const monthIndex = parseInt(m) - 1;

    return [fullYear, monthIndex];
  }

  // === Keyboard Handling ===
  function setupKeyboardHandling() {
    document.addEventListener('keydown', (e) => {
      // If in edit mode, only handle Escape, Enter, Tab
      if (editingCell) {
        if (e.key === 'Escape') {
          e.preventDefault();
          exitEditMode(false);
          selectCell(editingCell);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          exitEditMode(true);
          navigateToCell('down');
        } else if (e.key === 'Tab') {
          e.preventDefault();
          exitEditMode(true);
          navigateToCell(e.shiftKey ? 'prev' : 'next');
        }
        return;
      }

      // If cell is selected (not editing)
      if (selectedCell) {
        // Arrow keys
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          navigateToCell('up');
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          navigateToCell('down');
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          navigateToCell('left');
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          navigateToCell('right');
        }
        // Enter: start editing
        else if (e.key === 'Enter') {
          e.preventDefault();
          enterEditMode(selectedCell);
        }
        // Tab: navigate
        else if (e.key === 'Tab') {
          e.preventDefault();
          navigateToCell(e.shiftKey ? 'prev' : 'next');
        }
        // Copy: Ctrl+C or Cmd+C
        else if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
          e.preventDefault();
          copyCell();
        }
        // Paste: Ctrl+V or Cmd+V
        else if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
          e.preventDefault();
          pasteCell();
        }
        // Start typing: enter edit mode and clear
        else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault();
          enterEditMode(selectedCell);
          const input = selectedCell.querySelector('input');
          if (input) {
            input.value = e.key;
          }
        }
      }
    });
  }

  // === Setup Cell Handlers ===
  function setupCell(td, input) {
    if (!td || !input) return;

    // Single click: select cell
    td.addEventListener('click', (e) => {
      // Don't select if already editing
      if (editingCell === td) return;

      e.preventDefault();
      e.stopPropagation();
      selectCell(td);
    });

    // Double click: enter edit mode
    td.addEventListener('dblclick', (e) => {
      e.preventDefault();
      e.stopPropagation();
      enterEditMode(td);
    });

    // Input blur: exit edit mode
    input.addEventListener('blur', (e) => {
      // Delay to allow click events to process
      setTimeout(() => {
        if (editingCell === td) {
          exitEditMode(true);
        }
      }, 100);
    });
  }

  // === Click outside: clear selection ===
  document.addEventListener('click', (e) => {
    const clickedCell = e.target.closest('td');

    if (!clickedCell || !clickedCell.querySelector('input')) {
      clearSelection();
      clearEditing();
    }
  });

  // === Public API ===
  window.CellSelection = {
    setupCell,
    setupKeyboardHandling,
    clearSelection,
    clearEditing,
    selectCell,
    enterEditMode
  };

  // Initialize keyboard handling on load
  setupKeyboardHandling();

})(window);
