import { useEditorContext } from "@/contexts/EditorContext";
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

  const editorContext = useEditorContext();

  const [fromSelected, setFromSelected] = useState(props.link.source.id);
  const [toSelected, setToSelected] = useState(props.link.target.id);

  return (
    <Card>
      <Flex direction="row" align={"center"} gap="lg">
        <Flex direction="column">
          <Title order={4}>From</Title>
          {!isEditing && <Text>{props.link.source.name}</Text>}
          {isEditing && (
            <Select
              searchable
              data={editorContext.nodes
                .filter((node) => node.id !== toSelected)
                .map((node) => ({
                  value: node.id.toString(),
                  label: node.name
                }))}
              // defaultValue={fromSelected.toString()}
              allowDeselect={false}

              value={fromSelected.toString()} // the ID
              onChange={(_value, option) => {
                if (option) {
                  setFromSelected(parseInt(option.value));
                  props.onLinkEdit({
                    ...props.link,
                    source: editorContext.nodes.find((node) => node.id === parseInt(option.value))!
                  });
                }
              }}
            />
          )}
        </Flex>
        <IconArrowRight />
        <Flex direction="column">
          <Title order={4}>To</Title>
          {!isEditing && <Text>{props.link.target.name}</Text>}
          {isEditing && (
            <Select
              searchable
              data={editorContext.nodes
                .filter((node) => node.id !== fromSelected)
                .map((node) => ({
                  value: node.id.toString(),
                  label: node.name
                }))}
              // defaultValue={toSelected.toString()}
              allowDeselect={false}

              value={toSelected.toString()} // the ID
              onChange={(_value, option) => {
                if (option) {
                  setToSelected(parseInt(option.value));
                  props.onLinkEdit({
                    ...props.link,
                    source: editorContext.nodes.find((node) => node.id === parseInt(option.value))!
                  });
                }
              }}
            />
          )}
        </Flex>

        {!isEditing && <Group style={{ marginLeft: "auto" }}>
          <ActionIcon onClick={() => setIsEditing(true)}>
            <IconPencil />
          </ActionIcon>
          <ActionIcon onClick={() => props.onLinkDelete(props.link)} color="red">
            <IconTrash />
          </ActionIcon>
        </Group>}
      </Flex>
      {isEditing && (
        <Button mt="sm" onClick={() => setIsEditing(false)}>
          Done
        </Button>
      )}
    </Card>
  )
}