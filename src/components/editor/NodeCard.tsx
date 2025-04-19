import Node from "@/interfaces/Node";
import { ActionIcon, Card, Flex, Group, TextInput, Title } from "@mantine/core";
import { useState } from "react";
import { IconCheck, IconTrash, IconPencil } from "@tabler/icons-react";

export interface NodeCardProps {
  node: Node;
  onNodeEdit: (node: Node) => void;
  onNodeDelete: (node: Node) => void;
}
export default function NodeCard(props: NodeCardProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [name, setName] = useState(props.node.name);

  function handleNameChange() {
    if (name !== props.node.name) {
      props.onNodeEdit({ ...props.node, name });
    }
    setIsEditingName(false);
  }

  return (
    <Card>
      {!isEditingName && (
        <Flex direction="row" align={"center"} justify="space-between">
          <Title order={3}>{props.node.name}</Title>
          <Group>
            <ActionIcon onClick={() => setIsEditingName(true)}>
              <IconPencil />
            </ActionIcon>
            <ActionIcon onClick={() => props.onNodeDelete(props.node)} color="red">
              <IconTrash />
            </ActionIcon>
          </Group>
        </Flex>
      )}
      {isEditingName && (
        <TextInput
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          rightSection={<ActionIcon onClick={handleNameChange}>
            <IconCheck />
          </ActionIcon>}
        />
      )}
    </Card>
  )
} 