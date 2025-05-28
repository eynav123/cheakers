const sounds = {
  dragStart: new Audio("js/Sounds/drag_start.wav"),
  release: new Audio("js/Sounds/release.wav"),
  wrongTurn: new Audio("js/Sounds/wrong_turn.wav"),
  invalidMove: new Audio("js/Sounds/invalid_move.wav"),
  capture: new Audio("js/Sounds/capture.wav"),
  promotion: new Audio("js/Sounds/promotion.wav"),
};

const tiles = document.querySelectorAll(".tile");
const pieces = document.querySelectorAll(".piece");
const lightPieces = document.querySelectorAll(".piece.light");
const darkPieces = document.querySelectorAll(".piece.dark");

let selectedPiece = null,
  turn = "dark",
  startX,
  startY,
  pieceColor,
  midTile,
  EatingIsAvailable = false;

document
  .getElementById("restart")
  .addEventListener("click", () => location.reload());

updateShadows();

pieces.forEach((piece) => {
  piece.draggable = true;
  piece.addEventListener("dragstart", dragStart);
});

tiles.forEach((tile) => {
  tile.addEventListener("dragover", (event) => event.preventDefault());
  tile.addEventListener("drop", drop);
});

function dragStart(event) {
  selectedPiece = event.target;
  pieceColor = selectedPiece.classList.contains("light") ? "light" : "dark";
  if (turn !== pieceColor) {
    sounds.wrongTurn.play();
    selectedPiece = null;
    return;
  }
  sounds.dragStart.play();
  const tile = selectedPiece.parentElement;
  startX = parseInt(tile.dataset.col) - 1;
  startY = parseInt(tile.dataset.row) - 1;
  GlowingTiles();
}

function drop(event) {
  if (selectedPiece) {
    EatingIsAvailable = false;
    let targetTile = event.target.closest(".tile");
    let targetX = parseInt(targetTile.dataset.col) - 1;
    let targetY = parseInt(targetTile.dataset.row) - 1;

    if (isValidMove(targetTile, targetX, targetY)) {
      targetTile.appendChild(selectedPiece);
      if (
        (pieceColor === "light" && targetY === 7) ||
        (pieceColor === "dark" && targetY === 0)
      ) {
        sounds.promotion.play();
        selectedPiece.classList.add("king");
      } else sounds.release.play();
      if (EatingIsAvailable) eating();
      switchTurn();
    } else {
      sounds.invalidMove.play();
      selectedPiece = pieceColor = null;
    }
    removeGlowing();
  }
}
function updateShadows() {
  const addShadow = turn === "light" ? lightPieces : darkPieces;
  const removeShadow = turn === "dark" ? lightPieces : darkPieces;
  addShadow.forEach((piece) => piece.classList.add("shadow"));
  removeShadow.forEach((piece) => piece.classList.remove("shadow"));
}
function isValidMove(tile, targetX, targetY) {
  const targetColor = tile.classList.contains("dark") ? "dark" : "light";
  if (turn !== pieceColor || targetColor !== "dark") return false;
  if (selectedPiece.classList.contains("king")) {
    return king_check(tile, targetX, targetY);
  } else {
    if (regular_check(tile, targetX, targetY)) return true;
    else if (eating_check(tile, targetX, targetY)) {
      EatingIsAvailable = true;
      return true;
    }
  }
  return false;
}

function GlowingTiles() {
  tiles.forEach((tile) => {
    const gridX = parseInt(tile.dataset.col) - 1;
    const gridY = parseInt(tile.dataset.row) - 1;

    if (isValidMove(tile, gridX, gridY)) {
      tile.classList.add("highlighted");
    }
  });
}
function removeGlowing() {
  tiles.forEach((tile) => {
    tile.classList.remove("highlighted");
  });
}
function regular_check(tile, targetX, targetY) {
  if (Math.abs(targetX - startX) === 1) {
    if (tile.childElementCount === 0) {
      if (pieceColor === "light" && targetY - startY === 1) {
        return true;
      } else if (pieceColor === "dark" && targetY - startY === -1) return true;
    }
  }
  return false;
}
function eating_check(tile, targetX, targetY) {
  if (Math.abs(targetX - startX) === 2) {
    if (tile.childElementCount === 0) {
      let midX = (startX + targetX) / 2 + 1;
      let midY = (startY + targetY) / 2 + 1;
      midTile = document.querySelector(
        `[data-row="${midY}"][data-col="${midX}"]`
      );
      if (
        midTile &&
        midTile.childElementCount > 0 &&
        midTile.firstElementChild.classList.contains(
          pieceColor === "light" ? "dark" : "light"
        )
      ) {
        if (pieceColor === "light" && targetY - startY === 2) return true;
        if (pieceColor === "dark" && targetY - startY === -2) return true;
      }
    }
  }
  return false;
}

function king_check(tile, targetX, targetY) {
  if (Math.abs(targetX - startX) !== Math.abs(targetY - startY)) return false;
  if (tile.childElementCount !== 0) return false;

  const dx = targetX > startX ? 1 : -1;
  const dy = targetY > startY ? 1 : -1;

  let x = startX + dx;
  let y = startY + dy;
  let enemyCount = 0;

  while (x !== targetX && y !== targetY) {
    const mid = document.querySelector(
      `[data-row="${y + 1}"][data-col="${x + 1}"]`
    );
    if (mid.childElementCount > 0) {
      const child = mid.firstElementChild;
      if (child.classList.contains(pieceColor)) return false;
      if (child.classList.contains(pieceColor === "light" ? "dark" : "light")) {
        enemyCount++;
        if (enemyCount > 1) return false;
        midTile = mid;
      } else return false;
    }
    x += dx;
    y += dy;
  }

  if (enemyCount === 1) {
    EatingIsAvailable = true;
  }
  return true;
}

function eating() {
  const midPiece = midTile.firstElementChild;
  sounds.capture.play();
  midPiece.remove();
  EatingIsAvailable = false;
}

function switchTurn() {
  turn = turn === "light" ? "dark" : "light";
  updateShadows();
}
