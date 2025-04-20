import { Flex, SegmentedControl, Text, Title } from "@mantine/core";
import { useRef, useState } from "react";

import Header from "@/components/Header";
import LinksPanel from "@/components/editor/LinksPanel";
import NodesPanel from "@/components/editor/NodesPanel";
import { EditorProvider, useEditorContext } from "@/contexts/EditorContext";
import styles from "@/styles/Editor.module.css";
import ImportExport from "@/components/ImportExport";
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

          <Title order={2}>Nodes & Links</Title>
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
