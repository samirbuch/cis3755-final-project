import { Card, Flex, Text, ActionIcon, Title, ThemeIcon } from "@mantine/core";
import { IconArrowUp, IconArrowDown, IconTrash } from "@tabler/icons-react";

export interface TimelineEventProps {
  position: number;
  eventTitle: string | null;
  eventDescription: string | null;
  eventTimestamp: {
    year: number;
    month: number;
    day: number;
  };
  numNodes: number;
  numLinks: number;

  onClickUp?: () => void;
  onClickDown?: () => void;
  onClickDelete?: () => void;
}
export default function TimelineEvent(props: TimelineEventProps) {
  return (
    <Card withBorder>
      <Flex direction="row" align="center" gap="md">
        <ThemeIcon radius="xl">
          <Text>{props.position}</Text>
        </ThemeIcon>
        <Flex direction="column">
          <Flex direction={"row"} align="center" gap="xs">
            <Title order={3}>{props.eventTitle || "(no title)"}</Title>
            <Text>
              {props.eventTimestamp.year}/{props.eventTimestamp.month}/
              {props.eventTimestamp.day}
            </Text>
          </Flex>
          <Text>{props.eventDescription || "(no description)"}</Text>

          <Text>
            {props.numNodes} nodes, {props.numLinks} links
          </Text>
        </Flex>

        {/* Buttons */}
        <Flex direction="column" align="center" gap="xs" ml="auto">
          <ActionIcon onClick={props.onClickUp}>
            <IconArrowUp />
          </ActionIcon>
          <ActionIcon color="red" onClick={props.onClickDelete}>
            <IconTrash />
          </ActionIcon>
          <ActionIcon onClick={props.onClickDown}>
            <IconArrowDown />
          </ActionIcon>
        </Flex>
      </Flex>
    </Card>
  );
}