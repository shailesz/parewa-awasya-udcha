// general idea is pipes show up in a grid
// grids are contained of 2 pipes
// first, bottom pipe, is generated between a minimum width which was precalculated
// second, top pipe, is generated with a minimum gap added to the bottom pipe
// each pipes handle their own movement
// bird checks for collision with individual pipes

var SCREEN_WIDTH = 500;
var SCREEN_HEIGHT = 700;
var GROUND_POSITON = 550;
var GROUND_HEIGHT = 150;
var BIRD_WIDTH = 50;
var BIRD_HEIGHT = 50;
var BIRD_POSITION_X = 200;
var BIRD_POSITION_Y = 350;
var PIPE_GAP = 125;

class Vector {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  // vector operations below

  generateRandomVector(minX, maxX, minY, maxY) {
    return new Vector(
      generateRandomFrom(minX, maxX),
      generateRandomFrom(minY, maxY)
    );
  }

  static addVectors(vector1, vector2) {
    return new Vector(vector1.x + vector2.x, vector1.y + vector2.y);
  }

  static multiplyVectorWithScalar(vector, scalar) {
    return new Vector(vector.x * scalar, vector.y * scalar);
  }

  static subtractVectors(vector1, vector2) {
    return new Vector(vector1.x - vector2.x, vector1.y - vector2.y);
  }

  static divideVectorWithScalar(vector, scalar) {
    return new Vector(vector.x / scalar, vector.y / scalar);
  }
}

class Bird {
  constructor() {
    this.height = BIRD_HEIGHT;
    this.width = BIRD_WIDTH;
    this.position = new Vector(BIRD_POSITION_X, BIRD_POSITION_Y);
    this.gAcceleration = new Vector(0, 0.1);
    this.initialVelocity = new Vector(0, 0.098);
    this.velocity = this.initialVelocity;
    this.terminalVelocity = new Vector(0, 6.5);
    this.jumpVector = new Vector(0, 75);
    this.isFlying = false;
    this.groundVector = new Vector(200, GROUND_POSITON);
    this.score = 0;
    this.hasCrashed = false;
  }

  fly() {
    this.isFlying = true;
    this.position = Vector.subtractVectors(this.position, this.jumpVector);
    this.velocity = this.initialVelocity;
  }

  handleGround() {
    if (this.position.y >= this.groundVector.y) {
      this.position = this.groundVector;
      this.handleCollision();
    }
  }

  handleCollision(pipe = null) {
    if (pipe) {
      if (
        this.position.x < pipe.position.x + pipe.width &&
        this.position.x + this.width > pipe.position.x &&
        this.position.y < pipe.position.y + pipe.height &&
        this.position.y + this.height > pipe.position.y
      ) {
        if (!this.hasCrashed) {
          this.hasCrashed = true;
          this.handleHighScore();
        }
      }
    } else {
      this.hasCrashed = true;
      this.handleHighScore();
    }
  }

  handleScore(pipe) {
    if (
      pipe.position.x <= this.position.x - pipe.width &&
      !pipe.hasCrossedBird
    ) {
      pipe.hasCrossedBird = true;
      this.score += 0.5;
    }
  }

  handleHighScore() {
    var highScore = localStorage.getItem("highScore");
    if (highScore == null) {
      highScore = 0;
      localStorage.setItem("highScore", highScore);
    }
    if (this.score > highScore) {
      localStorage.setItem("highScore", this.score);
    }
  }

  update() {
    // move the bird
    this.position = Vector.addVectors(this.position, this.velocity);

    // handle ground
    this.handleGround();

    // handle acceleration
    if (this.velocity !== this.terminalVelocity) {
      if (this.velocity.y <= this.terminalVelocity.y) {
        this.velocity = Vector.addVectors(this.velocity, this.gAcceleration);
      } else {
        this.velocity = this.terminalVelocity;
      }
    }
  }
}

class Pipe {
  constructor(x, y, height) {
    this.position = new Vector(x, y);
    this.width = 100;
    this.height = height - this.position.y;
    this.velocity = new Vector(1.5, 0);
    this.hasCrossedBird = false;
  }

  handleCollision() {}

  update() {
    this.position = Vector.subtractVectors(this.position, this.velocity);
  }
}

class PipeGrid {
  constructor(x) {
    this.gap = PIPE_GAP;
    this.hasCrossedBird = false;

    this.pipeBottom = new Pipe(
      x,
      generateRandomFrom(260, 550),
      SCREEN_HEIGHT - 100
    );

    this.pipeTop = new Pipe(
      x,
      0,
      SCREEN_HEIGHT - GROUND_HEIGHT - this.pipeBottom.height - this.gap
    );
    this.pipes = [this.pipeBottom, this.pipeTop];
  }

  isPipeGridGone() {
    // reposition
    if (this.pipes[0].position.x <= -100) {
      this.pipes[0] = new Pipe(
        1100,
        generateRandomFrom(260, 550),
        SCREEN_HEIGHT - 100
      );
      
      this.pipes[1] = new Pipe(
        1100,
        0,
        SCREEN_HEIGHT - GROUND_HEIGHT - this.pipes[0].height - this.gap
      );
      this.hasCrossedBird = false;
    }
  }

  update() {
    for (const pipe of this.pipes) {
      pipe.update();
    }
    this.isPipeGridGone();
  }
}

class Canvas {
  constructor() {
    this.canvas = document.createElement("canvas");
    this.canvas.width = 500;
    this.canvas.height = 700;

    this.ctx = this.canvas.getContext("2d");

    document.body.appendChild(this.canvas);

    this.birdDownImg = new Image();
    this.birdMidImg = new Image();
    this.birdUpImg = new Image();
    this.pipeImg = new Image();
    this.backgroundImg = new Image();
    this.groundImg = new Image();
    this.gameOverImg = new Image();

    this.birdDownImg.src = "./images/bird-down.png";
    this.birdMidImg.src = "./images/bird-mid.png";
    this.birdUpImg.src = "./images/bird-up.png";
    this.pipeImg.src = "./images/pipe.png";
    this.backgroundImg.src = "./images/background.png";
    this.groundImg.src = "./images/ground.png";
    this.gameOverImg.src = "./images/gameover.png";

    this.startGame = (event) => {
      if (event.key === " ") {
        window.removeEventListener("keydown", this.startGame);
        this.setup();
      }
    };

    this.paintStartScreen();
  }

  paintPipes() {
    this.ctx.fillStyle = "green";
    for (let i = 0; i < this.pipeGridList.length; i++) {
      for (let j = 0; j < this.pipeGridList[i].pipes.length; j++) {
        if (j === 1) {
          this.ctx.save();
          this.ctx.translate(
            this.pipeGridList[i].pipes[j].position.x,
            this.pipeGridList[i].pipes[j].position.y
          );
          this.ctx.rotate(180 * (Math.PI / 180));
          this.ctx.drawImage(
            this.pipeImg,
            -this.pipeGridList[i].pipes[j].width,
            -this.pipeGridList[i].pipes[j].height,
            this.pipeGridList[i].pipes[j].width,
            this.pipeGridList[i].pipes[j].height
          );
          this.ctx.restore();
        } else {
          this.ctx.drawImage(
            this.pipeImg,
            this.pipeGridList[i].pipes[j].position.x,
            this.pipeGridList[i].pipes[j].position.y,
            this.pipeGridList[i].pipes[j].width,
            this.pipeGridList[i].pipes[j].height
          );
        }
      }
    }

    // update pipes in grids
    for (const pipeGrid of this.pipeGridList) {
      pipeGrid.update();
    }

    // fill allPipes
    this.allPipes = [];
    for (var pipeGrid of this.pipeGridList) {
      for (var pipe of pipeGrid.pipes) {
        this.allPipes.push(pipe);
      }
    }
  }

  paintBird() {
    if (this.birdUpdate % 3 === 0) {
      this.birdUpdate = 0;
      if (this.currentStage === 2) {
        this.currentStage = 0;
      } else {
        this.currentStage += 1;
      }
    }
    this.ctx.drawImage(
      this.birdStages[this.currentStage],
      this.bird.position.x,
      this.bird.position.y,
      BIRD_WIDTH,
      BIRD_HEIGHT
    );
    this.birdUpdate += 1;
    this.bird.update();
  }

  paintSky() {
    this.ctx.drawImage(
      this.backgroundImg,
      0,
      0,
      SCREEN_WIDTH,
      GROUND_POSITON + 75
    );
  }

  paintGround() {
    this.ctx.drawImage(
      this.groundImg,
      this.groundGrid.firstPosition,
      GROUND_POSITON + BIRD_HEIGHT - 3.9,
      SCREEN_WIDTH + 50,
      this.groundImg.height
    );
    this.ctx.drawImage(
      this.groundImg,
      this.groundGrid.secondPosition,
      GROUND_POSITON + BIRD_HEIGHT - 3.9,
      SCREEN_WIDTH + 50,
      this.groundImg.height
    );
    this.groundGrid.firstPosition -= 1.5;
    this.groundGrid.secondPosition -= 1.5;

    if (this.groundGrid.firstPosition <= -500) {
      this.groundGrid.firstPosition = 500;
    }
    if (this.groundGrid.secondPosition <= -500) {
      this.groundGrid.secondPosition = 500;
    }
  }

  paintStartScreen() {
    this.backgroundImg.onload = () => {
      this.ctx.drawImage(
        this.backgroundImg,
        0,
        0,
        SCREEN_WIDTH,
        GROUND_POSITON + 75
      );
      this.ctx.drawImage(
        this.birdMidImg,
        BIRD_POSITION_X,
        BIRD_POSITION_Y,
        BIRD_WIDTH,
        BIRD_HEIGHT
      );
      this.ctx.fillStyle = "white";
      this.ctx.font = "48px sans-serif";
      this.ctx.fillText("Flappy Bird", 125, 300);
      this.ctx.fillText("Press Space to Start", 25, 350);
    };

    this.groundImg.onload = () => {
      this.ctx.drawImage(this.groundImg, 0, GROUND_POSITON + BIRD_HEIGHT - 3.9);
    };

    // this.ctx.fillStyle = "black";
    // this.ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    window.addEventListener("keydown", this.startGame);
  }

  paintGameOver() {
    this.ctx.drawImage(this.gameOverImg, 150, 100);
    this.ctx.fillStyle = "white";
    this.ctx.fillText("Score", 190, 200);
    this.ctx.fillText(this.bird.score, 225, 250);
    this.ctx.fillText("Highscore", 150, 300);
    this.ctx.fillText(localStorage.getItem("highScore"), 225, 350);
    this.ctx.fillText("Space to restart", 100, 400);

    window.addEventListener("keydown", this.restartKeyListener);
  }

  paintScore() {
    this.ctx.fillStyle = "white";
    this.ctx.fillText(this.bird.score, 225, 250);
  }

  setup() {
    this.flyKeyListener = (event) => {
      if (event.key === " ") {
        this.bird.fly();
      }
    };

    this.restartKeyListener = (event) => {
      if (event.key === " ") {
        window.removeEventListener("keydown", this.restartKeyListener);
        this.setup();
      }
    };

    this.bird = new Bird();

    window.addEventListener("keydown", this.flyKeyListener);

    // pipes handler
    this.pipeGridList = [];
    this.allPipes = [];

    // ground handler
    this.groundGrid = {
      firstPosition: 0,
      secondPosition: 500,
    };

    // bird flap handler
    this.birdStages = [this.birdDownImg, this.birdMidImg, this.birdUpImg];
    this.birdUpdate = 0;
    this.currentStage = 0;

    // fill pipeGridList
    for (let i = 0; i < 4; i++) {
      this.pipeGridList.push(new PipeGrid(800 + i * 300));
    }

    // paint functions
    this.paintBird();
    this.paintPipes();

    // update call
    requestAnimationFrame(() => this.update());
  }

  update() {
    this.ctx.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    // sky paint
    this.paintSky();

    // ground paint
    this.paintGround();

    // pipe paint
    this.paintPipes();

    // bird paint
    this.paintBird();

    // paint score
    this.paintScore();

    //check for collision
    for (const pipe of this.allPipes) {
      this.bird.handleCollision(pipe);
      this.bird.handleScore(pipe);
    }

    if (!this.bird.hasCrashed) {
      requestAnimationFrame(() => this.update());
    } else {
      window.removeEventListener("keydown", this.flyKeyListener);
      this.paintGameOver();
    }
  }
}

// lord random number here
function generateRandomFrom(min, max) {
  return min + Math.random() * (max - min);
}

new Canvas();
