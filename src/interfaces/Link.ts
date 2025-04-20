import Node from "./Node";

export default interface Link {
  id: number;
  source: Node;
  target: Node;
  // distance: number;

  sourceToTargetPPM: {
    ppm: number;
    mppm: number;
  };
  targetToSourcePPM: {
    ppm: number;
    mppm: number;
  }
}