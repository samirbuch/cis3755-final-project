"use client";

import React from "react";
import { createTheme, MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { EditorProvider } from "@/contexts/EditorContext";

const theme = createTheme({});

export default function Providers({ children }: { children?: React.ReactNode }) {
  return (
    <MantineProvider theme={theme} forceColorScheme="dark">
      <Notifications />
      <EditorProvider>
        {children}
      </EditorProvider>
    </MantineProvider>
  )
}