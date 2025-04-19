import Link from "@/interfaces/Link";
import { Flex, Text, Button, Card, ActionIcon, Title, Group, Select } from "@mantine/core";
import { IconArrowRight, IconPencil, IconTrash } from "@tabler/icons-react";
import { useState } from "react";

export interface LinkCardProps {
  link: Link;
  onLinkEdit: (link: Link) => void;
  onLinkDelete: (link: Link) => void;
}
export default function LinkCard(props: LinkCardProps) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <Card>
      <Flex direction="row" align={"center"} gap="lg">
        <Flex direction="column">
          <Title order={4}>From</Title>
          <Text>{props.link.source.name}</Text>
        </Flex>
        <IconArrowRight />
        <Flex direction="column">
          <Title order={4}>To</Title>
          <Text>{props.link.target.name}</Text>
        </Flex>

        <Group style={{ marginLeft: "auto" }}>
          <ActionIcon>
            <IconPencil />
          </ActionIcon>
          <ActionIcon onClick={() => props.onLinkDelete(props.link)} color="red">
            <IconTrash />
          </ActionIcon>
        </Group>
      </Flex>
    </Card>
  )
}