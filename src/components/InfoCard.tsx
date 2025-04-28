import { Card, Flex, Title, Text, Switch, Tooltip } from "@mantine/core";
import { IconDirectionArrows } from "@tabler/icons-react";

export interface InfoCardProps {
  title: string;
  description: string;
  date: { year: number; month: number; day: number };
  showSwitch?: boolean;
  onSwitchChange?: (checked: boolean) => void;
  switchDefaultChecked?: boolean;
}
export default function InfoCard(props: InfoCardProps) {
  const { date } = props;
  const formattedDate = new Date(date.year, date.month - 1, date.day).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Card maw={350} withBorder>
      <Flex direction={"column"} gap="xs">
        <Title order={3}>{props.title}</Title>
        <Text>{formattedDate}</Text>
        <Text>{props.description}</Text>
        {props.showSwitch && (
          <Switch
            label="Show highlights"
            defaultChecked={props.switchDefaultChecked}
            onChange={e => props.onSwitchChange?.(e.currentTarget.checked)}
          />
        )}
      </Flex>

      <Tooltip label="Drag me!" zIndex={101}>
        <IconDirectionArrows
          stroke={1.5}
          size={30}
          style={{
            position: "absolute",
            bottom: 10,
            right: 10,
          }} // Position bottom right
        />
      </Tooltip>
    </Card>
  )
}