import { useCurrentNodes, useEditorContext } from "@/contexts/EditorContext";
import Link from "@/interfaces/Link";
import { Flex, Text, Button, Card, ActionIcon, Title, Group, Select, Fieldset, Slider } from "@mantine/core";
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
  const nodes = useCurrentNodes();

  const [fromSelected, setFromSelected] = useState(props.link.source.id);
  const [toSelected, setToSelected] = useState(props.link.target.id);

  const [fromPPM, setFromPPM] = useState(props.link.sourceToTargetPPM.ppm);
  const [fromMPPM, setFromMPPM] = useState(props.link.sourceToTargetPPM.mppm);
  const [toPPM, setToPPM] = useState(props.link.targetToSourcePPM.ppm);
  const [toMPPM, setToMPPM] = useState(props.link.targetToSourcePPM.mppm);

  const save = () => {
    setIsEditing(false);

    props.onLinkEdit({
      ...props.link,
      sourceToTargetPPM: {
        ppm: fromPPM,
        mppm: fromMPPM
      },
      targetToSourcePPM: {
        ppm: toPPM,
        mppm: toMPPM
      }
    });
  }

  return (
    <Card>
      <Flex direction="row" align={"center"} gap="lg">
        <Flex direction="column">
          <Title order={4}>From</Title>
          {!isEditing && <Text>{props.link.source.name}</Text>}
          {isEditing && (
            <Select
              searchable
              data={nodes
                .filter((node) => node.id !== toSelected) // Cannot connect to themselves
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
                    source: nodes.find((node) => node.id === parseInt(option.value))!
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
              data={nodes
                .filter((node) => node.id !== fromSelected) // Cannot connect to themselves
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
                    target: nodes.find((node) => node.id === parseInt(option.value))!
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
        <Flex direction="column" mt="md" gap="lg">
          <Fieldset legend="From -> To">
            <Text>Pings per Minute</Text>
            <Slider
              value={fromPPM}
              onChange={setFromPPM}
            />
            <Text mt="sm">Meaningful PPM</Text>
            <Slider
              value={fromMPPM}
              onChange={setFromMPPM}
            />
          </Fieldset>

          <Fieldset legend="To -> From">
            <Text>Pings per Minute</Text>
            <Slider
              value={toPPM}
              onChange={setToPPM}
            />
            <Text mt="sm">Meaningful PPM</Text>
            <Slider
              value={toMPPM}
              onChange={setToMPPM}
            />
          </Fieldset>

          <Button mt="sm" onClick={save}>
            Done
          </Button>
        </Flex>
      )}
    </Card>
  )
}