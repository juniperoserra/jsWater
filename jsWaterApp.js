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
 
var fluid_app_maker = function ( context, N_PARTICLES, xCells, xCells, width, height ) {
  var my = {};

  var FLUID_CELLS_X = xCells;
  var FLUID_CELLS_Y = xCells;
  var MIN_UPDATE_INTERVAL = 10;
  var REDEPLOY_PROB = 100.0;
  var VELOCITY_SCALE = 1.0;
  
  var fluid;
  var lastIdleTime;
  var lastDragTime;
  var dragDt;
  var drawFlows = false;
  var drawParticles = true;
  var drawPressure = false;
  var W = width;
  var H = height;
  var particlesArrayLen = N_PARTICLES*4;
  var particles = new Array(particlesArrayLen); //[4];  // 4 values: last position, current position
  var particleFlows = new Array(particlesArrayLen); //[4];  // 4 values: last position, current position
  var particleMasses = new Array(N_PARTICLES);
  var epoch;
  var mouseVelocities = [];
  var mousePreviousPositions = [];
  var performDrags = false;

  var X0 = 0;
  var Y0 = 1;
  var X1 = 2;
  var Y1 = 3;

  function randomMass()
  {
    return Math.random() + 1;
    //return 1;
  }

  function initFluid()
  {

    fluid = fluid_maker(FLUID_CELLS_X, FLUID_CELLS_Y);

    if (drawParticles) {
      var x, y;
      for (var i = 0; i < particlesArrayLen; i = i + 4) {
        x = Math.random();
        y = Math.random();
        particles[i+X0] = x;
        particles[i+Y0] = y;
        particles[i+X1] = x;
        particles[i+Y1] = y;
        
        particleFlows[i+X0] = 0;
        particleFlows[i+Y0] = 0;
        particleFlows[i+X1] = 0;
        particleFlows[i+Y1] = 0;
        
        particleMasses[i/4] =  randomMass();
      }
    }

    my.mouseDown(0, 0, 0, 0);
  }

  function init() {
    FLUID_CELLS_Y = Math.floor((FLUID_CELLS_X * H) / W);
    var d = new Date();
    epoch = d.getTime();    
    lastIdleTime = epoch;
    lastDragTime = epoch;
    initFluid();
  }

  // inherited

  // virtual void multiClick(int count, int touches);
  // index is for multi-touch. For single-touch index = 0
  my.mouseDown = function (x, y, button, index) {
    if (index >= mouseVelocities.length)
    {
      mouseVelocities.length = index+1;
      mousePreviousPositions.length = index+1;
    }

    mouseVelocities[index] = {x: 0, y: 0};
    mousePreviousPositions[index] = {x: x, y: y}; 
  };

  my.mouseDrag = function ( x, y, index) {
    var d = new Date()
    var currentTime = d.getTime();
    
    //if (!performDrags) {
    //  return;
    //}
    dragDt = currentTime - lastDragTime;
    lastDragTime = currentTime;

    if (index >= mouseVelocities.length) {
      mouseVelocities.length = index+1;
      mousePreviousPositions.length = index+1;
    }

    if (dragDt < 2.0) return;

    mouseVelocities[index] = {x: VELOCITY_SCALE * (x - mousePreviousPositions[index].x) / dragDt,
      y: VELOCITY_SCALE * (y - mousePreviousPositions[index].y) / dragDt};

    fluid.swish(x, y, mouseVelocities[index].x, mouseVelocities[index].y);
    mousePreviousPositions[index] = {x: x, y: y};    
  };

  my.beginDrags = function (currentTime) {
    dragDt = currentTime - lastDragTime;
    performDrags = (dragDt >= MIN_UPDATE_INTERVAL);
    if (performDrags)
    {
      lastDragTime = currentTime;
    }
  };

  my.idle = function (currentTime) {
    if (currentTime - lastIdleTime >= MIN_UPDATE_INTERVAL) {
      
      if (drawParticles) {
        for (var i = 0; i < particlesArrayLen; i = i + 4) {
          var redeploy = (particles[i+X1] >= 1) || (particles[i+X1] < 0) || (particles[i+Y1] >= 1) || (particles[i+Y1] < 0) ||
          (Math.random() * REDEPLOY_PROB <= 1); 

          //len = sqLen(particle, particles[i + 2]);
          //if (len < REDEPLOY_LEN && len > 0)
          if (redeploy)
          {
            var fX = Math.random();
            var fY = Math.random();
            particles[i+X0] = fX;
            particles[i+Y0] = fY;
            particles[i+X1] = fX;
            particles[i+Y1] = fY;
            
            particleFlows[i+X0] = 0;
            particleFlows[i+Y0] = 0;
            particleFlows[i+X1] = 0;
            particleFlows[i+Y1] = 0;
            
            particleMasses[i/4] = randomMass();
          }
          else
          {
            particles[i+X0] = particles[i+X1];
            particles[i+Y0] = particles[i+Y1];
            
            particleFlows[i+X0] = particleFlows[i+X1];
            particleFlows[i+Y0] = particleFlows[i+Y1];

            //var flow0 = fluid.sampleFlow(particles[i+X0], particles[i+Y0]);
            particles[i+X1] = particles[i+X1] + particleFlows[i+X0]; //flow0[0] / particleMasses[i/4];
            particles[i+Y1] = particles[i+Y1] + particleFlows[i+Y0]; //flow0[1] / particleMasses[i/4];
            
          }
        }
      }
      
      fluid.step();
      //    printf("Update took: %d\n", currentTime - lastIdleTime);
      lastIdleTime = currentTime;
      
      if (drawParticles) {
        for (var i = 0; i < particlesArrayLen; i = i + 4) {
          var flow1 = fluid.sampleFlow(particles[i+X1], particles[i+Y1]);
          particleFlows[i+X1] = flow1[0] / particleMasses[i/4];
          particleFlows[i+Y1] = flow1[1] / particleMasses[i/4];
        }
      }
    }
  };

  my.draw = function() {
    context.fillStyle = 'rgba(0,0,0,0.15)';
    context.fillRect(0, 0, context.canvas.width, context.canvas.height);
    
    if (drawParticles) {
      context.beginPath();
      context.lineWidth = 1;
      for (var i = 0; i < particlesArrayLen; i = i + 4) {
        context.moveTo(particles[i+X0] * W, particles[i+Y0] * H);
        //context.lineTo(particles[i+X1] * W, particles[i+Y1] * H);
        
        var midX = particleFlows[i+X0] - particleFlows[i+X1];
        var midY = particleFlows[i+Y0] - particleFlows[i+Y1];
        
        var avgX = (particles[i+X0] + particles[i+X1])/2;
        var avgY = (particles[i+Y0] + particles[i+Y1])/2;
        
        context.quadraticCurveTo(
          (avgX + midX / 4) * W, (avgY + midY / 4) * H,
          particles[i+X1] * W, particles[i+Y1] * H
        );
      }
      
      var hue = hue + 10 * Math.random();
      context.strokeStyle = 'rgba(255,255,255,255)';
      //context.strokeStyle = 'hsl(' + hue + ', 50%, 50%)';
      //context.shadowColor = 'white';
      //context.shadowBlur = 10;
      
      context.stroke();
    }
  };

  init();
  return my;
};