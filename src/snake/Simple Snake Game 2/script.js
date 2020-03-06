
"use strict";

CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  this.beginPath();
  this.moveTo(x+r, y);
  this.arcTo(x+w, y,   x+w, y+h, r);
  this.arcTo(x+w, y+h, x,   y+h, r);
  this.arcTo(x,   y+h, x,   y,   r);
  this.arcTo(x,   y,   x+w, y,   r);
  this.closePath();
  return this;
}


var Game = {
  canvas: null,
	ctx: null,
	keystate: null,
	frames: null,
	score: null
};

Game.gridSize = {row: 26, col: 26};

Game.gridObject = {
  grass: 0,
  snake: 1,
  food: 2
};

Game.direction = {
  left: 0,
  up: 1,
  right: 2,
  down: 3
};

Game.key = {
  left: 37,
  up: 38,
  right: 39,
  down: 40
};

function Grid (defaultObject, cols, rows) {
  this.cols = cols;
  this.rows = rows;

  this._grid = [];
  for (var x = 0;x < this.cols;x++) {
    this._grid.push([]);
   	for (var y = 0;y < this.rows; y++) {
      this._grid[x].push(defaultObject);
    }
  }
};

Grid.prototype.set = function (value, x, y) {
  this._grid[x][y] = value;
};

Grid.prototype.get = function (x, y) {
  return this._grid[x][y];
};

Grid.prototype.getEmptyCells = function () {
	var emptyCells = [];
	// iterate through the grid and find all empty cells
  for (var x = 0;x < this.cols;x++) {
    for (var y = 0;y < this.rows;y++) {
			if (Game.grid.get(x, y) === Game.gridObject.grass) {
				emptyCells.push({x:x, y:y});
			}
		}
  }

	return emptyCells;
};

Grid.prototype.setFood = function () {
    var emptyCells = this.getEmptyCells();
    // chooses a random cell
    var randpos = emptyCells[Math.round(Math.random()*(emptyCells.length - 1))];
    Game.grid.set(Game.gridObject.food, randpos.x, randpos.y);
};

function Snake (snakePathIndexes, direction) {
  /* snakePathIndexes - array of x and y cordinates for drawing the snake.
     first cordinate is tail and last is head. */
  // @todo: check if snakePathIndexes is valid data
  if (Array.isArray(snakePathIndexes) && snakePathIndexes.length > 0) {
  	this._queue = snakePathIndexes;
    this.head = this.head = this._queue[this._queue.length - 1];
  } else {
  	throw "snakePathIndexes should be an array with at least one element";
  }

  this.direction = direction || this._getDirection();
};

Snake.prototype._getDirection = function () {
  /*
   * detect the sankes direction using the last two nodes if possible
   * or return right as a default if there is only one node
   */

  var length = this._queue.length;
  if (length >= 2) {
  	var snakeHead = this._queue[length - 1];
  	var snakeSecondNode = this._queue[length -1];

    if (snakeHead.x > snakeSecondNode.x) {
      return Game.direction.down;
    } else if (snakeHead.x < snakeSecondNode.x) {
    	return Game.direction.up;
    } else if (snakeHead.y < snakeSecondNode.y) {
    	return Game.direction.left;
    } else if (snakeHead.y < snakeSecondNode.y) {
    	return Game.direction.right;
    }
  }

  return Game.direction.right;
};

Snake.prototype.insert = function (x, y) {
	this._queue.push({x:x, y:y});
	this.head = this._queue[this._queue.length - 1];
};

Snake.prototype.remove = function () {
	return this._queue.shift();
};

Snake.prototype.addToGridd = function (grid) {
 	for (var i = 0;i < this._queue.length;i++) {
    var snakeSegment = this._queue[i];
    grid.set(Game.gridObject.snake, snakeSegment.x, snakeSegment.y);
  }
};

/**
 * Starts the game
 */
function main() {
    // create and initiate the canvas element
    Game.canvas = document.createElement("canvas");
    Game.canvas.width = Game.gridSize.col*20;
    Game.canvas.height = Game.gridSize.row*20;
    Game.ctx = Game.canvas.getContext("2d");

    // add the canvas element to the body of the document
    document.body.appendChild(Game.canvas);

    // sets an base font for bigger score display
    Game.ctx.font = "12px Helvetica";

    Game.frames = 0;
    Game.keystate = {};
    // keeps track of the keybourd input
    document.addEventListener("keydown", function(evt) {
        Game.keystate[evt.keyCode] = true;
    });
    document.addEventListener("keyup", function(evt) {
        delete Game.keystate[evt.keyCode];
    });

    // intatiate game objects and starts the game loop
    init();
    loop();
}

/**
 * Resets and inits game objects
 */
function init() {
    Game.score = 0;

    Game.grid = new Grid(
      Game.gridObject.grass,
      Game.gridSize.col,
      Game.gridSize.row);

    var estimateCenterCell = {x:Math.floor(Game.gridSize.col/2), y:Game.gridSize.row-1};
    Game.snake = new Snake([{x:5, y:5}, {x:5, y:4}, {x:6, y:4}]);
  	Game.snake.addToGridd(Game.grid);
    Game.grid.setFood();
}

/**
 * The game loop function, used for game updates and rendering
 */
function loop() {
    update();
    draw();
    // When ready to redraw the canvas call the loop function
    // first. Runs about 60 frames a second
    window.requestAnimationFrame(loop);
}

/**
 * Updates the game logic
 */
function update() {
    Game.frames++;

    // changing direction of the snake depending on which keys
    // that are pressed
    if (Game.keystate[Game.key.left] && Game.snake.direction !== Game.direction.right) {
        Game.snake.direction = Game.direction.left;
    }
    if (Game.keystate[Game.key.up] && Game.snake.direction !== Game.direction.down) {
        Game.snake.direction = Game.direction.up;
    }
    if (Game.keystate[Game.key.right] && Game.snake.direction !== Game.direction.left) {
        Game.snake.direction = Game.direction.right;
    }
    if (Game.keystate[Game.key.down] && Game.snake.direction !== Game.direction.up) {
        Game.snake.direction = Game.direction.down;
    }

    // each five frames update the game state.
    if (Game.frames % 8 === 0) {
        // pop the last element from the snake queue i.e. the
        // head
        var nx = Game.snake.head.x;
        var ny = Game.snake.head.y;

        // updates the position depending on the snake direction
        switch (Game.snake.direction) {
            case Game.direction.left:
                nx--;
                break;
            case Game.direction.up:
                ny--;
                break;
            case Game.direction.right:
                nx++;
                break;
            case Game.direction.down:
                ny++;
                break;
        }

        // checks all gameover conditions
        if (0 > nx || nx > Game.grid.cols - 1  ||
            0 > ny || ny > Game.grid.rows - 1 ||
            Game.grid.get(nx, ny) === Game.gridObject.snake
        ) {
            return init();
        }

        // check wheter the new position are on the fruit item
        if (Game.grid.get(nx, ny) === Game.gridObject.food) {
            // increment the score and sets a new fruit position
            Game.score++;
            Game.grid.setFood();
        } else {
            // take out the first item from the snake queue i.e
            // the tail and remove id from grid
            var tail = Game.snake.remove();
            Game.grid.set(Game.gridObject.grass, tail.x, tail.y);
        }

        // add a snake id at the new position and append it to
        // the snake queue
        Game.grid.set(Game.gridObject.snake, nx, ny);
        Game.snake.insert(nx, ny);
    }
}

/**
 * Render the grid to the canvas.
 */
function draw() {
    // calculate tile-width and -height
    var tw = Game.canvas.width/Game.grid.cols;
    var th = Game.canvas.height/Game.grid.rows;
    // iterate through the grid and draw all cells
    for (var x=0; x < Game.grid.cols; x++) {
        for (var y=0; y < Game.grid.rows; y++) {
            // sets the fillstyle depending on the id of
            // each cell
            switch (Game.grid.get(x, y)) {
                case Game.gridObject.grass:
                    Game.ctx.fillStyle = "#007E30";
                    break;
                case Game.gridObject.snake:
                    Game.ctx.fillStyle = "#002000";
                    break;
                case Game.gridObject.food:
                    Game.ctx.fillStyle = "#C3B100";
                    break;
            }

            Game.ctx.fillRect(x*tw, y*th, tw, th);
        }
    }
    // changes the fillstyle once more and draws the score
    // message to the canvas
    Game.ctx.fillStyle = "#fff";
    Game.ctx.fillText("Score: " + Game.score, 10, Game.canvas.height - 10);
}

// start and run the game
main();
