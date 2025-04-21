import { Flex, Group, SegmentedControl, Text, Title } from "@mantine/core";
import { useRef, useState } from "react";

import Header from "@/components/Header";
import LinksPanel from "@/components/editor/LinksPanel";
import NodesPanel from "@/components/editor/NodesPanel";
import { EditorProvider, useEditorContext } from "@/contexts/EditorContext";
import styles from "@/styles/Editor.module.css";
import ImportExport from "@/components/ImportExport";
import Graph from "@/components/editor/Graph";
import WaypointsPanel from "@/components/editor/WaypointsPanel";

export default function Editor() {
  return (
    <EditorProvider>
      <TheActualPage />
    </EditorProvider>
  )
}

function TheActualPage() {
  const [tab, setTab] = useState<"waypoints" | "nodes" | "links">("waypoints");

  return (
    <Flex direction={"column"}>
      <Header title="Editor">
        <ImportExport />

        <Group style={{ marginLeft: "auto" }}>
          <Title order={3}>View:</Title>
          <SegmentedControl
            color="blue"
            data={[
              { label: <Text>Waypoints</Text>, value: "waypoints" },
              { label: <Text>Nodes</Text>, value: "nodes" },
              { label: <Text>Links</Text>, value: "links" },
            ]}
            onChange={(e) => {
              setTab(e as "nodes" | "links" | "waypoints");
            }}
            value={tab}
          />
        </Group>
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

          {/* Add a scrollable container for the panels */}
          <div className={styles.panelContent}>
            {tab === "waypoints" && <WaypointsPanel />}
            {tab === "nodes" && <NodesPanel />}
            {tab === "links" && <LinksPanel />}
          </div>
        </Flex>
      </Flex>
    </Flex>
  )
}
