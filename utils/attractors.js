export function getAttractorParams(selectedAttractor) {
  switch (selectedAttractor) {
    case "lorenz":
      return { loopNb: 10000, scale: 5 };
    case "rossler":
      return { loopNb: 10000, scale: 10 };
    case "aizawa":
      return { loopNb: 15000, scale: 50 };
    case "arneodo":
      return { loopNb: 15000, scale: 10 };
    case "sprottB":
      return { loopNb: 20000, scale: 15 };
    case "sprottLinzF":
      return { loopNb: 15000, scale: 30 };
    case "halvorsen":
      return { loopNb: 10000, scale: 10 };
  }
}