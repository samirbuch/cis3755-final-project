gsap.registerPlugin(ScrollTrigger);
const svg = d3.select("#canvas");

// === Scrollytelling boilerplate === //
function ScrollTrigger(n, offset, onScrollDown, onScrollUp) {
  const el = document.getElementById(n)
  return new Waypoint({
    element: el,
    handler: function (direction) {
      direction == 'down' ? onScrollDown() : onScrollUp();
    },
    //start 75% from the top of the div
    offset: offset
  });
};

svg
  .attr('width', 500)
  .attr('height', 700)
  .style("background-color", "#919191")

//set up grid spacing
let spacing = 10;
let rows = 77;
let columns = 52

const data = d3.range(columns * rows).map(() => 5);

const rects = svg.selectAll('rect')
  .data(data)
  .join('rect')
  .attr('x', (d, i) => ((i % columns) * spacing) + 2)
  .attr('y', (d, i) => (Math.floor(i / columns) * spacing) + 2)
  .attr('width', spacing - 4)
  .attr('height', spacing - 4)
  .attr('fill', 'white')
  .attr('opacity', 0.75);

function resetGrid() {
  // Select all the rectangles, transition their opacity and fill to grey.
  rects
    .transition()
    .duration(1000)
    .attr('fill', 'white')
    .attr('opacity', 0.75);
  svg
    .transition()
    .duration(1000)
    .style("background-color", "#919191")
}

function scrollToMostOfUs() {
  resetGrid();

  rects
    .filter((d, i) => i < columns * 20)
    .transition()
    .duration(700)
    .attr('fill', '#919191')
    .attr('opacity', 1);
}

// "How most people use their phones at night" - Jess
// true!!!! - samir
function scrollToSleep() {
  resetGrid();

  rects
    .filter((d, i) => i < columns * 39)
    .transition()
    .duration(700)
    .attr('fill', '#919191')
    .attr('opacity', 1);
}

function scrollToWork() {
  resetGrid();

  rects
    .filter((d, i) => i < columns * 52)
    .transition()
    .duration(700)
    .attr('fill', '#919191')
    .attr('opacity', 1);
}

function scrollToTeeth() {
  resetGrid();

  rects
    .filter((d, i) => i < columns * 53)
    .transition()
    .duration(700)
    .attr('fill', '#919191')
    .attr('opacity', 1);
  
}

function scrollToReflect() {
  resetGrid();
  svg
    .transition()
    .style("background-color", "#171717")
  rects
    .transition()
    .attr('opacity', 0);
}

// Unique: Because it's the first
new ScrollTrigger("most-of-us", "20%", scrollToMostOfUs, resetGrid);

new ScrollTrigger("sleep", "50%", scrollToSleep, scrollToMostOfUs);

new ScrollTrigger("work", "75%", scrollToWork, scrollToSleep);

new ScrollTrigger("teeth", "75%", scrollToTeeth, scrollToWork);

new ScrollTrigger("reflection", "75%", scrollToReflect, scrollToTeeth);