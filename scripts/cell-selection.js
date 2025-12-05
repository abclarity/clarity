// scripts/cell-selection.js
// Google Sheets-style Cell Selection & Editing with Multi-Selection

(function(window) {
  'use strict';

  // === State Management (Multi-Selection) ===
  let selectedCells = new Set();
  let lastSelectedCell = null;
  let editingCell = null;
  let copiedCells = new Map();
  let isExitingEditMode = false;

  // Drag State
  let dragState = {
    isMouseDown: false,
    isDragging: false,
    startCell: null,
    boundary: null
  };

  // === Boundary Detection ===
  function getCellBoundary(cell) {
    if (!cell) return null;

    if (cell.closest('thead')) return 'header';
    if (cell.closest('tbody')) return 'body';

    const tr = cell.closest('tr');
    if (!tr) return null;

    if (tr.id === 'summary-row' || tr.id === 'year-summary' || tr.id === 'summary-head' || tr.id === 'year-head') return 'total';
    if (tr.dataset.week) return 'weekly';
    if (tr.dataset.quarter) return 'quarterly';
    if (tr.id === 'weekly-header') return 'weekly';

    const tfoot = cell.closest('tfoot');
    if (tfoot) {
      if (tr.dataset.week) return 'weekly';
      return 'total';
    }

    return 'other';
  }

  function canSelectTogether(cell1, cell2) {
    const b1 = getCellBoundary(cell1);
    const b2 = getCellBoundary(cell2);

    if (!b1 || !b2) return false;

    // Body und Total können zusammen selektiert werden
    if ((b1 === 'body' || b1 === 'total') && (b2 === 'body' || b2 === 'total')) {
      return true;
    }

    return b1 === b2;
  }

  // === State Management Functions ===
  function clearAllSelections() {
    selectedCells.forEach(cell => {
      cell.classList.remove('cell-selected');
    });
    selectedCells.clear();
  }

  function clearEditing() {
    if (editingCell) {
      editingCell.classList.remove('cell-editing');
      const input = editingCell.querySelector('input');
      if (input) {
        input.blur();
        input.style.pointerEvents = 'none';
      }
      editingCell = null;
    }
  }

  function clearCopyState() {
    copiedCells.forEach((data, cell) => {
      cell.classList.remove('cell-copying');
    });
    copiedCells.clear();
  }

  // === Selection Functions ===
  function isSelectableCell(td) {
    if (!td || !td.tagName) return false;
    if (td.tagName !== 'TD' && td.tagName !== 'TH') return false;
    if (td.colSpan > 1 && td.rowSpan > 1) return false;
    return true;
  }

  function selectCell(td, addToSelection = false) {
    if (!isSelectableCell(td)) return;

    if (!addToSelection) {
      clearAllSelections();
    }

    selectedCells.add(td);
    td.classList.add('cell-selected');
    lastSelectedCell = td;
  }

  function deselectCell(td) {
    td.classList.remove('cell-selected');
    selectedCells.delete(td);
  }

  function toggleCell(td) {
    if (selectedCells.has(td)) {
      deselectCell(td);
    } else {
      selectCell(td, true);
    }
    lastSelectedCell = td;
  }

  function selectRange(startCell, endCell) {
    if (!startCell || !endCell) return;
    if (!canSelectTogether(startCell, endCell)) return;

    const allCells = getAllSelectableCells();
    const startIdx = allCells.indexOf(startCell);
    const endIdx = allCells.indexOf(endCell);

    if (startIdx === -1 || endIdx === -1) return;

    const minIdx = Math.min(startIdx, endIdx);
    const maxIdx = Math.max(startIdx, endIdx);

    clearAllSelections();

    for (let i = minIdx; i <= maxIdx; i++) {
      const cell = allCells[i];
      if (canSelectTogether(startCell, cell)) {
        selectCell(cell, true);
      }
    }
  }

  function enterEditMode(td) {
    if (!td || isExitingEditMode) return;

    const input = td.querySelector('input');
    if (!input) return;

    clearAllSelections();
    clearEditing();

    editingCell = td;
    td.classList.add('cell-editing');

    input.style.pointerEvents = 'auto';
    input.focus();

    if (input.value) {
      setTimeout(() => input.select(), 0);
    }
  }

  function exitEditMode(save = true) {
    if (!editingCell) return;

    isExitingEditMode = true;

    const td = editingCell;
    const input = td.querySelector('input');

    if (input && save) {
      input.blur();
    }

    td.classList.remove('cell-editing');
    if (input) {
      input.style.pointerEvents = 'none';
    }

    editingCell = null;

    setTimeout(() => {
      isExitingEditMode = false;
      selectCell(td);
    }, 100);
  }

  // === Get All Selectable Cells ===
  function getAllSelectableCells() {
    const tables = document.querySelectorAll('table');
    const cells = [];

    tables.forEach(table => {
      const allTds = table.querySelectorAll('td');
      allTds.forEach(td => {
        if (isSelectableCell(td)) {
          cells.push(td);
        }
      });
    });

    return cells;
  }

  // === Navigation ===
  function getAdjacentCell(td, direction) {
    const cells = getAllSelectableCells();
    const currentIndex = cells.indexOf(td);

    if (currentIndex === -1) return null;

    switch (direction) {
      case 'up':
        const currentCol = Array.from(td.parentElement.children).indexOf(td);
        let prevRow = td.parentElement.previousElementSibling;
        while (prevRow) {
          const targetCell = prevRow.children[currentCol];
          if (targetCell && isSelectableCell(targetCell)) {
            return targetCell;
          }
          prevRow = prevRow.previousElementSibling;
        }
        return null;

      case 'down':
        const colIndex = Array.from(td.parentElement.children).indexOf(td);
        let nextRow = td.parentElement.nextElementSibling;
        while (nextRow) {
          const targetCell = nextRow.children[colIndex];
          if (targetCell && isSelectableCell(targetCell)) {
            return targetCell;
          }
          nextRow = nextRow.nextElementSibling;
        }
        return null;

      case 'left':
        return currentIndex > 0 ? cells[currentIndex - 1] : null;

      case 'right':
        return currentIndex < cells.length - 1 ? cells[currentIndex + 1] : null;

      case 'next':
        return currentIndex < cells.length - 1 ? cells[currentIndex + 1] : null;

      case 'prev':
        return currentIndex > 0 ? cells[currentIndex - 1] : null;

      default:
        return null;
    }
  }

  function navigateToCell(direction) {
    const current = editingCell || lastSelectedCell;
    if (!current) return;

    const nextCell = getAdjacentCell(current, direction);
    if (nextCell) {
      selectCell(nextCell);
    }
  }

  // === Copy/Paste (Multi-Selection) ===
  function copyCell() {
    if (selectedCells.size === 0) return;

    clearCopyState();

    selectedCells.forEach(cell => {
      const input = cell.querySelector('input');
      if (!input) return;

      const key = input.dataset.key;
      const data = getCurrentMonthData();
      const value = data[key];

      if (value !== undefined) {
        copiedCells.set(cell, { key, value });
        cell.classList.add('cell-copying');
      }
    });
  }

  function pasteCell() {
    if (copiedCells.size === 0 || selectedCells.size === 0) return;

    const copiedArray = Array.from(copiedCells.entries());
    const selectedArray = Array.from(selectedCells);

    if (copiedArray.length === 1) {
      const [, copiedData] = copiedArray[0];

      selectedArray.forEach(targetCell => {
        const input = targetCell.querySelector('input');
        if (!input) return;

        pasteValueToCell(input, copiedData.value);
      });
    } else if (selectedArray.length === 1) {
      const startCell = selectedArray[0];
      const allCells = getAllSelectableCells();
      const startIdx = allCells.indexOf(startCell);

      copiedArray.forEach(([, copiedData], idx) => {
        const targetCell = allCells[startIdx + idx];
        if (!targetCell) return;

        const input = targetCell.querySelector('input');
        if (!input) return;

        pasteValueToCell(input, copiedData.value);
      });
    } else if (copiedArray.length === selectedArray.length) {
      copiedArray.forEach(([, copiedData], idx) => {
        const targetCell = selectedArray[idx];
        if (!targetCell) return;

        const input = targetCell.querySelector('input');
        if (!input) return;

        pasteValueToCell(input, copiedData.value);
      });
    }

    clearCopyState();
    recalculateAll();
  }

  function pasteValueToCell(input, value) {
    const targetKey = input.dataset.key;
    const data = getCurrentMonthData();
    data[targetKey] = value;

    const [y, mIdx] = getCurrentMonthParams();
    const activeFunnelId = FunnelAPI.getActiveFunnel();
    StorageAPI.saveMonthDataForFunnel(activeFunnelId, y, mIdx, data);

    const col = targetKey.split('_')[0];
    const isEuro = ['Adspend', 'Revenue', 'Cash'].includes(col);
    input.value = isEuro ? ClarityFormat.euro.format(value) : ClarityFormat.int0.format(value);
  }

  function recalculateAll() {
    if (window.MonthView && window.MonthView.recalculate) {
      window.MonthView.recalculate();
    }
  }

  // === Helper: Get current month data ===
  function getCurrentMonthData() {
    const activeFunnelId = FunnelAPI.getActiveFunnel();
    const [y, mIdx] = getCurrentMonthParams();
    return StorageAPI.loadMonthDataForFunnel(activeFunnelId, y, mIdx);
  }

  function getCurrentMonthParams() {
    const firstRow = document.querySelector('#tracker tbody tr[data-day]');
    if (!firstRow) return [2025, 0];

    const dateSpan = firstRow.querySelector('.date');
    if (!dateSpan) return [2025, 0];

    const dateText = dateSpan.textContent;
    const [d, m, y] = dateText.split('.');
    const fullYear = 2000 + parseInt(y);
    const monthIndex = parseInt(m) - 1;

    return [fullYear, monthIndex];
  }

  // === Drag Selection ===
  function handleMouseDown(e) {
    const td = e.target.closest('td');
    if (!isSelectableCell(td)) return;

    if (editingCell) return;

    const isCmd = e.metaKey || e.ctrlKey;
    const isShift = e.shiftKey;

    if (isShift && lastSelectedCell) {
      e.preventDefault();
      selectRange(lastSelectedCell, td);
      return;
    }

    if (isCmd) {
      e.preventDefault();
      toggleCell(td);
    } else {
      e.preventDefault();
      selectCell(td);
    }

    dragState.isMouseDown = true;
    dragState.startCell = td;
    dragState.boundary = getCellBoundary(td);
  }

  function handleMouseMove(e) {
    if (!dragState.isMouseDown || editingCell) return;

    dragState.isDragging = true;

    const td = e.target.closest('td');
    if (!isSelectableCell(td)) return;

    const boundary = getCellBoundary(td);
    if (boundary !== dragState.boundary) return;

    if (!canSelectTogether(dragState.startCell, td)) return;

    const allCells = getAllSelectableCells();
    const startIdx = allCells.indexOf(dragState.startCell);
    const currentIdx = allCells.indexOf(td);

    if (startIdx === -1 || currentIdx === -1) return;

    const minIdx = Math.min(startIdx, currentIdx);
    const maxIdx = Math.max(startIdx, currentIdx);

    clearAllSelections();

    for (let i = minIdx; i <= maxIdx; i++) {
      const cell = allCells[i];
      if (getCellBoundary(cell) === dragState.boundary) {
        selectCell(cell, true);
      }
    }
  }

  function handleMouseUp(e) {
    dragState.isMouseDown = false;
    dragState.isDragging = false;
    dragState.startCell = null;
    dragState.boundary = null;
  }

  // === Keyboard Handling ===
  function setupKeyboardHandling() {
    document.addEventListener('keydown', (e) => {
      if (editingCell) {
        if (e.key === 'Escape') {
          e.preventDefault();
          exitEditMode(false);
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

      if (lastSelectedCell) {
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
        } else if (e.key === 'Enter') {
          e.preventDefault();
          enterEditMode(lastSelectedCell);
        } else if (e.key === 'Tab') {
          e.preventDefault();
          navigateToCell(e.shiftKey ? 'prev' : 'next');
        } else if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
          e.preventDefault();
          copyCell();
        } else if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
          e.preventDefault();
          pasteCell();
        } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          const input = lastSelectedCell.querySelector('input');
          if (input) {
            e.preventDefault();
            enterEditMode(lastSelectedCell);
            input.value = e.key;
          }
        }
      }
    });
  }

  // === Setup Cell Handlers ===
  function setupCell(td, input) {
    if (!td) return;

    td.addEventListener('click', (e) => {
      if (editingCell === td || isExitingEditMode) return;

      e.preventDefault();
      e.stopPropagation();

      const isCmd = e.metaKey || e.ctrlKey;
      const isShift = e.shiftKey;

      if (isShift && lastSelectedCell) {
        selectRange(lastSelectedCell, td);
      } else if (isCmd) {
        toggleCell(td);
      } else {
        selectCell(td);
      }
    });

    if (input) {
      td.addEventListener('dblclick', (e) => {
        e.preventDefault();
        e.stopPropagation();
        enterEditMode(td);
      });

      input.addEventListener('blur', (e) => {
        setTimeout(() => {
          if (editingCell === td && !isExitingEditMode) {
            exitEditMode(true);
          }
        }, 100);
      });
    }
  }

  // === Global Mouse Handlers ===
  document.addEventListener('mousedown', handleMouseDown);
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);

  document.addEventListener('click', (e) => {
    const clickedCell = e.target.closest('td');

    if (!clickedCell && !editingCell) {
      clearAllSelections();
    }
  });

  // === Public API ===
  window.CellSelection = {
    setupCell,
    setupKeyboardHandling,
    clearAllSelections,
    clearEditing,
    selectCell,
    enterEditMode,
    isSelectableCell,
    getAllSelectableCells
  };

  setupKeyboardHandling();

})(window);
