import Node from "./Node";

export default interface Link {
  id: number;
  source: Node;
  target: Node;
  // distance: number;

  toPPM: {
    ppm: number;
    mppm: number;
  };
  fromPPM: {
    ppm: number;
    mppm: number;
  }
}