import { useEditorContext } from "@/contexts/EditorContext";
import Link from "@/interfaces/Link";
import { Flex, Text, Button, Card, ActionIcon, Title, Group, Select, Fieldset, Slider, Tooltip } from "@mantine/core";
import { IconArrowRight, IconPencil, IconRefresh, IconTrash } from "@tabler/icons-react";
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

  const swap = () => {
    setFromSelected(toSelected);
    setToSelected(fromSelected);

    props.onLinkEdit({
      ...props.link,
      source: props.link.target,
      target: props.link.source,
      sourceToTargetPPM: {
        ppm: toPPM,
        mppm: toMPPM
      },
      targetToSourcePPM: {
        ppm: fromPPM,
        mppm: fromMPPM
      }
    })
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
              data={editorContext.nodes
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
                    target: editorContext.nodes.find((node) => node.id === parseInt(option.value))!
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
            <Text>Ping Rate</Text>
            <Slider
              value={fromPPM}
              onChange={setFromPPM}
              min={0}
              max={10}
            />
            <Text mt="sm">Meaningful Pings</Text>
            <Slider
              value={fromMPPM}
              onChange={setFromMPPM}
              min={0}
              max={10}
            />
          </Fieldset>

          <Fieldset legend="To -> From">
            <Text>Ping Rate</Text>
            <Slider
              value={toPPM}
              onChange={setToPPM}
              min={0}
              max={10}
            />
            <Text mt="sm">Meaningful Pings</Text>
            <Slider
              value={toMPPM}
              onChange={setToMPPM}
              min={0}
              max={10}
            />
          </Fieldset>

          <Flex mt="sm" direction="row" gap="lg" align="center">
            <Tooltip label="Swap To & From">
              <ActionIcon onClick={swap}>
                <IconRefresh />
              </ActionIcon>
            </Tooltip>
            <Button onClick={save} fullWidth>
              Done
            </Button>
          </Flex>
        </Flex>
      )}
    </Card>
  )
}