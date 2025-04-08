import { useEffect } from "react";

export interface ConnectionProps {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  color?: string;
  strokeWidth?: number;
}
export default function Connection(props: ConnectionProps) {
  useEffect(() => {
    console.log("Connection props changed", props);
  }, [props]);

  // Calculate bounding box if needed for other reasons; otherwise, here we draw the line relative to the viewport.
  const svgStyle: React.CSSProperties = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    zIndex: 9999,
  };

  return (
    <svg style={svgStyle}>
      <line 
        x1={props.fromX}
        y1={props.fromY}
        x2={props.toX}
        y2={props.toY}
        stroke={props.color ?? "#FFF"}
        strokeWidth={props.strokeWidth ?? 5}
      />
    </svg>
  )
}