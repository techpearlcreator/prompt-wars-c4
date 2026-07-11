/**
 * Stadium coordinates lookup maps sections and concession booths to a 2D layout.
 */
const sectionCoordinates = {
  "112": { x: 75, y: 70, label: "Section 112" },
  "104": { x: 25, y: 30, label: "Section 104" },
  "128": { x: 25, y: 75, label: "Section 128" },
  "143": { x: 75, y: 25, label: "Section 143" }
};

const targetCoordinates = {
  "restroom": { x: 70, y: 72, label: "🚻 Restroom (Sec 112)", eta: "1 min", distance: "25m" },
  "restroom_104": { x: 28, y: 28, label: "🚻 Restroom (Sec 104)", eta: "2 mins", distance: "45m" },
  "pizza": { x: 80, y: 65, label: "🍕 Nonna's Pizza (Sec 114)", eta: "2 mins", distance: "50m" },
  "pizza_324": { x: 20, y: 80, label: "🍕 Nonna's Pizza (Sec 324)", eta: "4 mins", distance: "95m" },
  "elevator": { x: 72, y: 68, label: "🛗 Elevator (Sec 112)", eta: "1 min", distance: "18m" },
  "gate_c": { x: 78, y: 62, label: "🚧 Gate C Outflow", eta: "3 mins", distance: "70m" }
};

/**
 * Returns coordinate maps and walking ETAs.
 */
function getMapCoordinates(section, targetKeyword) {
  const secKey = String(section).trim();
  const start = sectionCoordinates[secKey] || sectionCoordinates["112"];
  
  const kw = String(targetKeyword).toLowerCase();
  let target = targetCoordinates["restroom"]; // Default fallback

  if (kw.includes("restroom") && secKey === "104") {
    target = targetCoordinates["restroom_104"];
  } else if (kw.includes("restroom")) {
    target = targetCoordinates["restroom"];
  } else if (kw.includes("pizza") && kw.includes("324")) {
    target = targetCoordinates["pizza_324"];
  } else if (kw.includes("pizza") || kw.includes("food")) {
    target = targetCoordinates["pizza"];
  } else if (kw.includes("elevator") || kw.includes("lift")) {
    target = targetCoordinates["elevator"];
  } else if (kw.includes("gate") || kw.includes("exit")) {
    target = targetCoordinates["gate_c"];
  }

  return {
    start,
    target
  };
}

module.exports = {
  getMapCoordinates
};
