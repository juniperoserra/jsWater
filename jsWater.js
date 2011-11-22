/**
 * jsWater pressure-based fluid simulation v0.01
 * http://www.upfork.com/
 * Copyright 2011, Simon Greenwold
 * Licensed under the MIT or GPL Version 2 licenses.
 * Date: November 3 2011
 *
 * Copyright (C) 2011 by Simon Greenwold
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
 
 Array.prototype.setAll = function(v) {
    var i, n = this.length;
    for (i = 0; i < n; ++i) {
        this[i] = v;
    }
};

var fluid_maker = function (FLUID_CELLS_X, FLUID_CELLS_Y) {
  var my = {};

  var CONSERVATION = 0.97;
  var N_PARTICLES = 4800;
  var PI = 3.1415926534;
  var HALF_PI = 3.1415926534 / 2.0;
  var INV_SQRT_TWO = 1.0 / Math.sqrt(2.0);
  var SWISH_RADIUS = 2;
  var PARTIAL_CLEAR = 0.20;

  var dirVecs = [ 
    [1,0],
    [INV_SQRT_TWO,INV_SQRT_TWO],
    [0,1],
    [-INV_SQRT_TWO,INV_SQRT_TWO],
    [-1,0],
    [-INV_SQRT_TWO,-INV_SQRT_TWO],
    [0,-1],
    [INV_SQRT_TWO,-INV_SQRT_TWO]
  ];

  var X0 = 0;
  var Y0 = 1;
  var X1 = 2;
  var Y1 = 3;

  var DIRS =
  {
      E  : 0,
      NE : 1,
      N  : 2,
      NW : 3,
      W  : 4,
      SW : 5,
      S  : 6,
      SE : 7
  };

  var cell_maker = function (fluid, _x, _y) {
    var my = {};
    my.pressure = 0;
    my.flow = [0,0];

    // private
    var x = _x;
    var y = _y;
    var m_boundaryPotentials = [0,0,0,0,0,0,0,0];
    var m_prevBoundaryPotentials = [0,0,0,0,0,0,0,0];
    var m_addedBoundaryFlow = [0,0,0,0,0,0,0,0];
    var m_neighbors = [];  // CCW from East
    var m_isBlocked = [];  // CCW from East

    function dotproduct(a,b) {
      var n = 0, lim = Math.min(a.length,b.length);
      for (var i = 0; i < lim; i++) n += a[i] * b[i];
      return n;
     }

    function isDirBlocked(dir)
    {
      return m_isBlocked[dir];
    }

    // public

    my.findNeighbors = function () {
      m_neighbors[DIRS.E]  = fluid.grid[ Math.min(x+1, FLUID_CELLS_X-1)][y];                                           // Right
      m_neighbors[DIRS.NE] = fluid.grid[ Math.min(x+1, FLUID_CELLS_X-1)][ Math.min(y+1, FLUID_CELLS_Y - 1)];                          // Right Top
      m_neighbors[DIRS.N]  = fluid.grid[x][Math.min(y+1, FLUID_CELLS_Y - 1)];                                          // Top
      m_neighbors[DIRS.NW] = fluid.grid[Math.max(0, x-1)][Math.min(y+1, FLUID_CELLS_Y - 1)];              // Left Top
      m_neighbors[DIRS.W]  = fluid.grid[Math.max(0, x-1)][y];                               // Left
      m_neighbors[DIRS.SW] = fluid.grid[Math.max(0, x-1)][ Math.max(0, y-1) ]; // Left bottom
      m_neighbors[DIRS.S]  = fluid.grid[x][Math.max(0, y-1)];                             // Bottom
      m_neighbors[DIRS.SE] = fluid.grid[Math.min(x+1, FLUID_CELLS_X-1)][Math.max(0, y-1)];             // Right Bottom
    
      m_isBlocked[DIRS.E]  = (x === FLUID_CELLS_X-1);
      m_isBlocked[DIRS.NE] = (x === FLUID_CELLS_X-1 && y === 0);
      m_isBlocked[DIRS.N]  = (y === 0);
      m_isBlocked[DIRS.NW] = (x === 0 && y == 0);
      m_isBlocked[DIRS.W]  = (x === 0);
      m_isBlocked[DIRS.SW] = (x === 0 && y == FLUID_CELLS_Y-1);
      m_isBlocked[DIRS.S]  = (y == FLUID_CELLS_Y-1);
      m_isBlocked[DIRS.SE] = (x === FLUID_CELLS_X-1 && y == FLUID_CELLS_Y-1);
    };


    my.clear = function ()
    {
        for (var i = 0; i < 8; ++i)
        {
            m_boundaryPotentials[i] = 0;
        }

        my.pressure = 0;
        my.flow = [0,0];
    };

    my.calculateFlow = function () {
      my.flow = [0,0];
      for (var i = 0; i < 8; ++i)
      {
          my.flow[0] = my.flow[0] + dirVecs[i][0] * m_boundaryPotentials[i] * 16;
          my.flow[1] = my.flow[1] + dirVecs[i][1] * m_boundaryPotentials[i] * 16;
      }
    };


    my.sumOfPositivePotentials = function ()
    {
        var sum =
        (m_boundaryPotentials[0] > 0 ? m_boundaryPotentials[0] : 0) +
        (m_boundaryPotentials[1] > 0 ? m_boundaryPotentials[1] : 0) +
        (m_boundaryPotentials[2] > 0 ? m_boundaryPotentials[2] : 0) +
        (m_boundaryPotentials[3] > 0 ? m_boundaryPotentials[3] : 0) +
        (m_boundaryPotentials[4] > 0 ? m_boundaryPotentials[4] : 0) +
        (m_boundaryPotentials[5] > 0 ? m_boundaryPotentials[5] : 0) +
        (m_boundaryPotentials[6] > 0 ? m_boundaryPotentials[6] : 0) +
        (m_boundaryPotentials[7] > 0 ? m_boundaryPotentials[7] : 0);
        return sum;
    };

    my.calculatePotentials = function () {
      for (var i = 0; i < 8; ++i)
      {
        var other = m_neighbors[i];
        if (isDirBlocked(i)) other = my;
        
        m_boundaryPotentials[i] = (my.pressure - other.pressure) * 0.0625;
        if (i % 2 == 1) // Diagonal
        {
          m_boundaryPotentials[i] *= 0.5;//*= INV_SQRT_TWO;
        }
      }
    };
    
    my.distributePressures = function () {
      for (var i = 0; i < 8; ++i)
      {
        m_boundaryPotentials[i] += CONSERVATION * m_prevBoundaryPotentials[i] + m_addedBoundaryFlow[i];

        if (!isDirBlocked(i)) {
          m_neighbors[i].pressure =  m_neighbors[i].pressure + m_boundaryPotentials[i];
          my.pressure = my.pressure - m_boundaryPotentials[i];
        }

        m_prevBoundaryPotentials[i] = m_boundaryPotentials[i];
        m_addedBoundaryFlow[i] = 0;
      }
    };
    
    
    my.addBoundaryFlow = function ( vec ) {
      var perpvec = [ -vec[1], vec[0] ];

      for (var i = 0; i<8; ++i) {
        if (isDirBlocked(i))
        {
          my.pressure = my.pressure + mag( vec );
        }
        else {
          var dotVal = dotproduct(vec, dirVecs[i]);

          m_addedBoundaryFlow[i] += dotVal * 0.25;
          m_addedBoundaryFlow[(i+4)%8] -= dotVal * 0.125;
          m_addedBoundaryFlow[(i-4)%8] -= dotVal * 0.125;
        }
      }
    };

    return my;
  };

  function applyToGrid(func) {
    for (var x = 0; x < FLUID_CELLS_X; x++) {
      for (var y = 0; y < FLUID_CELLS_Y; y++) {
         func(my.grid[x][y]);
      }
    }
  }

  function clearGrid() {
     applyToGrid( function(cell) {
       cell.clear();
     });
  }
   
  function calculatePotentials() {
     applyToGrid( function(cell) {
       cell.calculatePotentials();
     });
  }
  
  function clearPressures() {
     applyToGrid( function(cell) {
       cell.setPressure(0);
     });
  }
  
  function distributePressures() {
     applyToGrid( function(cell) {
       cell.distributePressures();
     });
  }
  
  function multiplyPressures( multiplier ) {
     applyToGrid( function(cell) {
       cell.pressure = multiplier * cell.pressure;
     });
  }
  
  function zeroSumPressures() {
    var pressureAdjuster = 0;
    for (var x = 0; x < FLUID_CELLS_X; x++) {
      for (var y = 0; y < FLUID_CELLS_Y; y++) {
        pressureAdjuster = pressureAdjuster + my.grid[x][y].pressure;
      }
    }
    pressureAdjuster = pressureAdjuster / (- (FLUID_CELLS_X*FLUID_CELLS_Y));
      
    for (var x = 0; x < FLUID_CELLS_X; x++) {
      for (var y = 0; y < FLUID_CELLS_Y; y++) {
        my.grid[x][y].pressure = my.grid[x][y].pressure + pressureAdjuster;
      }
    }
  }
  
  function calculateFlows() {
     applyToGrid( function(cell) {
       cell.calculateFlow();
     });
  }
  
  function totalPressurePotential() {
    var sum = 0;
    for (var x = 0; x < FLUID_CELLS_X; x++) {
      for (var y = 0; y < FLUID_CELLS_Y; y++) {
        sum = sum + my.grid[x][y].sumOfPositivePotentials();
      }
    }
    return sum;
  }


  my.step = function() {
    // Clear pressures
    zeroSumPressures();
    calculatePotentials();
    // Ask cells to distribute their pressures
    distributePressures();
    calculateFlows();
  };
  
  function findCell( xCoord, yCoord ) {
    return [ Math.floor(xCoord * FLUID_CELLS_X - 0.5 + FLUID_CELLS_X) % FLUID_CELLS_X, 
             Math.floor(yCoord * FLUID_CELLS_Y - 0.5 + FLUID_CELLS_Y) % FLUID_CELLS_Y ];
  }
  
  function mag(vec) {
    //return fastSqrt_Bab(vec[0] * vec[0] + vec[1] * vec[1]);
    return Math.sqrt(vec[0] * vec[0] + vec[1] * vec[1]);
    //return fastSqrt(vec[0] * vec[0] + vec[1] * vec[1]);
  }
  
  my.swish = function(x, y, vecX, vecY) {
    var center = findCell(x, y);
    var xCenter = center[0] % FLUID_CELLS_X;
    var yCenter = center[1] % FLUID_CELLS_Y;

    var vec = [vecX, vecY];
    for (var dx = -SWISH_RADIUS; dx <= SWISH_RADIUS; dx++) {

      // For toroidal mapping:
      //int xCell = (xCenter + dx + FLUID_CELLS_X) % FLUID_CELLS_X;

      // For bounded:
      var xCell = Math.max(0, Math.min(xCenter + dx, FLUID_CELLS_X-1));

      for (var dy = -SWISH_RADIUS; dy <= SWISH_RADIUS; dy++) {
        // Doing additive stuff here is quite controversial

        // For toroidal mapping:
        //FluidCell* cell = grid()[xCell][(yCenter + dy + FLUID_CELLS_Y) % FLUID_CELLS_Y];

        // For bounded:
        var cell = my.grid[xCell][ Math.max(0, Math.min(yCenter+dy, FLUID_CELLS_Y-1)) ];

        // TODO: Falloff function here needs attention
        var divisor = 1 + mag( [dx, dy] );
        vec[0] = vecX / divisor;
        vec[1] = vecY / divisor;

        cell.addBoundaryFlow( vec );
      }
    }
  };
  
  my.sampleFlow = function ( x, y ) {
    
    //var sampleX = Math.max(0, Math.min(x, 0.999999999999)) * FLUID_CELLS_X;
    //var sampleY = Math.max(0, Math.min(y, 0.999999999999)) * FLUID_CELLS_Y;
    // It looks like individual bounds tests are faster than Math.min/max
    
    var sampleX = x * FLUID_CELLS_X;
    var sampleY = y * FLUID_CELLS_Y;
    if (sampleX >= FLUID_CELLS_X) sampleX -= FLUID_CELLS_X;
    if (sampleX < 0) sampleX = 0;
    if (sampleY >= FLUID_CELLS_Y) sampleY -= FLUID_CELLS_Y;
    if (sampleY < 0) sampleY = 0;
    
    var baseX = Math.floor(sampleX);
    var fracX = sampleX - baseX;
    
    var baseY = Math.floor(sampleY);
    var fracY = sampleY - baseY;
    
    return [ my.grid[baseX][baseY].flow[0] * (1.0 - fracX) + my.grid[(baseX+1)%FLUID_CELLS_X][baseY].flow[0] * fracX,
             my.grid[baseX][baseY].flow[1] * (1.0 - fracY) + my.grid[baseX][(baseY+1)%FLUID_CELLS_Y].flow[1] * fracY ];
  };

  my.grid = new Array(FLUID_CELLS_X);

  // Construction:
  function init() {
    for (var i = 0; i < FLUID_CELLS_X; i++) {
      my.grid[i] = new Array(FLUID_CELLS_Y);
    }
    
    for (var x = 0; x < FLUID_CELLS_X; x++) {
      for (var y = 0; y < FLUID_CELLS_Y; y++) {
        my.grid[x][y] = cell_maker(my, x, y);
      }
    }
    
    applyToGrid( function(cell) {
       cell.findNeighbors();
     });
  }
  
  init();
  return my;
};
