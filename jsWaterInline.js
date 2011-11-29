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
 
 var inline_js_water = function inlineJsWater() {
  var stage = new Stage("myCanvas");
  var canvas = stage.getCanvas();
  var context = stage.getContext();
  var width = canvas.width;
  var height = canvas.height;
  var fluidApp = fluid_app_maker( context, 2000, 30, 30, width, height );
  var lastDisplayTime = 0;
  var displayFps = 0;
  var avgFps = 0;
  var dragTracker = create_drag_tracker("myCanvas");
  var jswater = {};
    
  canvas.addEventListener("mousedown", function() {
    var mousePos = stage.getMousePos();
    fluidApp.mouseDown(mousePos.x / width, mousePos.y / height, 0, 0);
    }, false);

  stage.setDrawStage(function() {

    var mousePos = stage.getMousePos();
    if (dragTracker.isDraggingLeftButton() && mousePos != null)
    {
      fluidApp.mouseDrag( mousePos.x / width, mousePos.y / height, 0 );
    }

    // update fluid
    var d = new Date();
    fluidApp.idle(d.getTime());

    // clear canvas
    //this.clear();

    avgFps = (avgFps * 14 + stage.getFps()) / 15;
    if (stage.getTime() > lastDisplayTime + 500)
    {
      lastDisplayTime = stage.getTime();
      displayFps = avgFps.toFixed(1);
    }

    // draw fluid
    fluidApp.draw();
    if (jswater.showFps)
    {
      context.fillStyle = "#ffffff"; // text color
      context.fillText("FPS: " + displayFps, 10, 10 );
    }
  });

  stage.startAnimation();
  
  // public API
  jswater.showFps = false;
  
  return jswater;
};