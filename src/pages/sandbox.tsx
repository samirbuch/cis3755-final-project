import CenteredOnPage from "@/components/CenteredOnPage";
import Connection from "@/components/Connection";
import Point, { Coordinates, PointRef } from "@/components/Point";
import { Flex, Title } from "@mantine/core";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

export default function Sandbox() {
  const point1Ref = useRef<PointRef>(null);
  const point2Ref = useRef<PointRef>(null);

  const [point1XY, setPoint1XY] = useState<Coordinates>({ x: 0, y: 0 });
  const [point2XY, setPoint2XY] = useState<Coordinates>({ x: 0, y: 0 });

  useLayoutEffect(() => {
    if (point1Ref.current) {
      setPoint1XY({
        x: point1Ref.current.x,
        y: point1Ref.current.y,
      });
    }
    if (point2Ref.current) {
      setPoint2XY({
        x: point2Ref.current.x,
        y: point2Ref.current.y,
      });
    }
  }, []);

  return (
    <CenteredOnPage>
      <Flex direction="column" gap="sm">
        <Title>Sandbox</Title>
        <Flex gap="sm">
          <Point />
          <Point size={30} />
          <Point size={40} color="#FF0000" ref={point1Ref} />

          <Connection
            fromX={point1XY.x}
            fromY={point1XY.y ?? 0}
            toX={point2XY.x}
            toY={point2XY.y ?? 0}
            color="#FFF"
            strokeWidth={5}
          />

          <Point style={{ marginLeft: "2rem" }} size={40} color="#00FF00" ref={point2Ref} />
        </Flex>
      </Flex>
    </CenteredOnPage>
  )
}