import Node from "@/interfaces/Node";
import { ActionIcon, Card, Checkbox, ColorInput, Flex, Group, TextInput, Title } from "@mantine/core";
import { useState } from "react";
import { IconCheck, IconTrash, IconPencil } from "@tabler/icons-react";

export interface NodeCardProps {
  node: Node;
  onNodeEdit: (node: Node) => void;
  onNodeDelete: (node: Node) => void;
}
export default function NodeCard(props: NodeCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(props.node.name);
  const [isHighlighted, setIsHighlighted] = useState(props.node.highlighted);
  const [color, setColor] = useState(props.node.color);

  function handleNameChange() {
    props.onNodeEdit({ ...props.node, name, color });
    setIsEditing(false);
  }

  return (
    <Card>
      {!isEditing && (
        <Flex direction="row" align={"center"} justify="space-between">
          <Title order={3}>{props.node.name}</Title>
          <Group>
            <ActionIcon onClick={() => setIsEditing(true)}>
              <IconPencil />
            </ActionIcon>
            <ActionIcon onClick={() => props.onNodeDelete(props.node)} color="red">
              <IconTrash />
            </ActionIcon>
          </Group>
        </Flex>
      )}
      {isEditing && (
        <Flex direction="column" gap="sm">
          <TextInput
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            rightSection={
              <ActionIcon onClick={handleNameChange}>
                <IconCheck />
              </ActionIcon>
            }
          />
          <Checkbox
            checked={isHighlighted}
            onChange={(event) => {
              setIsHighlighted(event.currentTarget.checked);
              props.onNodeEdit({ ...props.node, highlighted: event.currentTarget.checked });
            }}
            label="Is highlighted"
          />
          <ColorInput
            label="Node color"
            value={color}
            onChange={(color) => {
              setColor(color);
            }}
          />
        </Flex>
      )}
    </Card>
  )
} 