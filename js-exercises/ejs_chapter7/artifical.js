var plan = ["############################",
            "#      #    #      o      ##",
            "#                          #",
            "#          #####           #",
            "##         #   #    ##     #",
            "###           ##     #     #",
            "#           ###      #     #",
            "#   ####                   #",
            "#   ##       o             #",
            "# o  #         o       ### #",
            "#    #                     #",
            "############################"];
            
function Vector(x,y){
  this.x = x;
  this.y = y;
}
Vector.prototype.plus = function(other){
  return new Vector(this.x + other.x, this.y + other.y);
};
var grid = ["top left",    "top middle",    "top right",
            "bottom left", "bottom middle", "bottom right"];
print(grid[0 + (1 * 3)]);

function Grid(width, height){
  this.space = new Array(width * height);
  this.width = width;
  this.height = height;
}
Grid.prototype.isInside = function(vector){
  return vector.x >= 0 && vector.x < this.width &&
         vector.y >= 0 && vector.y < this.height;
};
Grid.prototype.get = function(vector){
  return this.space[vector.x + vector.y * this.width];
}
Grid.prototype.set = function(vector, value){
  this.space[vector.x + vector.y * this.width] = value;
}
var grid = new Grid(5, 5);
print(grid.get(new Vector(1, 1)));
// → undefined
grid.set(new Vector(1, 1), "X");
print(grid.get(new Vector(1, 1)));
// → X

var directions = {
  "n": new Vector(0,-1),
  "ne": new Vector(1,-1),
  "e": new Vector(1,0),
  "se": new Vector(1,1),
  "s": new Vector(0,1),
  "sw": new Vector(-1,1),
  "w": new Vector(-1,0),
  "nw": new Vector(-1,-1)
};

function randomElement(array){
  return array[Math.floor(Math.random() * array.length)];
}
var directionNames = "n ne e se s sw w nw".split(" ");

function BouncingCritter(){
  this.direction = randomElement(directionNames);
}

BouncingCritter.prototype.act = function(view){
  if (view.look(this.direction) != " "){
    this.direction = view.find(" ") || "s";
  }
  return { type: "move", direction: this.direction };
};

function elementFromChar(legend, ch){
  if (ch == " "){
    return null;
  }
  var element = new legend[ch]();
  element.originChar = ch;
  return element;
}

function World(map, legend){
  var grid = new Grid(map[0].length, map.length);
  this.grid = grid;
  this.legened = legend;

  map.forEach(function(line, y){
    for (var x = 0; x < line.length; x += 1){
      grid.set(new Vector(x, y),
               elementFromChar(legend, line[x]));
    }
  });
}

function charFromElement(element){
  if (element == null){
    return " ";
  }
  else {
    return element.originChar;
  }
}

World.prototype.toString = function(){
  var output = "";
  for (var y = 0; y < this.grid.height; y += 1){
    for (var x = 0; x < this.grid.width; x += 1){
      var element = this.grid.get(new Vector(x, y));
      output += charFromElement(element);
    }
    output += "\n";
  }
  return output;
}

function Wall(){};
var world = new World(plan, {"#": Wall,
                             "o": BouncingCritter});
print(world.toString());

Grid.prototype.forEach = function(f, context){
  for (var y = 0; y < this.height; y += 1){
    for (var x = 0; x < this.width; x += 1){
      var value = this.space[x + y * this.width];
      if (value != null){
        f.call(context, value, new Vector(x, y));
      }
    }
  }
};

World.prototype.turn = function(){
  var acted = [];
  this.grid.forEach(function(critter, vector){
    if (critter.act && acted.indexOf(critter) == -1){
      acted.push(critter);
      this.letAct(critter, vector);
    }
  }, this);
};

World.prototype.letAct = function(critter, vector){
  var action = critter.act(new View(this, vector));
  if (action && action.type == "move"){
    var dest = this.checkDestination(action, vector);
    if (dest && this.grid.get(dest) == null){
      this.grid.set(vector, null);
      this.grid.set(dest, critter);
    }
  }
};

World.prototype.checkDestination = function(action, vector){
  if (directions.hasOwnProperty(action.direction)){
    var dest = vector.plus(directions[action.direction]);
    if (this.grid.isInside(dest)){
      return dest;
    }
  }
};

function View(world, vector){
  this.world = world;
  this.vector = vector;
}
View.prototype.look = function(dir){
  var target = this.vector.plus(directions[dir]);
  if (this.world.grid.isInside(target)){
    return charFromElement(this.world.grid.get(target));
  }
  else {
    return "#";
  }
};
View.prototype.findAll = function(ch){
  var found = [];
  for (var dir in directions){
    if (this.look(dir) == ch){
      found.push(dir);
    }
  }
  return found;
};
View.prototype.find = function(ch){
  var found = this.findAll(ch);
  if (found.length === 0){
    return null;
  }
  return randomElement(found);
};

for (var i = 0; i < 5; i++) {
  world.turn();
  print(world.toString());
}

function dirPlus(dir, n){
  var index = directionNames.indexOf(dir);
  return directionNames[(index + n + 8) % 8];
}

function WallFollower(){
  this.dir = "s";
}

WallFollower.prototype.act = function(view){
  var start = this.dir;
  if (view.look(dirPlus(this.dir, -3)) != " "){
    start = this.dir = dirPlus(this.dir, -2);
  }
  while (view.look(this.dir) != " "){
    this.dir = dirPlus(this.dir, 1);
    if (this.dir == start){
      break;
    }
  }
  return {type: "move", direction: this.dir};
};

function LifelikeWorld(map,legend){
  World.call(this, map, legend);
}

LifelikeWorld.prototype = Object.create(World.prototype);

var actionTypes = Object.create(null);

LifelikeWorld.prototype.letAct = function(critter, vector){
  var action = critter.act(new View(this, critter, vector, action));
  var handled = action && action.type in actionTypes && actionTypes[action.type].call(this, critter, vector, action);
  if (!handled){
    critter.energy -= 0.2;
    if (critter.energy <= 0){
      this.grid.set(vector, null);
    }
  }
};

actionTypes.grow = function(critter){
  critter.energy += 0.5;
  return true;
};

actionTypes.move = function(critter, vector, action){
  var dest = this.checkDestination(action, vector);
  if (dest == null || critter.energy <= 1 || this.grid.get(dest) != null){
    return false;
  }
  critter.energy -= 1;
  this.grid.set(vector, null);
  this.grid.set(dest, critter);
  return true;
};

actionTypes.eat = function(critter, vector, action){
  var dest = this.checkDestination(action, vector);
  var atDest = dest != null && this.grid.get(dest);
  if (!atDest || atDest.energy == null){
    return false;
  }
  critter.energy += atDest.energy;
  this.grid.set(dest, null);
  return true;
};

actionTypes.reproduce = function(critter, vector, action){
  var baby = elementFromChar(this.legend, critter.originChar);
  var dest = this.checkDestination(action, vector);
  if (dest == null || critter.energy <= 2 * baby.energy || this.grid.get(dest) != null){
    return false;
  }
  critter.energy -= 2 * baby.energy;
  this.grid.set(dest, baby);
  return true;
};

function Plant(){
  this.energy = 3 + Math.random() * 4;
}

Plant.prototype.act = function(view){
  if (this.energy > 15){
    var space = view.find(" ");
    if (space){
      return {
        type: "reproduce",
        direction: space
      };
    }
    if (this.energy < 20){
      return {
        type: "grow"
      };
    }
  }
};

function PlantEater(){
  this.energy = 20;
}
PlantEater.prototype.act = function(view){
  var space = view.find(" ");
  if (this.energy > 60 && space){
    return {
      type: "reproduce",
      direction: space
    };
  }
  var plant = view.find("*");
  if (plant){
    return {
      type: "eat",
      direction: plant
    };
  }
  if (space){
    return {
      type: "move",
      direction: space
    };
  }
};

function SmartPlantEater(){
  this.energy = 20;
  this.dir = "s";
  this.counter = 0;
  PlantEater.call(this);
}

SmartPlantEater.prototype = Object.create(PlantEater.prototype);

SmartPlantEater.prototype.act = function(view){
  var space = view.findAll(" ");
  var plant = view.find("*");
  if (this.energy > 120 && space.length >= 4){
    return {
      type: "reproduce",
      direction: space[0]
    };
  }
  if (plant && this.energy < 150 && this.counter >= 4){
    return {
      type: "eat",
      direction: plant
    };
  }
  if (space){
    var start = this.dir;
    if (view.look(dirPlus(this.dir, -3)) != " ")
      start = this.dir = dirPlus(this.dir, -2);
    if (view.look(dirPlus(this.dir)) == "*"){
      return {
        type: "move",
        direction: this.dir
      };
    }
    while (view.look(this.dir) != " ") {
      this.dir = dirPlus(this.dir, 1);
      if (this.dir == start) break;
    }
    return {
      type: "move",
      direction: this.dir
    };
  }
};

function Tiger() {
        this.energy = 30;
        this.direction = "e";
    this.counter = 0;
    this.env = "     ".split(" ");
}

Tiger.prototype.act = function(view){
  var space = view.find(" ");
  var tofu = view.find("O");
  this.counter += 1;
  if (this.energy >= 120){
        return {
      type: "reproduce",
      direction: space
    };
  }
  if (tofu) {
        this.env.push("O");
    this.env.shift();
    if (this.env.filter(function(x){
        return x === "O"
    }).length > 1){
      return {
          type: "eat",
          direction: tofu
      };
    }
  }
  if (view.look(this.direction) != " " && space){
    this.env.push("x");
    this.env.shift();
    this.direction = space;
  }
  return {
    type: "move",
    direction: this.direction
  };
};