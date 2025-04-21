import Waypoint from "@/interfaces/Waypoint";
import { Card, Flex, Text, Title } from "@mantine/core";

export interface WaypointCardProps {
  waypoint: Waypoint;
}
export default function WaypointCard(props: WaypointCardProps) {
  const { waypoint } = props;

  return (
    <Card>
      <Flex direction={"column"} gap={10}>
        <Title order={3}>Waypoint {waypoint.id}</Title>
        <Flex></Flex>
      </Flex>
    </Card>
  )
}
