import { Flex, SegmentedControl, Text, Title, ActionIcon, TextInput, Divider } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates"
import { useState } from "react";
import { IconPencil, IconCheck } from "@tabler/icons-react";

import Header from "@/components/Header";
import LinksPanel from "@/components/editor/LinksPanel";
import NodesPanel from "@/components/editor/NodesPanel";
import { EditorProvider, useEditorContext } from "@/contexts/EditorContext";
import styles from "@/styles/Editor.module.css";
import ImportExport from "@/components/editor/ImportExport";
import Graph from "@/components/editor/Graph";

export default function Editor() {
  return (
    <EditorProvider>
      <TheActualPage />
    </EditorProvider>
  )
}

function TheActualPage() {
  const [tab, setTab] = useState<"nodes" | "links">("nodes");
  const editorContext = useEditorContext();

  const [eventDate, setEventDate] = useState(
    new Date(`${editorContext.eventTimestamp.year}-${String(editorContext.eventTimestamp.month).padStart(2, "0")}-${String(editorContext.eventTimestamp.day + 1).padStart(2, "0")}`)
  );
  const [eventTitle, setEventTitle] = useState(editorContext.eventTitle);
  const [eventDescription, setEventDescription] = useState(editorContext.eventDescription);

  const [isEditingDate, setIsEditingDate] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);

  return (
    <Flex direction={"column"}>
      <Header title="Editor">
        <ImportExport />
      </Header>
      <Flex direction="row">
        <Flex flex={3}>
          {/* Svg container. Should take up majority of page width */}
          <Graph />
        </Flex>
        <Flex
          flex={1}
          direction={"column"}
          className={styles.editorPanel}
          gap={10}
        >
          {/* Editor panel. Should take up remaining width */}
          <Title order={3}>Event Time</Title>
          {!isEditingDate && (
            <Flex direction="row" align="center" justify={"space-between"}>
              <Text>
                {editorContext.eventTimestamp.year}-
                {String(editorContext.eventTimestamp.month).padStart(2, "0")}-
                {String(editorContext.eventTimestamp.day).padStart(2, "0")}
              </Text>

              <ActionIcon onClick={() => setIsEditingDate(true)}>
                <IconPencil />
              </ActionIcon>
            </Flex>
          )}
          {isEditingDate && (
            <Flex direction="row" align="center" justify={"space-between"}>
              <DatePickerInput
                value={eventDate}
                onChange={(date) => {
                  if (date) {
                    setEventDate(date);
                  }
                }}
              />

              <ActionIcon onClick={() => {
                if (eventDate) {
                  editorContext.setEventTimestamp({
                    year: eventDate.getFullYear(),
                    month: eventDate.getMonth() + 1,
                    day: eventDate.getDate(),
                  });
                }
                setIsEditingDate(false);
              }}>
                <IconCheck />
              </ActionIcon>
            </Flex>
          )}

          <Title order={3}>Event Title</Title>
          {!isEditingTitle && (
            <Flex direction="row" align="center" justify={"space-between"}>
              <Text>{editorContext.eventTitle || "(No title)"}</Text>

              <ActionIcon onClick={() => setIsEditingTitle(true)}>
                <IconPencil />
              </ActionIcon>
            </Flex>
          )}
          {isEditingTitle && (
            <Flex direction="row" align="center" justify={"space-between"}>
              <TextInput
                value={eventTitle ?? ""}
                onChange={(e) => {
                  setEventTitle(e.currentTarget.value);
                }}
              />

              <ActionIcon onClick={() => {
                editorContext.setEventTitle(eventTitle);
                setIsEditingTitle(false);
              }}>
                <IconCheck />
              </ActionIcon>
            </Flex>
          )}
          <Title order={3}>Event Description</Title>
          {!isEditingDescription && (
            <Flex direction="row" align="center" justify={"space-between"}>
              <Text>{editorContext.eventDescription || "(No description)"}</Text>

              <ActionIcon onClick={() => setIsEditingDescription(true)}>
                <IconPencil />
              </ActionIcon>
            </Flex>
          )}
          {isEditingDescription && (
            <Flex direction="row" align="center" justify={"space-between"}>
              <TextInput
                value={eventDescription ?? ""}
                onChange={(e) => {
                  setEventDescription(e.currentTarget.value);
                }}
              />

              <ActionIcon onClick={() => {
                editorContext.setEventDescription(eventDescription);
                setIsEditingDescription(false);
              }}>
                <IconCheck />
              </ActionIcon>
            </Flex>
          )}

          <Divider size="lg" mt="sm" mb="sm" />

          <SegmentedControl
            data={[
              { label: <Text>Nodes</Text>, value: "nodes" },
              { label: <Text>Connections</Text>, value: "links" },
            ]}
            defaultValue="nodes"
            onChange={(e) => {
              setTab(e as "nodes" | "links");
            }}
            value={tab}
          />

          {/* Add a scrollable container for the panels */}
          <div className={styles.panelContent}>
            {tab === "nodes" && <NodesPanel />}
            {tab === "links" && <LinksPanel />}
          </div>
        </Flex>
      </Flex>
    </Flex>
  )
}
