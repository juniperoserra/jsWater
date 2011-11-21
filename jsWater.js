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

  function isNaNDebug(num) {
    if (num != num)
    {
      return true;
    }
    return false;
  }

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

    function dotproduct(a,b) {
      var n = 0, lim = Math.min(a.length,b.length);
      for (var i = 0; i < lim; i++) n += a[i] * b[i];
      return n;
     }

    function isDirBlocked(dir)
    {
      if (x == 0 && (dir == DIRS.W || dir == DIRS.NW || dir == DIRS.SW))
      {
          return true;
      }
      if (x == FLUID_CELLS_X - 1 && (dir = DIRS.E || dir == DIRS.NE || dir == DIRS.SE))
      {
          return true;
      }
      if (y == 0 && (dir == DIRS.N || dir == DIRS.NE || dir == DIRS.NW))
      {
          return true;
      }
      if (y == FLUID_CELLS_Y - 1 && (dir == DIRS.S || dir == DIRS.SE || dir == DIRS.SW))
      {
          return true;
      }
      return false;
    }

    // public

    my.findNeighbors = function () {
      m_neighbors[0] = fluid.grid[ Math.min(x+1, FLUID_CELLS_X-1)][y];                                           // Right
      m_neighbors[1] = fluid.grid[ Math.min(x+1, FLUID_CELLS_X-1)][ Math.min(y+1, FLUID_CELLS_Y - 1)];                          // Right Top
      m_neighbors[2] = fluid.grid[x][Math.min(y+1, FLUID_CELLS_Y - 1)];                                          // Top
      m_neighbors[3] = fluid.grid[Math.max(0, x-1)][Math.min(y+1, FLUID_CELLS_Y - 1)];              // Left Top
      m_neighbors[4] = fluid.grid[Math.max(0, x-1)][y];                               // Left
      m_neighbors[5] = fluid.grid[Math.max(0, x-1)][ Math.max(0, y-1) ]; // Left bottom
      m_neighbors[6] = fluid.grid[x][Math.max(0, y-1)];                             // Bottom
      m_neighbors[7] = fluid.grid[Math.min(x+1, FLUID_CELLS_X-1)][Math.max(0, y-1)];             // Right Bottom
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
        m_boundaryPotentials[i] = (my.pressure - m_neighbors[i].pressure) * 0.0625;
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
          isNaNDebug(m_neighbors[i].pressure);
          my.pressure = my.pressure - m_boundaryPotentials[i];
          isNaNDebug(my.pressure);
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
          isNaNDebug(my.pressure);
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
       isNaNDebug(cell.pressure);
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
        isNaNDebug(my.grid[x][y].pressure);
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
  
  function fmod (x, y) {
    // Returns the remainder of dividing x by y as a float  
    // 
    // version: 1109.2015
    // discuss at: http://phpjs.org/functions/fmod
    // +   original by: Onno Marsman
    // +      input by: Brett Zamir (http://brett-zamir.me)
    // +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // *     example 1: fmod(5.7, 1.3);
    // *     returns 1: 0.5
    var tmp, tmp2, p = 0,
    pY = 0,
    l = 0.0,
    l2 = 0.0;

    tmp = x.toExponential().match(/^.\.?(.*)e(.+)$/);
    p = parseInt(tmp[2], 10) - (tmp[1] + '').length;
    tmp = y.toExponential().match(/^.\.?(.*)e(.+)$/);
    pY = parseInt(tmp[2], 10) - (tmp[1] + '').length;

    if (pY > p) {
      p = pY;
    }

    tmp2 = (x % y);

    if (p < -100 || p > 20) {
      // toFixed will give an out of bound error so we fix it like this:
      l = Math.round(Math.log(tmp2) / Math.log(10));
      l2 = Math.pow(10, l);

      return (tmp2 / l2).toFixed(l - p) * l2;
    } else {
      return parseFloat(tmp2.toFixed(-p));
    }
  }
  
  my.sampleFlow = function ( x, y ) {
    var sampleX = (x+1) * FLUID_CELLS_X;
    while (sampleX > FLUID_CELLS_X) {
      sampleX = sampleX - FLUID_CELLS_X;
    }
    
    
    var baseX = Math.floor(sampleX);
    var fracX = sampleX - baseX;
    
    var sampleY = (y+1) * FLUID_CELLS_Y;
    while (sampleY > FLUID_CELLS_Y) {
      sampleY = sampleY - FLUID_CELLS_Y;
    }
    
    var baseY = Math.floor(sampleY);
    var fracY = sampleY - baseY;
    
    if (y != y || x != x)
    {
      var isNAN = true;
    }
    
    //console.debug(  "x: " + x);
    //console.debug(  "y: " + y);

    //console.debug(  "baseX: " + (baseX+1)%FLUID_CELLS_X );
    //console.debug(  "baseY: " + (baseY+1)%FLUID_CELLS_Y );
    
    if (baseX < 0 || baseY < 0 || baseX >= FLUID_CELLS_X || baseY >= FLUID_CELLS_Y)
    {
      var NO1 = true;
    }
    var obj = my.grid[baseX][baseY];
    if (!obj)
    {
      var NO = true;
    }
    
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
