import { Flex, Title } from "@mantine/core";
import { useRef } from "react"

import styles from "@/styles/Editor.module.css";
import Header from "@/components/Header";

export default function Editor() {
  const svgContainerRef = useRef<SVGSVGElement>(null);

  return (
    <Flex direction={"column"}>
      <Header title="Editor" />
      <Flex direction="row">
        <Flex flex={3}>
          {/* Svg container. Should take up 2/3 of the page width */}
          <svg
            ref={svgContainerRef}
            style={{
              width: "100%",
              height: "100vh",
              // backgroundColor: "lightgray",
            }}
          ></svg>
        </Flex>
        <Flex
          flex={1}
          direction={"column"}
          className={styles.editorPanel}
        >
          {/* Editor panel. Should take up remainder */}

          <Title order={2}>Editor Panel</Title>
        </Flex>
      </Flex>
    </Flex>
  )
}