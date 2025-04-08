import { useEffect, forwardRef, useImperativeHandle, useRef } from "react";
import { v4 as uuidv4 } from "uuid";

export type Coordinates = { x: number; y: number };

export interface PointProps {
  id?: string;
  size?: number;
  color?: string;
  onClick?: (id: string) => void;

  style?: React.CSSProperties;
}
export interface PointRef {
  x: number;
  y: number;
}
const Point = forwardRef<PointRef, PointProps>((props, ref) => {
  const id = props.id ?? uuidv4();

  const divRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    x: divRef.current?.getBoundingClientRect().x ?? 0,
    y: divRef.current?.getBoundingClientRect().y ?? 0,
  }))

  useEffect(() => {
    // if(props.ref) props.ref.current = ref;
    
    console.log(divRef?.current);
    console.log(divRef?.current?.getBoundingClientRect());
  }, [ref]);

  return (
    <div 
      ref={divRef}
      
      id={id}
      style={{
        height: props.size ?? 20,
        width: props.size ?? 20,
        backgroundColor: props.color ?? "#FFF",
        borderRadius: "50%",

        ...props.style
      }}

      onClick={() => props.onClick?.(id)}
    />
  )
});

Point.displayName = "Point";

export default Point;