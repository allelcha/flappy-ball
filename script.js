const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const startScreen = document.getElementById("startScreen");
const gameOverScreen = document.getElementById("gameOverScreen");
const shopScreen = document.getElementById("shopScreen");
const finalScoreDisplay = document.getElementById("finalScore");
const bestScoreDisplay = document.getElementById("bestScore");
const earnedCoinsDisplay = document.getElementById("earnedCoins");
const coinsCount = document.getElementById("coinsCount");
const characterSelect = document.getElementById("characterSelect");
const shopCharacters = document.getElementById("shopCharacters");

let gameStarted = false;
let score = 0;
let bestScore = localStorage.getItem("bestScore") || 0;
let coins = parseInt(localStorage.getItem("coins") || "0");
let earnedCoins = 0;
let frame = 0;
let pipeSpeed = 2;
let selectedCharacter = localStorage.getItem("selectedCharacter") || "ball";
let difficulty = "medium";

const characters = [
  { id: "ball", name: "🏐", img: "https://png.pngtree.com/png-clipart/20230414/original/pngtree-volleyball-clipart-png-image_9054135.png", cost: 0 },
  { id: "fireball", name: "🔥", img: "https://cdn-icons-png.flaticon.com/512/1085/1085471.png", cost: 15 },
  { id: "star", name: "⭐", img: "https://cdn-icons-png.flaticon.com/512/616/616490.png", cost: 25 }
];

let unlockedCharacters = JSON.parse(localStorage.getItem("unlockedCharacters") || '["ball"]');

let bird = {
  x: 60,
  y: 150,
  width: 40,
  height: 40,
  gravity: 1.5,
  velocity: 0,
  jump: -15,
  draw: function () {
    let char = characters.find(c => c.id === selectedCharacter);
    let img = new Image();
    img.src = char.img;
    ctx.drawImage(img, this.x, this.y, this.width, this.height);
  },
  update: function () {
    this.velocity += this.gravity;
    this.y += this.velocity;
    if (this.y + this.height > canvas.height) endGame();
    this.draw();
  },
  flap: function () {
    this.velocity = this.jump;
  }
};

let pipes = [];

function createPipe() {
  let topHeight = Math.floor(Math.random() * 200) + 50;
  pipes.push({ x: canvas.width, topHeight });
}

function updatePipes() {
  for (let p of pipes) {
    p.x -= pipeSpeed;
    ctx.fillStyle = "green";
    ctx.fillRect(p.x, 0, 50, p.topHeight);
    ctx.fillRect(p.x, p.topHeight + 120, 50, canvas.height - p.topHeight - 120);

    if (
      bird.x < p.x + 50 &&
      bird.x + bird.width > p.x &&
      (
        bird.y < p.topHeight ||
        bird.y + bird.height > p.topHeight + 120
      )
    ) {
      endGame();
    }

    if (p.x + 50 === bird.x) {
      score++;
      if (score % 5 === 0) pipeSpeed += 0.3;
      if (score % 3 === 0) earnedCoins++;
    }
  }
  pipes = pipes.filter(p => p.x + 50 > 0);
}

function drawScore() {
  ctx.fillStyle = "black";
  ctx.font = "20px Arial";
  ctx.fillText("النقاط: " + score, 10, 30);
  ctx.fillText("🪙: " + (coins + earnedCoins), 10, 55);
}

function gameLoop() {
  if (!gameStarted) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  bird.update();

  if (frame % 90 === 0) createPipe();
  updatePipes();
  drawScore();

  frame++;
  requestAnimationFrame(gameLoop);
}

function startGame() {
  const playerName = document.getElementById("playerName").value.trim();
  if (!playerName) return alert("من فضلك أدخل اسمك!");

  difficulty = document.getElementById("difficulty").value;
  if (difficulty === "easy") {
    bird.gravity = 1.2; pipeSpeed = 1.5;
  } else if (difficulty === "medium") {
    bird.gravity = 1.5; pipeSpeed = 2;
  } else {
    bird.gravity = 1.8; pipeSpeed = 2.5;
  }

  score = 0;
  earnedCoins = 0;
  pipes = [];
  frame = 0;
  bird.y = 150;
  bird.velocity = 0;
  gameStarted = true;
  startScreen.style.display = "none";
  gameOverScreen.style.display = "none";
  requestAnimationFrame(gameLoop);
}

function endGame() {
  gameStarted = false;
  finalScoreDisplay.innerText = score;
  bestScore = Math.max(score, bestScore);
  localStorage.setItem("bestScore", bestScore);
  bestScoreDisplay.innerText = bestScore;
  coins += earnedCoins;
  localStorage.setItem("coins", coins);
  earnedCoinsDisplay.innerText = earnedCoins;
  gameOverScreen.style.display = "block";
  updateUI();
}

function restartGame() {
  startScreen.style.display = "block";
  gameOverScreen.style.display = "none";
}

function updateUI() {
  coinsCount.innerText = coins;
  characterSelect.innerHTML = "";
  characters.forEach(char => {
    if (unlockedCharacters.includes(char.id)) {
      let option = document.createElement("option");
      option.value = char.id;
      option.innerText = char.name;
      if (char.id === selectedCharacter) option.selected = true;
      characterSelect.appendChild(option);
    }
  });
  localStorage.setItem("selectedCharacter", characterSelect.value);
}

function openShop() {
  shopCharacters.innerHTML = "";
  characters.forEach(char => {
    const div = document.createElement("div");
    div.classList.add("shop-item");

    if (unlockedCharacters.includes(char.id)) {
      div.classList.add("unlocked");
      div.onclick = () => {
        selectedCharacter = char.id;
        localStorage.setItem("selectedCharacter", char.id);
        updateUI();
        alert("تم اختيار الشخصية ✅");
      };
    } else {
      div.classList.add("locked");
      div.onclick = () => {
        if (coins >= char.cost) {
          if (confirm(`هل تريد شراء ${char.name} بـ${char.cost} 🪙؟`)) {
            coins -= char.cost;
            unlockedCharacters.push(char.id);
            localStorage.setItem("unlockedCharacters", JSON.stringify(unlockedCharacters));
            localStorage.setItem("coins", coins);
            updateUI();
            openShop();
            alert("تم فتح الشخصية ✅");
          }
        } else {
          alert("لا تملك عملات كافية!");
        }
      };
    }

    const img = document.createElement("img");
    img.src = char.img;
    div.appendChild(img);
    shopCharacters.appendChild(div);
  });

  shopScreen.style.display = "block";
  startScreen.style.display = "none";
}

function closeShop() {
  shopScreen.style.display = "none";
  startScreen.style.display = "block";
}

document.addEventListener("keydown", e => {
  if (e.code === "Space") bird.flap();
});
document.addEventListener("touchstart", () => {
  if (gameStarted) bird.flap();
});

window.onload = () => {
  updateUI();
  startScreen.style.display = "block";
};
